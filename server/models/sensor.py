from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
from database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String, nullable=False, index=True)
    sensor_type = Column(String, nullable=False)  # temperature, vibration, current, pressure, rpm, runtimeHours
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    threshold = Column(Float, nullable=False)
    status = Column(String, default="normal")  # normal, warning, critical
    timestamp = Column(DateTime, server_default=func.now(), index=True)
