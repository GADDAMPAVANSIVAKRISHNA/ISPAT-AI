"""Production data API."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.production import DailyProduction, RCAReport

router = APIRouter(prefix="/api/v1/production", tags=["Production"])


@router.get("/daily")
def get_daily_production(limit: int = 7, db: Session = Depends(get_db)):
    """Get daily production records."""
    data = db.query(DailyProduction).order_by(DailyProduction.id.desc()).limit(limit).all()
    data.reverse()
    return [
        {
            "date": d.date, "target": d.target, "actual": d.actual,
            "loss": d.loss, "efficiency": d.efficiency,
        }
        for d in data
    ]


@router.get("/today")
def get_today_production(db: Session = Depends(get_db)):
    """Get today's production summary."""
    today = db.query(DailyProduction).order_by(DailyProduction.id.desc()).first()
    if not today:
        return {"target": 1000, "actual": 0, "loss": 0, "efficiency": 0, "downtime": 0, "lossBreakdown": []}
    return {
        "target": today.target,
        "actual": today.actual,
        "loss": today.loss,
        "efficiency": today.efficiency,
        "downtime": today.downtime,
        "lossBreakdown": today.loss_breakdown or [],
    }


@router.get("/monthly")
def get_monthly_trend(db: Session = Depends(get_db)):
    """Get monthly production trend."""
    return [
        {"month": "Jan", "production": 28500, "loss": 3200, "efficiency": 89.9},
        {"month": "Feb", "production": 26800, "loss": 4100, "efficiency": 86.7},
        {"month": "Mar", "production": 29100, "loss": 2800, "efficiency": 91.2},
        {"month": "Apr", "production": 27600, "loss": 3900, "efficiency": 87.6},
        {"month": "May", "production": 28900, "loss": 3300, "efficiency": 89.8},
        {"month": "Jun", "production": 24500, "loss": 5200, "efficiency": 82.5},
    ]


@router.get("/rca")
def get_rca_reports(db: Session = Depends(get_db)):
    """Get root cause analysis reports."""
    reports = db.query(RCAReport).order_by(RCAReport.date.desc()).all()
    return [
        {
            "id": r.id, "date": r.date, "lossPercent": r.loss_percent,
            "primaryCause": r.primary_cause, "primaryCauseDept": r.primary_cause_dept,
            "secondaryCause": r.secondary_cause, "secondaryCauseDept": r.secondary_cause_dept,
            "tertiaryCause": r.tertiary_cause, "confidence": r.confidence,
            "productionLost": r.production_lost, "aiSummary": r.ai_summary,
            "timeline": r.timeline or [],
        }
        for r in reports
    ]
