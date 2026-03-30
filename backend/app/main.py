"""FastAPI backend for LA Filter Dashboard."""

import os
from contextlib import asynccontextmanager

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

from .data_loader import get_column_metadata, load_course_details, load_merged_data

import math

load_dotenv()


def df_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame to list of dicts, replacing NaN/inf with None."""
    records = df.to_dict(orient="records")
    for rec in records:
        for k, v in rec.items():
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                rec[k] = None
    return records

# Global data store
merged_df: pd.DataFrame = pd.DataFrame()
course_details: dict = {}
column_metadata: list[dict] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global merged_df, course_details, column_metadata
    merged_df = load_merged_data()
    course_details = load_course_details()
    column_metadata = get_column_metadata(merged_df)
    yield


app = FastAPI(title="LA Filter Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---


class FilterCondition(BaseModel):
    field: str
    operator: str  # eq, neq, gt, gte, lt, lte, contains, empty, not_empty
    value: str | float | int | None = None


class FilterGroup(BaseModel):
    logic: str = "AND"  # AND or OR
    conditions: list[FilterCondition] = []


class FilterRequest(BaseModel):
    groups: list[FilterGroup] = []
    logic: str = "AND"  # logic between groups


class EmailRequest(BaseModel):
    to: list[str]
    subject: str
    body: str


class GenerateEmailRequest(BaseModel):
    description: str
    context: str = ""


# --- Filter logic ---


def apply_filter(df: pd.DataFrame, req: FilterRequest) -> pd.DataFrame:
    if not req.groups:
        return df

    group_masks = []
    for group in req.groups:
        if not group.conditions:
            continue
        cond_masks = []
        for cond in group.conditions:
            if cond.field not in df.columns:
                continue
            col = df[cond.field]
            mask = pd.Series([True] * len(df), index=df.index)

            if cond.operator == "empty":
                mask = col.isna() | (col.astype(str).str.strip() == "")
            elif cond.operator == "not_empty":
                mask = col.notna() & (col.astype(str).str.strip() != "")
            elif cond.value is not None:
                if cond.operator == "eq":
                    if pd.api.types.is_numeric_dtype(col):
                        mask = col == float(cond.value)
                    else:
                        mask = col.astype(str).str.lower() == str(cond.value).lower()
                elif cond.operator == "neq":
                    if pd.api.types.is_numeric_dtype(col):
                        mask = col != float(cond.value)
                    else:
                        mask = col.astype(str).str.lower() != str(cond.value).lower()
                elif cond.operator == "gt":
                    mask = pd.to_numeric(col, errors="coerce") > float(cond.value)
                elif cond.operator == "gte":
                    mask = pd.to_numeric(col, errors="coerce") >= float(cond.value)
                elif cond.operator == "lt":
                    mask = pd.to_numeric(col, errors="coerce") < float(cond.value)
                elif cond.operator == "lte":
                    mask = pd.to_numeric(col, errors="coerce") <= float(cond.value)
                elif cond.operator == "contains":
                    mask = col.astype(str).str.lower().str.contains(
                        str(cond.value).lower(), na=False
                    )

            cond_masks.append(mask)

        if cond_masks:
            if group.logic == "OR":
                group_mask = cond_masks[0]
                for m in cond_masks[1:]:
                    group_mask = group_mask | m
            else:
                group_mask = cond_masks[0]
                for m in cond_masks[1:]:
                    group_mask = group_mask & m
            group_masks.append(group_mask)

    if not group_masks:
        return df

    if req.logic == "OR":
        final_mask = group_masks[0]
        for m in group_masks[1:]:
            final_mask = final_mask | m
    else:
        final_mask = group_masks[0]
        for m in group_masks[1:]:
            final_mask = final_mask & m

    return df[final_mask]


# --- Routes ---


@app.get("/api/students")
def get_students():
    """Get all students with merged data."""
    return df_to_records(merged_df)


@app.post("/api/students/filter")
def filter_students(req: FilterRequest):
    """Filter students based on conditions."""
    filtered = apply_filter(merged_df, req)
    return {
        "students": df_to_records(filtered),
        "count": len(filtered),
        "total": len(merged_df),
    }


@app.get("/api/course")
def get_course():
    """Get course details."""
    return course_details


@app.get("/api/columns")
def get_columns():
    """Get column metadata for building filters."""
    return column_metadata


@app.post("/api/email/send")
def send_email(req: EmailRequest):
    """Simulate sending email."""
    return {
        "success": True,
        "message": f"Email simulated to {len(req.to)} recipient(s)",
        "recipients": req.to,
    }


@app.post("/api/email/generate")
def generate_email(req: GenerateEmailRequest):
    """Generate email content using OpenAI."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenAI API key not configured. Add OPENAI_API_KEY to .env file.",
        )

    client = OpenAI(api_key=api_key)

    prompt = f"""You are an educator writing an email to students in a university course called "Web Information Systems" (WIS2002).

Based on the following description, write a professional and supportive email:

Description: {req.description}

Context about the students: {req.context}

Write only the email body (no subject line). Use a warm but professional tone. Include placeholders like {{{{first_name}}}}, {{{{last_name}}}}, {{{{username}}}}, {{{{degree_program}}}} where appropriate."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )

    return {"content": response.choices[0].message.content}


@app.get("/api/dashboard/access-by-week")
def access_by_week():
    """Weekly unique students accessing the course."""
    access_cols = [c for c in merged_df.columns if c.startswith("access_")]
    result = []
    for col in access_cols:
        week = col.replace("access_", "")
        active_count = int((merged_df[col] > 0).sum())
        result.append({"week": week, "count": active_count, "total": len(merged_df)})
    return result


@app.post("/api/dashboard/access-by-week")
def access_by_week_filtered(req: FilterRequest):
    """Weekly access with optional filter for dual series."""
    access_cols = [c for c in merged_df.columns if c.startswith("access_")]
    filtered = apply_filter(merged_df, req)
    result = []
    for col in access_cols:
        week = col.replace("access_", "")
        all_count = int((merged_df[col] > 0).sum())
        filtered_count = int((filtered[col] > 0).sum())
        result.append({
            "week": week,
            "all": all_count,
            "filtered": filtered_count,
        })
    return result


@app.post("/api/dashboard/activities-by-week")
def activities_by_week(req: FilterRequest):
    """Weekly activity completion counts."""
    grade_cols = [c for c in merged_df.columns if c.startswith("grade_")]
    filtered = apply_filter(merged_df, req)
    result = []
    for col in grade_cols:
        week = col.replace("grade_", "")
        all_count = int((merged_df[col] > 0).sum())
        filtered_count = int((filtered[col] > 0).sum())
        result.append({
            "week": week,
            "all": all_count,
            "filtered": filtered_count,
        })
    return result


@app.post("/api/dashboard/applied-by-week")
def applied_by_week(req: FilterRequest):
    """Applied class completion by week."""
    applied_cols = [c for c in merged_df.columns if c.startswith("applied_")]
    filtered = apply_filter(merged_df, req)
    result = []
    for col in applied_cols:
        week = col.replace("applied_", "")
        all_count = int((merged_df[col] == 1).sum())
        filtered_count = int((filtered[col] == 1).sum())
        result.append({
            "week": week,
            "all": all_count,
            "filtered": filtered_count,
        })
    return result


@app.post("/api/dashboard/sankey")
def sankey_data(req: FilterRequest):
    """Generate Sankey diagram showing grade-band transitions across assessments.

    Stages: Weekly Activities (% completed) → Design Document → Web Project → Code Review.
    Each stage is split into grade bands. Links show how many students move
    between bands from one stage to the next.
    """
    filtered = apply_filter(merged_df, req)
    df = filtered.copy()

    grade_bands = [
        ("0-49%", 0, 49),
        ("50-64%", 50, 64),
        ("65-74%", 65, 74),
        ("75-84%", 75, 84),
        ("85-100%", 85, 100),
    ]
    band_labels = [b[0] for b in grade_bands]

    def classify(value, max_val=100):
        """Classify a numeric value into a grade band (as %)."""
        if pd.isna(value):
            return None
        pct = (value / max_val) * 100 if max_val != 100 else value
        for label, lo, hi in grade_bands:
            if lo <= pct <= hi:
                return label
        if pct > 100:
            return "85-100%"
        return "0-49%"

    # --- Stage 1: Weekly Activities as % of total possible ---
    grade_cols = [c for c in df.columns if c.startswith("grade_")]
    max_per_activity = 5
    total_possible = len(grade_cols) * max_per_activity
    df["_weekly_pct"] = (
        df[grade_cols].fillna(0).sum(axis=1) / total_possible * 100
    )
    df["_weekly_band"] = df["_weekly_pct"].apply(lambda v: classify(v, 100))

    # --- Stages 2-4: Major assessments (already out of 100) ---
    assessment_stages = ["Design Document", "Web Project", "Code Review"]
    for col in assessment_stages:
        df[f"_{col}_band"] = df[col].apply(lambda v: classify(v, 100))

    stages = ["Weekly Activities"] + assessment_stages
    band_col = {
        "Weekly Activities": "_weekly_band",
        "Design Document": "_Design Document_band",
        "Web Project": "_Web Project_band",
        "Code Review": "_Code Review_band",
    }

    # Build nodes: one per (stage, band) combo + a "Not Submitted" per assessment stage
    nodes = []
    node_index: dict[str, int] = {}
    for stage in stages:
        for band in band_labels:
            name = f"{stage}\n{band}"
            node_index[name] = len(nodes)
            nodes.append(name)
        # Add "Not Submitted" node for assessment stages (not weekly)
        if stage != "Weekly Activities":
            name = f"{stage}\nNot Submitted"
            node_index[name] = len(nodes)
            nodes.append(name)

    # Build links between consecutive stages
    links: list[dict] = []
    for i in range(len(stages) - 1):
        src_stage = stages[i]
        tgt_stage = stages[i + 1]
        src_col = band_col[src_stage]
        tgt_col = band_col[tgt_stage]

        # Get valid source bands
        src_bands = band_labels if src_stage == "Weekly Activities" else band_labels + ["Not Submitted"]
        tgt_bands = band_labels + ["Not Submitted"]

        for sb in src_bands:
            if src_stage == "Weekly Activities":
                src_mask = df[src_col] == sb
            else:
                src_mask = df[src_col] == sb if sb != "Not Submitted" else df[src_col].isna()

            for tb in tgt_bands:
                if tb == "Not Submitted":
                    tgt_mask = df[tgt_col].isna()
                else:
                    tgt_mask = df[tgt_col] == tb

                count = int((src_mask & tgt_mask).sum())
                if count > 0:
                    src_name = f"{src_stage}\n{sb}"
                    tgt_name = f"{tgt_stage}\n{tb}"
                    if src_name in node_index and tgt_name in node_index:
                        links.append({
                            "source": node_index[src_name],
                            "target": node_index[tgt_name],
                            "value": count,
                        })

    return {
        "nodes": [{"name": n} for n in nodes],
        "links": links,
    }
