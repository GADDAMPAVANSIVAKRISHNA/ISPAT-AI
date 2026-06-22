from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class ShiftRecord(Base):
    __tablename__ = "shift_records"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    supervisor = Column(String, nullable=False)
    time_range = Column(String, nullable=False)
    date = Column(String, nullable=False, index=True)
    efficiency = Column(Float, nullable=False)
    output = Column(Float, nullable=False)
    target = Column(Float, nullable=False)
    downtime = Column(Float, default=0.0)
    incidents = Column(Integer, default=0)
    delays = Column(Integer, default=0)
    color = Column(String, default="#10b981")
    status = Column(String, default="good")  # excellent, good, poor
    created_at = Column(DateTime, server_default=func.now())


class ShiftIncident(Base):
    __tablename__ = "shift_incidents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shift_id = Column(String, nullable=True)
    shift_name = Column(String, nullable=False)
    time = Column(String, nullable=False)
    date = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  # Equipment, Process, Human
    description = Column(String, nullable=False)
    severity = Column(String, default="low")  # high, medium, low
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
