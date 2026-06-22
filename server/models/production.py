from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from sqlalchemy.sql import func
from database import Base


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False, index=True)
    hour = Column(Integer, nullable=True)
    target = Column(Float, nullable=False)
    actual = Column(Float, nullable=False)
    loss = Column(Float, nullable=False)
    shift_id = Column(String, nullable=True)
    department = Column(String, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())


class DailyProduction(Base):
    __tablename__ = "daily_production"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False, unique=True, index=True)
    target = Column(Float, nullable=False)
    actual = Column(Float, nullable=False)
    loss = Column(Float, nullable=False)
    efficiency = Column(Float, nullable=False)
    downtime = Column(Float, default=0.0)
    loss_breakdown = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())


class RCAReport(Base):
    __tablename__ = "rca_reports"

    id = Column(String, primary_key=True)
    date = Column(String, nullable=False)
    loss_percent = Column(Float, nullable=False)
    primary_cause = Column(String, nullable=False)
    primary_cause_dept = Column(String, nullable=False)
    secondary_cause = Column(String, nullable=False)
    secondary_cause_dept = Column(String, nullable=False)
    tertiary_cause = Column(String, nullable=True)
    confidence = Column(Float, nullable=False)
    production_lost = Column(Float, nullable=False)
    ai_summary = Column(Text, nullable=False)
    timeline = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())
