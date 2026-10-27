from datetime import datetime, timedelta, timezone
import math
from .schemas import Reading, Summary


def generate_readings(count: int = 288) -> list[Reading]:
    """Generate deterministic synthetic single-phase readings at 5-minute intervals."""
    if count < 1 or count > 2880:
        raise ValueError("count must be between 1 and 2880")

    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    # Align end timestamp to a five-minute boundary.
    now = now.replace(minute=(now.minute // 5) * 5)
    readings: list[Reading] = []

    for i in range(count):
        ts = now - timedelta(minutes=5 * (count - 1 - i))
        # Smooth, repeatable daily profile with a small deterministic ripple.
        phase = (ts.hour * 60 + ts.minute) / 1440 * 2 * math.pi
        voltage = 230.0 + 2.5 * math.sin(phase) + 0.3 * math.sin(i * 0.7)
        current = 4.0 + 1.2 * (1 + math.sin(phase - 1.0)) + 0.2 * math.sin(i * 0.31)
        pf = min(0.99, max(0.75, 0.92 + 0.025 * math.sin(i * 0.13)))

        # Inject known synthetic abnormal points for demo/test visibility.
        if i in {count // 3, (2 * count) // 3}:
            current = 14.0
        if i == count // 2:
            pf = 0.62

        active_power_kw = (
    round(voltage, 2)
    * round(current, 2)
    * round(pf, 2)
    / 1000.0
)
        energy_interval = active_power_kw * (5.0 / 60.0)

        reasons = []
        if current > 10.0:
            reasons.append("Current exceeds 10 A demo threshold")
        if pf < 0.70:
            reasons.append("Power factor below 0.70 demo threshold")

        readings.append(
            Reading(
                timestamp=ts.isoformat(),
                voltage_v=round(voltage, 2),
                current_a=round(current, 2),
                power_factor=round(pf, 3),
                active_power_kw=round(active_power_kw, 4),
                energy_kwh_interval=round(energy_interval, 5),
                is_anomaly=bool(reasons),
                anomaly_reason="; ".join(reasons) if reasons else None,
            )
        )
    return readings


def summarize(readings: list[Reading]) -> Summary:
    if not readings:
        return Summary(
            reading_count=0,
            average_voltage_v=0.0,
            average_current_a=0.0,
            average_power_kw=0.0,
            total_energy_kwh=0.0,
            anomaly_count=0,
        )
    n = len(readings)
    return Summary(
        reading_count=n,
        average_voltage_v=round(sum(r.voltage_v for r in readings) / n, 2),
        average_current_a=round(sum(r.current_a for r in readings) / n, 2),
        average_power_kw=round(sum(r.active_power_kw for r in readings) / n, 4),
        total_energy_kwh=round(sum(r.energy_kwh_interval for r in readings), 4),
        anomaly_count=sum(r.is_anomaly for r in readings),
    )
