from __future__ import annotations
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "voltage_v",
    "current_a",
    "power_factor",
    "active_power_kw",
]
def build_model() -> IsolationForest:
    """Create an unsupervised model for electrical anomaly detection."""
    return make_pipeline(
        StandardScaler(),
        IsolationForest(
            n_estimators=300,
            contamination=0.05,
            random_state=42,
        ),
    )

def train_model(normal_readings: list[dict]) -> object:
    """Train on readings believed to represent normal operation."""
    if len(normal_readings) < 20:
        raise ValueError("At least 20 normal readings are required.")

    X = np.asarray(
        [[row[key] for key in FEATURES] for row in normal_readings],
        dtype=float,
    )

    if not np.isfinite(X).all():
        raise ValueError("Training data contains invalid numeric values.")

    model = build_model()
    model.fit(X)
    return model



def predict_anomalies(model: object, readings: list[dict]) -> list[dict]:
    """Return pure Isolation Forest predictions and anomaly scores."""
    X = np.asarray(
        [[row[key] for key in FEATURES] for row in readings],
        dtype=float,
    )

    if X.size == 0:
        return []

    if not np.isfinite(X).all():
        raise ValueError("Input readings contain invalid numeric values.")

    predictions = model.predict(X)
    scores = model.decision_function(X)

    return [
        {
            "is_ml_anomaly": bool(prediction == -1),
            "anomaly_score": float(-score),
        }
        for row, prediction, score in zip(readings, predictions, scores)
    ]



