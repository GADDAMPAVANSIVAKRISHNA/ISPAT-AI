from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from sqlalchemy.sql import func
from database import Base


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id = Column(String, primary_key=True)
    problem = Column(Text, nullable=False)
    cause = Column(Text, nullable=False)
    solution = Column(Text, nullable=False)
    machine = Column(String, nullable=False)
    department = Column(String, nullable=False)
    severity = Column(String, default="medium")  # critical, high, medium, low
    added_by = Column(String, nullable=False)
    date = Column(String, nullable=False)
    tags = Column(JSON, default=list)
    success_rate = Column(Float, default=90.0)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
