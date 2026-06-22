from sqlalchemy import Column, String, Float, Integer, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Machine(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    department = Column(String, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, default="healthy")  # critical, warning, healthy
    failure_probability = Column(Float, default=0.0)
    rul_days = Column(Integer, default=90)
    last_maintenance = Column(String, nullable=True)
    next_scheduled = Column(String, nullable=True)
    recommended_action = Column(String, default="Routine Check")
    estimated_downtime = Column(String, default="N/A")
    alerts = Column(JSON, default=list)
    history = Column(JSON, default=list)  # 7-day risk trend
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String, nullable=False)
    type = Column(String, nullable=False)  # preventive, corrective, emergency
    description = Column(String, nullable=False)
    technician = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    downtime_hours = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
