"""Alerts API — alert management and notifications."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.alert import Alert

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])


@router.get("")
def get_alerts(
    severity: str = None,
    acknowledged: bool = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get alerts with optional filters."""
    query = db.query(Alert)

    if severity:
        query = query.filter(Alert.severity == severity)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return [
        {
            "id": a.id, "type": a.type, "severity": a.severity,
            "title": a.title, "message": a.message,
            "machineId": a.machine_id, "department": a.department,
            "acknowledged": a.acknowledged,
            "acknowledgedBy": a.acknowledged_by,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Acknowledge an alert."""
    alert = db.query(Alert).filter_by(id=alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.acknowledged = True
    alert.acknowledged_by = "Current User"
    alert.acknowledged_at = datetime.now()
    db.commit()
    return {"message": "Alert acknowledged", "id": alert_id}


@router.get("/summary")
def get_alert_summary(db: Session = Depends(get_db)):
    """Get alert count summary."""
    all_alerts = db.query(Alert).filter(Alert.acknowledged == False).all()
    return {
        "total": len(all_alerts),
        "critical": sum(1 for a in all_alerts if a.severity == "critical"),
        "warning": sum(1 for a in all_alerts if a.severity == "warning"),
        "info": sum(1 for a in all_alerts if a.severity == "info"),
    }
