
import numpy as np
import pytest

from backend.app.ml_model import train_model, predict_anomalies, FEATURES


def make_reading(voltage, current, power_factor):
    return {
        "voltage_v": voltage,
        "current_a": current,
        "power_factor": power_factor,
        "active_power_kw": voltage * current * power_factor / 1000,
    }


def test_model_detects_extreme_electrical_reading():
    # Repeatable, normal synthetic operating readings.
    normal = [
        make_reading(
            230 + (i % 7 - 3) * 0.5,
            5 + (i % 5 - 2) * 0.1,
            0.92 + (i % 3 - 1) * 0.005,
        )
        for i in range(200)
    ]

    model = train_model(normal)

    # A deliberately extreme current value.
    test_readings = [
        make_reading(230, 5.0, 0.92),
        make_reading(230, 40.0, 0.92),
    ]

    predictions = predict_anomalies(model, test_readings)

    assert predictions[0]["is_ml_anomaly"] is False
    assert predictions[1]["is_ml_anomaly"] is True
    assert predictions[1]["anomaly_score"] > predictions[0]["anomaly_score"]


def test_training_requires_at_least_20_readings():
    with pytest.raises(ValueError, match="At least 20"):
        train_model([make_reading(230, 5, 0.92)] * 19)


def test_model_rejects_invalid_numeric_values():
    normal = [make_reading(230, 5, 0.92)] * 25
    model = train_model(normal)

    invalid = make_reading(230, 5, 0.92)
    invalid["current_a"] = float("nan")

    with pytest.raises(ValueError, match="invalid numeric"):
        predict_anomalies(model, [invalid])


def test_empty_prediction_input_returns_empty_list():
    normal = [make_reading(230, 5, 0.92)] * 25
    model = train_model(normal)

    assert predict_anomalies(model, []) == []
