from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
from app.service import generate_readings
from app.ml_model import train_model, FEATURES
def main():
    training_readings = generate_readings(1440)
    test_readings = generate_readings(1440)

    # Add varied, labelled anomalies to the evaluation set only.
    for index, reading in enumerate(test_readings):
        if index % 100 == 0:
            reading.current_a = 18.0
            reading.is_anomaly = True
        elif index % 100 == 50:
            reading.power_factor = 0.45
            reading.is_anomaly = True
    # Train only on readings not flagged by the existing rules.
    normal_training = [
        reading.model_dump()
        for reading in training_readings
        if not reading.is_anomaly
    ]

    model = train_model(normal_training)

    # Ground-truth labels: 1 = injected anomaly, 0 = normal.
    y_true = [
        int(reading.is_anomaly)
        for reading in test_readings
    ]

    # Use Isolation Forest alone, not the hybrid threshold logic.
    X_test = [
        [getattr(reading, feature) for feature in FEATURES]
        for reading in test_readings
    ]

    raw_predictions = model.predict(X_test)
    y_pred = [
        int(prediction == -1)
        for prediction in raw_predictions
    ]

    print("\n=== GridSense AI: Isolation Forest Evaluation ===")
    print(f"Training readings: {len(training_readings)}")
    print(f"Normal training readings: {len(normal_training)}")
    print(f"Test readings: {len(test_readings)}")
    print(f"Actual anomalies in test set: {sum(y_true)}")

    print(f"\nAccuracy:  {accuracy_score(y_true, y_pred):.3f}")
    print(
        f"Precision: {precision_score(y_true, y_pred, zero_division=0):.3f}"
    )
    print(
        f"Recall:    {recall_score(y_true, y_pred, zero_division=0):.3f}"
    )
    print(f"F1-score:  {f1_score(y_true, y_pred, zero_division=0):.3f}")

    matrix = confusion_matrix(y_true, y_pred, labels=[0, 1])
    print("\nConfusion matrix [[TN, FP], [FN, TP]]:")
    print(matrix)

    print("\nClassification report:")
    print(
        classification_report(
            y_true,
            y_pred,
            labels=[0, 1],
            target_names=["Normal", "Anomaly"],
            zero_division=0,
        )
    )


if __name__ == "__main__":
    main()
