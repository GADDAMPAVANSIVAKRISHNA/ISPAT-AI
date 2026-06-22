"""Energy API — energy consumption, waste sources, and department efficiency."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.energy import EnergyReading, EnergyWaste

router = APIRouter(prefix="/api/v1/energy", tags=["Energy"])


@router.get("/daily")
def get_daily_energy(db: Session = Depends(get_db)):
    """Get 24-hour energy consumption data."""
    readings = db.query(EnergyReading).order_by(EnergyReading.id.desc()).limit(12).all()
    readings.reverse()
    return [
        {
            "time": r.time_label,
            "consumed": r.consumed_kwh,
            "produced": r.produced_tons,
            "efficiency": r.efficiency,
        }
        for r in readings
    ]


@router.get("/waste")
def get_waste_sources(db: Session = Depends(get_db)):
    """Get energy waste sources."""
    sources = db.query(EnergyWaste).order_by(EnergyWaste.waste_mwh.desc()).all()
    return [
        {
            "source": s.source,
            "waste": s.waste_mwh,
            "cost": s.cost,
            "color": s.color,
        }
        for s in sources
    ]


@router.get("/summary")
def get_energy_summary(db: Session = Depends(get_db)):
    """Get energy summary KPIs."""
    return {
        "totalConsumed": 52400,
        "totalWasted": 49.8,
        "wastePercent": 12.3,
        "costImpact": "₹1,99,200",
        "topCause": "Idle Conveyor Operations",
        "co2Saved": "28.4 tons",
    }


@router.get("/departments")
def get_department_energy(db: Session = Depends(get_db)):
    """Get energy efficiency by department."""
    return [
        {"dept": "Blast Furnace", "consumed": 18200, "efficiency": 82, "waste": 12},
        {"dept": "Steel Melt Shop", "consumed": 14800, "efficiency": 88, "waste": 7},
        {"dept": "Rolling Mill", "consumed": 11200, "efficiency": 85, "waste": 9},
        {"dept": "Power Plant", "consumed": 5800, "efficiency": 91, "waste": 5},
        {"dept": "Maintenance", "consumed": 2400, "efficiency": 78, "waste": 15},
    ]
