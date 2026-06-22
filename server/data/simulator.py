"""
Real-time data simulator for ISPAT AI.
Generates continuously changing sensor data, production metrics,
and energy readings to make the dashboard feel alive.
"""
import random
import math
from datetime import datetime
from database import SessionLocal
from models.sensor import SensorReading
from models.machine import Machine
from models.alert import Alert


# Machine sensor profiles — base values and drift characteristics
MACHINE_PROFILES = {
    "M001": {  # Conveyor M12 — degrading
        "temperature": {"base": 94, "drift": 0.05, "noise": 2.0, "threshold": 85, "unit": "°C"},
        "vibration": {"base": 8.4, "drift": 0.03, "noise": 0.3, "threshold": 7.0, "unit": "mm/s"},
        "current": {"base": 42, "drift": 0.02, "noise": 1.0, "threshold": 40, "unit": "A"},
        "pressure": {"base": 6.2, "drift": -0.01, "noise": 0.3, "threshold": 8.0, "unit": "bar"},
        "rpm": {"base": 1180, "drift": -0.5, "noise": 10, "threshold": 1200, "unit": "RPM"},
    },
    "M002": {  # BF Fan — slowly degrading
        "temperature": {"base": 78, "drift": 0.02, "noise": 1.5, "threshold": 85, "unit": "°C"},
        "vibration": {"base": 5.8, "drift": 0.02, "noise": 0.2, "threshold": 7.0, "unit": "mm/s"},
        "current": {"base": 38, "drift": 0.01, "noise": 0.8, "threshold": 40, "unit": "A"},
        "pressure": {"base": 7.1, "drift": 0.0, "noise": 0.2, "threshold": 8.0, "unit": "bar"},
        "rpm": {"base": 1450, "drift": -0.2, "noise": 8, "threshold": 1500, "unit": "RPM"},
    },
    "M003": {  # SMS Pump — stable with occasional spikes
        "temperature": {"base": 71, "drift": 0.01, "noise": 1.0, "threshold": 85, "unit": "°C"},
        "vibration": {"base": 4.2, "drift": 0.01, "noise": 0.15, "threshold": 7.0, "unit": "mm/s"},
        "current": {"base": 35, "drift": 0.0, "noise": 0.5, "threshold": 40, "unit": "A"},
        "pressure": {"base": 5.9, "drift": 0.0, "noise": 0.4, "threshold": 8.0, "unit": "bar"},
        "rpm": {"base": 960, "drift": 0.0, "noise": 5, "threshold": 1200, "unit": "RPM"},
    },
    "M004": {  # RM Motor — healthy
        "temperature": {"base": 62, "drift": 0.0, "noise": 1.0, "threshold": 85, "unit": "°C"},
        "vibration": {"base": 2.1, "drift": 0.0, "noise": 0.1, "threshold": 7.0, "unit": "mm/s"},
        "current": {"base": 31, "drift": 0.0, "noise": 0.3, "threshold": 40, "unit": "A"},
        "pressure": {"base": 4.8, "drift": 0.0, "noise": 0.2, "threshold": 8.0, "unit": "bar"},
        "rpm": {"base": 1200, "drift": 0.0, "noise": 5, "threshold": 1500, "unit": "RPM"},
    },
    "M005": {  # Generator — healthy
        "temperature": {"base": 58, "drift": 0.0, "noise": 0.8, "threshold": 85, "unit": "°C"},
        "vibration": {"base": 1.8, "drift": 0.0, "noise": 0.08, "threshold": 7.0, "unit": "mm/s"},
        "current": {"base": 28, "drift": 0.0, "noise": 0.3, "threshold": 40, "unit": "A"},
        "pressure": {"base": 4.2, "drift": 0.0, "noise": 0.15, "threshold": 8.0, "unit": "bar"},
        "rpm": {"base": 1500, "drift": 0.0, "noise": 3, "threshold": 1500, "unit": "RPM"},
    },
    "M006": {  # Coke Oven — degrading
        "temperature": {"base": 88, "drift": 0.04, "noise": 1.5, "threshold": 85, "unit": "°C"},
        "vibration": {"base": 6.9, "drift": 0.02, "noise": 0.2, "threshold": 7.0, "unit": "mm/s"},
        "current": {"base": 39, "drift": 0.01, "noise": 0.5, "threshold": 40, "unit": "A"},
        "pressure": {"base": 7.8, "drift": 0.01, "noise": 0.15, "threshold": 8.0, "unit": "bar"},
        "rpm": {"base": 850, "drift": -0.3, "noise": 8, "threshold": 1000, "unit": "RPM"},
    },
}

