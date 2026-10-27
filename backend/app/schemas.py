from pydantic import BaseModel, Field


class Reading(BaseModel):
    timestamp: str
    voltage_v: float = Field(ge=0)
    current_a: float = Field(ge=0)
    power_factor: float = Field(ge=0, le=1)
    active_power_kw: float = Field(ge=0)
    energy_kwh_interval: float = Field(ge=0)
    is_anomaly: bool
    anomaly_reason: str | None = None
    is_ml_anomaly: bool = False
    anomaly_score: float | None = None

class Summary(BaseModel):
    reading_count: int
    average_voltage_v: float
    average_current_a: float
    average_power_kw: float
    total_energy_kwh: float
    anomaly_count: int
