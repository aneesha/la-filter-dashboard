"""Load and merge all CSV data into a single unified dataset."""

import os
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


def load_merged_data() -> pd.DataFrame:
    """Load all CSVs and merge into one DataFrame keyed by username."""
    enrolled = pd.read_csv(os.path.join(DATA_DIR, "enrolled_students.csv"))
    gradebook = pd.read_csv(os.path.join(DATA_DIR, "gradebook.csv"))
    access = pd.read_csv(os.path.join(DATA_DIR, "access.csv"))
    applied = pd.read_csv(os.path.join(DATA_DIR, "appliedclassstats.csv"))

    # Rename columns to avoid collisions
    access_cols = {c: f"access_{c}" for c in access.columns if c != "username"}
    access = access.rename(columns=access_cols)

    applied_cols = {c: f"applied_{c}" for c in applied.columns if c != "username"}
    applied = applied.rename(columns=applied_cols)

    gradebook_cols = {}
    for c in gradebook.columns:
        if c == "username":
            continue
        if "Activity" in c:
            gradebook_cols[c] = f"grade_{c}"
        else:
            gradebook_cols[c] = c
    gradebook = gradebook.rename(columns=gradebook_cols)

    # Merge all on username
    df = enrolled.merge(gradebook, on="username", how="left")
    df = df.merge(access, on="username", how="left")
    df = df.merge(applied, on="username", how="left")

    # Add dummy email
    df["email"] = df["username"] + "@student.university.edu.au"

    return df


def load_course_details() -> dict:
    """Load course details."""
    course = pd.read_csv(os.path.join(DATA_DIR, "course_details.csv"))
    return course.iloc[0].to_dict()


def get_column_metadata(df: pd.DataFrame) -> list[dict]:
    """Return metadata about filterable columns."""
    meta = []
    for col in df.columns:
        info = {"field": col, "type": "text", "category": "Student Info"}

        if col in ("username", "first_name", "last_name", "email"):
            info["type"] = "text"
            info["category"] = "Student Info"
        elif col == "degree_program":
            info["type"] = "select"
            info["category"] = "Student Info"
            info["options"] = sorted(df[col].dropna().unique().tolist())
        elif col.startswith("grade_"):
            info["type"] = "number"
            info["category"] = "Weekly Activities"
            info["min"] = 0
            info["max"] = 5
        elif col in ("Design Document", "Web Project", "Code Review", "Exam"):
            info["type"] = "number"
            info["category"] = "Assessments"
            info["min"] = 0
            info["max"] = 100
        elif col.startswith("access_"):
            info["type"] = "number"
            info["category"] = "LMS Access"
            info["min"] = 0
            info["max"] = int(df[col].max()) if df[col].notna().any() else 100
        elif col.startswith("applied_"):
            info["type"] = "select"
            info["category"] = "Applied Classes"
            info["options"] = [0, 1]
        else:
            continue

        meta.append(info)
    return meta
