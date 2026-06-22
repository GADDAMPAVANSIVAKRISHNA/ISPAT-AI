from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
from database import Base


class EnergyReading(Base):
    __tablename__ = "energy_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    time_label = Column(String, nullable=False)  # "00:00", "02:00", etc.
    consumed_kwh = Column(Float, nullable=False)
    produced_tons = Column(Float, nullable=False)
    efficiency = Column(Float, nullable=False)
    department = Column(String, nullable=True)
    date = Column(String, nullable=False, index=True)


class EnergyWaste(Base):
    __tablename__ = "energy_waste"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)
    waste_mwh = Column(Float, nullable=False)
    cost = Column(String, nullable=False)
    color = Column(String, default="#ef4444")
    date = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
