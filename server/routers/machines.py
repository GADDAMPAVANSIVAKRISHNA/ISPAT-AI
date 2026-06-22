"""Machines API — machine health, sensors, and ML predictions."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.machine import Machine
from data.simulator import get_current_sensors
from ml.inference import ml_service

router = APIRouter(prefix="/api/v1/machines", tags=["Machines"])


@router.get("")
def get_machines(status: str = None, db: Session = Depends(get_db)):
    """Get all machines with current sensor data and ML predictions."""
    query = db.query(Machine)
    if status and status != "all":
        query = query.filter(Machine.status == status)
    machines = query.all()

    result = []
    for m in machines:
        sensors = get_current_sensors(db, m.id)
        failure = ml_service.predict_failure(sensors)
        rul = ml_service.predict_rul(sensors)
        anomaly = ml_service.detect_anomalies(sensors)

        result.append({
            "id": m.id,
            "name": m.name,
            "type": m.type,
            "department": m.department,
            "location": m.location,
            "status": m.status,
            "failureProbability": round(failure["probability"], 1),
            "rulDays": rul["rul_days"],
            "lastMaintenance": m.last_maintenance,
            "nextScheduled": m.next_scheduled,
            "sensors": sensors,
            "recommendedAction": m.recommended_action,
            "estimatedDowntime": m.estimated_downtime,
            "alerts": m.alerts or [],
            "history": m.history or [],
            "anomaly": anomaly,
            "mlConfidence": failure["confidence"],
        })

    return result


@router.get("/summary")
def get_machine_summary(db: Session = Depends(get_db)):
    """Get machine health summary counts."""
    machines = db.query(Machine).all()
    return {
        "critical": sum(1 for m in machines if m.status == "critical"),
        "warning": sum(1 for m in machines if m.status == "warning"),
        "healthy": sum(1 for m in machines if m.status == "healthy"),
        "total": len(machines),
    }


@router.get("/rul")
def get_rul_overview(db: Session = Depends(get_db)):
    """Get RUL overview for all machines."""
    machines = db.query(Machine).all()
    result = []
    for m in machines:
        sensors = get_current_sensors(db, m.id)
        rul = ml_service.predict_rul(sensors)
        failure = ml_service.predict_failure(sensors)
        result.append({
            "name": m.name,
            "days": rul["rul_days"],
            "risk": round(failure["probability"], 1),
        })
    result.sort(key=lambda x: x["days"])
    return result


@router.get("/{machine_id}")
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    """Get detailed machine info with sensors and predictions."""
    machine = db.query(Machine).filter_by(id=machine_id).first()
    if not machine:
        return {"error": "Machine not found"}

    sensors = get_current_sensors(db, machine_id)
    failure = ml_service.predict_failure(sensors)
    rul = ml_service.predict_rul(sensors)
    anomaly = ml_service.detect_anomalies(sensors)

    return {
        "id": machine.id,
        "name": machine.name,
        "type": machine.type,
        "department": machine.department,
        "location": machine.location,
        "status": machine.status,
        "failureProbability": round(failure["probability"], 1),
        "rulDays": rul["rul_days"],
        "lastMaintenance": machine.last_maintenance,
        "nextScheduled": machine.next_scheduled,
        "sensors": sensors,
        "recommendedAction": machine.recommended_action,
        "estimatedDowntime": machine.estimated_downtime,
        "alerts": machine.alerts or [],
        "history": machine.history or [],
        "anomaly": anomaly,
        "mlConfidence": failure["confidence"],
    }
