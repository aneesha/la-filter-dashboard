"""Tests for the LA Filter Dashboard API."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_get_students(client):
    resp = client.get("/api/students")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 30
    assert all("username" in s for s in data)
    assert all("email" in s for s in data)
    assert all(s["email"].endswith("@student.university.edu.au") for s in data)


def test_get_columns(client):
    resp = client.get("/api/columns")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    categories = {c["category"] for c in data}
    assert "Student Info" in categories
    assert "Weekly Activities" in categories
    assert "Assessments" in categories
    assert "LMS Access" in categories
    assert "Applied Classes" in categories


def test_get_course(client):
    resp = client.get("/api/course")
    assert resp.status_code == 200
    data = resp.json()
    assert data["course_code"] == "WIS2002"
    assert data["course_name"] == "Web Information Systems"


def test_filter_no_conditions(client):
    resp = client.post("/api/students/filter", json={"groups": [], "logic": "AND"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 30
    assert data["total"] == 30


def test_filter_by_degree(client):
    resp = client.post("/api/students/filter", json={
        "groups": [{
            "logic": "AND",
            "conditions": [{
                "field": "degree_program",
                "operator": "eq",
                "value": "Bachelor of Computer Science",
            }],
        }],
        "logic": "AND",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] > 0
    assert data["count"] < 30
    assert all(
        s["degree_program"] == "Bachelor of Computer Science"
        for s in data["students"]
    )


def test_filter_numeric_gte(client):
    resp = client.post("/api/students/filter", json={
        "groups": [{
            "logic": "AND",
            "conditions": [{
                "field": "Design Document",
                "operator": "gte",
                "value": 70,
            }],
        }],
        "logic": "AND",
    })
    assert resp.status_code == 200
    data = resp.json()
    for s in data["students"]:
        assert s["Design Document"] is not None and s["Design Document"] >= 70


def test_filter_or_logic(client):
    resp = client.post("/api/students/filter", json={
        "groups": [{
            "logic": "OR",
            "conditions": [
                {"field": "first_name", "operator": "eq", "value": "Danielle"},
                {"field": "first_name", "operator": "eq", "value": "Joshua"},
            ],
        }],
        "logic": "AND",
    })
    assert resp.status_code == 200
    data = resp.json()
    names = {s["first_name"] for s in data["students"]}
    assert "Danielle" in names or "Joshua" in names


def test_filter_empty_operator(client):
    resp = client.post("/api/students/filter", json={
        "groups": [{
            "logic": "AND",
            "conditions": [{
                "field": "Exam",
                "operator": "empty",
            }],
        }],
        "logic": "AND",
    })
    assert resp.status_code == 200
    data = resp.json()
    # All exams should be blank
    assert data["count"] == 30


def test_send_email(client):
    resp = client.post("/api/email/send", json={
        "to": ["test@student.university.edu.au"],
        "subject": "Test",
        "body": "<p>Hello</p>",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_dashboard_access_by_week(client):
    resp = client.post("/api/dashboard/access-by-week", json={"groups": [], "logic": "AND"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 13  # 13 weeks
    assert all("week" in d for d in data)
    assert all("all" in d for d in data)


def test_dashboard_activities_by_week(client):
    resp = client.post("/api/dashboard/activities-by-week", json={"groups": [], "logic": "AND"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 7  # Week 2 to 8


def test_dashboard_applied_by_week(client):
    resp = client.post("/api/dashboard/applied-by-week", json={"groups": [], "logic": "AND"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 11  # Week 2 to 12


def test_dashboard_sankey(client):
    resp = client.post("/api/dashboard/sankey", json={"groups": [], "logic": "AND"})
    assert resp.status_code == 200
    data = resp.json()
    assert "nodes" in data
    assert "links" in data
    # 4 stages: Weekly Activities (5 bands) + 3 assessments (5 bands + Not Submitted each)
    assert len(data["nodes"]) == 5 + 3 * 6  # 23 nodes
    assert len(data["links"]) > 0
    # Check node names contain grade bands
    names = [n["name"] for n in data["nodes"]]
    assert any("Weekly Activities" in n for n in names)
    assert any("Design Document" in n for n in names)
    assert any("Not Submitted" in n for n in names)