# Track cumulative drift per machine
_drift_accumulator = {}


def _get_sensor_status(value, threshold, sensor_type):
    """Determine sensor status based on value vs threshold."""
    # For sensors where exceeding threshold is bad (temp, vibration, current, pressure)
    if sensor_type in ("rpm",):
        # For RPM, being too low is bad
        ratio = value / threshold if threshold > 0 else 1.0
        if ratio < 0.75:
            return "critical"
        elif ratio < 0.9:
            return "warning"
        return "normal"
    else:
        ratio = value / threshold if threshold > 0 else 0.0
        if ratio >= 1.0:
            return "critical"
        elif ratio >= 0.85:
            return "warning"
        return "normal"


def simulate_sensor_tick():
    """
    Generate one tick of sensor data for all machines.
    Called by the scheduler every 10 seconds.
    """
    db = SessionLocal()
    try:
        now = datetime.now()

        # Add time-of-day factor (machines run hotter during day shifts)
        hour = now.hour
        time_factor = 1.0 + 0.05 * math.sin((hour - 6) * math.pi / 12)

        for machine_id, sensors in MACHINE_PROFILES.items():
            if machine_id not in _drift_accumulator:
                _drift_accumulator[machine_id] = {s: 0.0 for s in sensors}

            machine = db.query(Machine).filter_by(id=machine_id).first()
            if not machine:
                continue

            max_status = "normal"
            alerts_list = []

            for sensor_type, config in sensors.items():
                # Accumulate drift
                _drift_accumulator[machine_id][sensor_type] += config["drift"]
                drift = _drift_accumulator[machine_id][sensor_type]

                # Generate value with noise + drift + time factor
                noise = random.gauss(0, config["noise"])
                value = round(config["base"] + drift + noise * time_factor, 1)

                # Occasional spikes for degrading machines
                if machine_id in ("M001", "M006") and random.random() < 0.05:
                    value += config["noise"] * 2

                value = max(0, value)  # No negative values
                status = _get_sensor_status(value, config["threshold"], sensor_type)

                # Track worst status
                if status == "critical":
                    max_status = "critical"
                elif status == "warning" and max_status != "critical":
                    max_status = "warning"

                if status in ("critical", "warning"):
                    alerts_list.append(f"{sensor_type.capitalize()} at {value} {config['unit']} ({'above' if sensor_type != 'rpm' else 'below'} threshold)")

                # Save reading
                db.add(SensorReading(
                    machine_id=machine_id, sensor_type=sensor_type,
                    value=value, unit=config["unit"],
                    threshold=config["threshold"], status=status,
                    timestamp=now
                ))

            # Update machine status
            if machine:
                machine.status = max_status
                machine.alerts = alerts_list[:5]  # Keep top 5
                # Update failure probability based on sensor health
                if max_status == "critical":
                    machine.failure_probability = min(99, machine.failure_probability + random.uniform(0, 0.3))
                elif max_status == "warning":
                    machine.failure_probability = min(99, machine.failure_probability + random.uniform(0, 0.1))
                else:
                    machine.failure_probability = max(5, machine.failure_probability - random.uniform(0, 0.05))
                machine.failure_probability = round(machine.failure_probability, 1)

                # Generate critical alert if newly critical
                if max_status == "critical" and random.random() < 0.01:
                    db.add(Alert(
                        type="sensor", severity="critical",
                        title=f"{machine.name} — Critical Sensor Alert",
                        message=f"Multiple sensors exceeding thresholds. Failure probability: {machine.failure_probability}%",
                        machine_id=machine_id, department=machine.department
                    ))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Simulator error: {e}")
    finally:
        db.close()


def get_current_sensors(db, machine_id: str) -> dict:
    """Get the latest sensor reading for each type for a machine."""
    from sqlalchemy import func as sqlfunc
    # Subquery to get max timestamp per sensor type
    subq = (
        db.query(
            SensorReading.sensor_type,
            sqlfunc.max(SensorReading.timestamp).label("max_ts")
        )
        .filter(SensorReading.machine_id == machine_id)
        .group_by(SensorReading.sensor_type)
        .subquery()
    )
    readings = (
        db.query(SensorReading)
        .join(subq, (SensorReading.sensor_type == subq.c.sensor_type)
              & (SensorReading.timestamp == subq.c.max_ts))
        .filter(SensorReading.machine_id == machine_id)
        .all()
    )
    return {
        r.sensor_type: {
            "value": r.value, "unit": r.unit,
            "threshold": r.threshold, "status": r.status
        }
        for r in readings
    }
