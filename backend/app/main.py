import os
from functools import lru_cache
from .ml_model import train_model, predict_anomalies
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from .service import generate_readings, summarize

app = FastAPI(
    title="GridSense AI API",
    description="Synthetic electrical monitoring demo with rule-based alerts and Isolation Forest anomaly detection.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@lru_cache(maxsize=1)
def get_ml_model():
    baseline = generate_readings(288)
    normal_readings = [
        reading.model_dump()
        for reading in baseline
        if not reading.is_anomaly
    ]
    return train_model(normal_readings)

@app.get("/health")
def health():
    return {"status": "ok", "data_mode": "synthetic"}

@app.get("/api/readings")
def get_readings(count: int = Query(default=288, ge=1, le=2880)):
    readings = generate_readings(count)

    predictions = predict_anomalies(
        get_ml_model(),
        [reading.model_dump() for reading in readings],
    )

    items = []

    for reading, prediction in zip(readings, predictions):
        item = reading.model_dump()

        # Preserve the existing rule-based fields.
        item["is_ml_anomaly"] = prediction["is_ml_anomaly"]
        item["anomaly_score"] = prediction["anomaly_score"]

        items.append(item)

    return {"items": items}


@app.get("/api/summary")
def get_summary(count: int = Query(default=288, ge=1, le=2880)):
    return summarize(generate_readings(count)).model_dump()


@app.get("/api/anomalies")
def get_anomalies(count: int = Query(default=288, ge=1, le=2880)):
    items = generate_readings(count)
    return {"items": [r.model_dump() for r in items if r.is_anomaly]}

