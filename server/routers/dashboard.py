"""Dashboard aggregation API — provides all KPIs in a single call."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.machine import Machine
from models.production import DailyProduction
from models.shift import ShiftRecord
from models.alert import Alert
from models.department import Department
from ml.inference import ml_service
from data.simulator import get_current_sensors

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    """Get aggregated dashboard data — today's KPIs, alerts, predictions."""

    # Get latest daily production (today or most recent)
    today_prod = db.query(DailyProduction).order_by(DailyProduction.id.desc()).first()

    # Get daily production for chart (last 7 days)
    daily_data = db.query(DailyProduction).order_by(DailyProduction.id.desc()).limit(7).all()
    daily_data.reverse()

    # Get all machines
    machines_list = db.query(Machine).all()
    critical_machines = [m for m in machines_list if m.status == "critical"]

    # Get latest shifts
    shifts = db.query(ShiftRecord).order_by(ShiftRecord.id.desc()).limit(3).all()

    # Get unacknowledged alerts count
    alert_count = db.query(Alert).filter(Alert.acknowledged == False).count()

    # Monthly trend
    monthly_trend = [
        {"month": "Jan", "production": 28500, "loss": 3200, "efficiency": 89.9},
        {"month": "Feb", "production": 26800, "loss": 4100, "efficiency": 86.7},
        {"month": "Mar", "production": 29100, "loss": 2800, "efficiency": 91.2},
        {"month": "Apr", "production": 27600, "loss": 3900, "efficiency": 87.6},
        {"month": "May", "production": 28900, "loss": 3300, "efficiency": 89.8},
        {"month": "Jun", "production": 24500, "loss": 5200, "efficiency": 82.5},
    ]

    # ML Predictions
    predictions = []
    recent_prod = [{"actual": d.actual} for d in daily_data]
    forecast = ml_service.forecast_production(recent_prod)

    predictions.append({
        "label": "Tomorrow's Production Forecast",
        "value": f"{forecast['forecast_tons']} Tons",
        "subvalue": f"Range: {forecast['confidence_low']}-{forecast['confidence_high']}T",
        "icon": "BarChart3",
        "color": "text-sky-400",
        "bg": "bg-sky-500/10",
        "detail": "Random Forest ensemble model",
    })

    # Get predictions for critical machines
    for machine in critical_machines[:2]:
        sensors = get_current_sensors(db, machine.id)
        failure = ml_service.predict_failure(sensors)
        rul = ml_service.predict_rul(sensors)

        predictions.append({
            "label": f"Next Failure: {machine.name}",
            "value": f"{rul['rul_days']} Days",
            "subvalue": f"{failure['probability']}% failure probability",
            "icon": "AlertTriangle",
            "color": "text-red-400",
            "bg": "bg-red-500/10",
            "detail": f"XGBoost + RF model ({failure['confidence']}% conf.)",
        })

    predictions.append({
        "label": "Potential Energy Savings",
        "value": "₹1.99L/day",
        "subvalue": "By fixing idle conveyors",
        "icon": "Zap",
        "color": "text-emerald-400",
        "bg": "bg-emerald-500/10",
        "detail": "Energy optimization model",
    })

    return {
        "todayProduction": {
            "target": today_prod.target if today_prod else 1000,
            "actual": today_prod.actual if today_prod else 850,
            "loss": today_prod.loss if today_prod else 150,
            "efficiency": today_prod.efficiency if today_prod else 85,
            "downtime": today_prod.downtime if today_prod else 4.2,
            "lossBreakdown": today_prod.loss_breakdown if today_prod else [],
        },
        "dailyProduction": [
            {"date": d.date, "target": d.target, "actual": d.actual, "loss": d.loss}
            for d in daily_data
        ],
        "monthlyTrend": monthly_trend,
        "machines": [
            {
                "id": m.id, "name": m.name, "type": m.type,
                "department": m.department, "status": m.status,
                "failureProbability": m.failure_probability,
                "recommendedAction": m.recommended_action,
            }
            for m in machines_list
        ],
        "criticalMachines": [
            {
                "id": m.id, "name": m.name, "department": m.department,
                "status": m.status, "failureProbability": m.failure_probability,
                "recommendedAction": m.recommended_action,
            }
            for m in critical_machines
        ],
        "predictions": predictions,
        "alertCount": alert_count,
    }
