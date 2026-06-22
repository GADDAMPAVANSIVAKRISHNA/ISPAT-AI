"""Departments API — department performance and rankings."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.department import Department

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])


@router.get("")
def get_departments(db: Session = Depends(get_db)):
    """Get all departments with performance data."""
    depts = db.query(Department).order_by(Department.efficiency.desc()).all()
    return [
        {
            "id": d.id, "name": d.name, "head": d.head,
            "efficiency": d.efficiency, "rank": i + 1,
            "production": d.production, "target": d.target,
            "lossContribution": d.loss_contribution,
            "downtime": d.downtime, "incidents": d.incidents,
            "energyWaste": d.energy_waste, "color": d.color,
            "trend": d.trend,
            "weeklyEfficiency": d.weekly_efficiency or [],
            "issues": d.issues or [],
        }
        for i, d in enumerate(depts)
    ]


@router.get("/weekly")
def get_weekly_comparison(db: Session = Depends(get_db)):
    """Get weekly department efficiency comparison."""
    return [
        {"day": "Mon", "rolling": 82, "sms": 83, "bf": 81, "power": 89, "maint": 74},
        {"day": "Tue", "rolling": 80, "sms": 84, "bf": 82, "power": 90, "maint": 73},
        {"day": "Wed", "rolling": 79, "sms": 85, "bf": 83, "power": 90, "maint": 72},
        {"day": "Thu", "rolling": 78, "sms": 85, "bf": 81, "power": 91, "maint": 72},
        {"day": "Fri", "rolling": 77, "sms": 86, "bf": 82, "power": 91, "maint": 71},
        {"day": "Sat", "rolling": 78, "sms": 86, "bf": 82, "power": 91, "maint": 71},
        {"day": "Sun", "rolling": 78, "sms": 86, "bf": 82, "power": 91, "maint": 71},
    ]
