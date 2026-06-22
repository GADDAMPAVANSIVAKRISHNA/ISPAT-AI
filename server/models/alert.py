from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String, nullable=False)  # sensor, maintenance, production, energy, shift
    severity = Column(String, nullable=False)  # critical, warning, info
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    machine_id = Column(String, nullable=True)
    department = Column(String, nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
