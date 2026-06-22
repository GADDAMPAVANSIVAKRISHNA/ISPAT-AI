"""Shifts API — shift performance and incidents."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.shift import ShiftRecord, ShiftIncident

router = APIRouter(prefix="/api/v1/shifts", tags=["Shifts"])


@router.get("")
def get_shifts(date: str = None, db: Session = Depends(get_db)):
    """Get shift records. Optionally filter by date."""
    query = db.query(ShiftRecord)
    if date:
        query = query.filter(ShiftRecord.date == date)
    shifts = query.order_by(ShiftRecord.id.desc()).limit(3).all()
    return [
        {
            "id": s.id, "name": s.name, "supervisor": s.supervisor,
            "time": s.time_range, "date": s.date, "efficiency": s.efficiency,
            "output": s.output, "target": s.target, "downtime": s.downtime,
            "incidents": s.incidents, "delays": s.delays,
            "color": s.color, "status": s.status,
        }
        for s in shifts
    ]


@router.get("/incidents")
def get_incidents(date: str = None, db: Session = Depends(get_db)):
    """Get shift incidents."""
    query = db.query(ShiftIncident)
    if date:
        query = query.filter(ShiftIncident.date == date)
    incidents = query.order_by(ShiftIncident.id.desc()).limit(20).all()
    return [
        {
            "id": i.id, "time": i.time, "shift": i.shift_name,
            "type": i.type, "description": i.description,
            "severity": i.severity, "resolved": i.resolved,
        }
        for i in incidents
    ]


@router.get("/weekly")
def get_weekly_trend(db: Session = Depends(get_db)):
    """Get weekly shift efficiency trend."""
    return [
        {"day": "Mon", "morning": 94, "evening": 86, "night": 78},
        {"day": "Tue", "morning": 91, "evening": 82, "night": 71},
        {"day": "Wed", "morning": 96, "evening": 88, "night": 80},
        {"day": "Thu", "morning": 89, "evening": 79, "night": 65},
        {"day": "Fri", "morning": 93, "evening": 85, "night": 76},
        {"day": "Sat", "morning": 88, "evening": 81, "night": 73},
        {"day": "Sun", "morning": 92, "evening": 83, "night": 74},
    ]
