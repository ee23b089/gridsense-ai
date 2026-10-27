from backend.app.service import generate_readings, summarize


def test_generated_readings_have_expected_fields_and_bounds():
    readings = generate_readings(24)
    assert len(readings) == 24
    for r in readings:
        assert r.voltage_v > 0
        assert r.current_a > 0
        assert 0 <= r.power_factor <= 1
        assert r.active_power_kw >= 0
        assert r.energy_kwh_interval >= 0


def test_active_power_calculation_is_consistent():
    r = generate_readings(10)[0]
    expected_kw = r.voltage_v * r.current_a * r.power_factor / 1000
    assert abs(r.active_power_kw - expected_kw) < 0.00011


def test_known_demo_anomalies_are_flagged():
    readings = generate_readings(30)
    anomalies = [r for r in readings if r.is_anomaly]
    assert len(anomalies) >= 3
    assert any("Current exceeds" in (r.anomaly_reason or "") for r in anomalies)
    assert any("Power factor below" in (r.anomaly_reason or "") for r in anomalies)


def test_summary_energy_is_sum_of_intervals():
    readings = generate_readings(18)
    summary = summarize(readings)
    assert summary.reading_count == 18
    assert summary.total_energy_kwh == round(sum(r.energy_kwh_interval for r in readings), 4)


def test_invalid_count_rejected():
    import pytest
    with pytest.raises(ValueError):
        generate_readings(0)
