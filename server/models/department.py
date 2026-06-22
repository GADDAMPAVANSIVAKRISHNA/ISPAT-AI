from sqlalchemy import Column, String, Float, Integer, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    head = Column(String, nullable=False)
    efficiency = Column(Float, default=0.0)
    rank = Column(Integer, default=0)
    production = Column(Float, default=0.0)
    target = Column(Float, default=0.0)
    loss_contribution = Column(Float, default=0.0)
    downtime = Column(Float, default=0.0)
    incidents = Column(Integer, default=0)
    energy_waste = Column(Float, default=0.0)
    color = Column(String, default="#10b981")
    trend = Column(String, default="stable")  # up, down, stable
    weekly_efficiency = Column(JSON, default=list)
    issues = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class DeptPerformance(Base):
    __tablename__ = "dept_performance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dept_id = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False, index=True)
    efficiency = Column(Float, nullable=False)
    loss_contribution = Column(Float, default=0.0)
    downtime = Column(Float, default=0.0)
    incidents = Column(Integer, default=0)
    energy_waste = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
