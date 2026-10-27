from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_summary_and_readings():
    summary = client.get("/api/summary?count=20")
    readings = client.get("/api/readings?count=20")
    assert summary.status_code == 200
    assert summary.json()["reading_count"] == 20
    assert len(readings.json()["items"]) == 20


def test_invalid_query_count_is_rejected():
    response = client.get("/api/readings?count=0")
    assert response.status_code == 422
