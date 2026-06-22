"""
Seed the database with initial data matching the prototype's mock data.
This ensures the system starts with the same data users saw in the prototype.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
from database import SessionLocal, init_db
from models.machine import Machine
from models.sensor import SensorReading
from models.production import DailyProduction, RCAReport
from models.shift import ShiftRecord, ShiftIncident
from models.energy import EnergyReading, EnergyWaste
from models.department import Department
from models.knowledge import KnowledgeEntry
from models.alert import Alert
from models.user import User


def seed_machines(db):
    machines = [
        Machine(id="M001", name="Conveyor M12", type="Conveyor Belt", department="Rolling Mill",
                location="Bay 3A", status="critical", failure_probability=87, rul_days=7,
                last_maintenance="2026-05-28", next_scheduled="2026-06-25",
                recommended_action="Bearing Inspection & Replacement", estimated_downtime="4 hours",
                alerts=["High vibration detected", "Temperature threshold exceeded", "Bearing wear pattern detected"],
                history=[85, 86, 87, 88, 89, 91, 87]),
        Machine(id="M002", name="Blast Furnace Fan BF-2", type="Industrial Fan", department="Blast Furnace",
                location="Bay 1B", status="warning", failure_probability=54, rul_days=18,
                last_maintenance="2026-06-01", next_scheduled="2026-07-01",
                recommended_action="Vibration Damper Check", estimated_downtime="2 hours",
                alerts=["Vibration rising trend", "Schedule preventive maintenance"],
                history=[40, 42, 45, 48, 51, 54, 54]),
        Machine(id="M003", name="SMS Pump P-07", type="Hydraulic Pump", department="Steel Melt Shop",
                location="Bay 2C", status="warning", failure_probability=41, rul_days=24,
                last_maintenance="2026-06-05", next_scheduled="2026-07-05",
                recommended_action="Seal Inspection", estimated_downtime="1.5 hours",
                alerts=["Pressure fluctuation observed"],
                history=[30, 32, 35, 36, 39, 41, 41]),
        Machine(id="M004", name="Rolling Mill Motor RM-3", type="AC Motor", department="Rolling Mill",
                location="Bay 4A", status="healthy", failure_probability=12, rul_days=62,
                last_maintenance="2026-06-10", next_scheduled="2026-07-10",
                recommended_action="Routine Check (scheduled)", estimated_downtime="30 min",
                alerts=[], history=[10, 11, 11, 12, 12, 12, 12]),
        Machine(id="M005", name="Power Plant Generator G-1", type="Generator", department="Power Plant",
                location="Utility Block", status="healthy", failure_probability=8, rul_days=90,
                last_maintenance="2026-06-12", next_scheduled="2026-07-12",
                recommended_action="No action required", estimated_downtime="N/A",
                alerts=[], history=[7, 7, 8, 8, 8, 8, 8]),
        Machine(id="M006", name="Coke Oven Machine COM-1", type="Coke Pusher", department="Blast Furnace",
                location="Bay 1A", status="critical", failure_probability=73, rul_days=12,
                last_maintenance="2026-05-20", next_scheduled="2026-06-20",
                recommended_action="Immediate Overhaul Required", estimated_downtime="8 hours",
                alerts=["Temperature above limit", "All sensors approaching threshold", "Overdue maintenance"],
                history=[55, 58, 62, 65, 68, 71, 73]),
    ]
    for m in machines:
        db.merge(m)
    db.commit()
    print(f"  ✓ Seeded {len(machines)} machines")


def seed_sensors(db):
    """Seed current sensor readings for all machines."""
    sensor_data = {
        "M001": [
            ("temperature", 94, "°C", 85, "critical"),
            ("vibration", 8.4, "mm/s", 7.0, "critical"),
            ("current", 42, "A", 40, "warning"),
            ("pressure", 6.2, "bar", 8.0, "normal"),
            ("rpm", 1180, "RPM", 1200, "normal"),
            ("runtimeHours", 14800, "hrs", 15000, "warning"),
        ],
        "M002": [
            ("temperature", 78, "°C", 85, "normal"),
            ("vibration", 5.8, "mm/s", 7.0, "warning"),
            ("current", 38, "A", 40, "normal"),
            ("pressure", 7.1, "bar", 8.0, "normal"),
            ("rpm", 1450, "RPM", 1500, "normal"),
            ("runtimeHours", 12300, "hrs", 15000, "normal"),
        ],
        "M003": [
            ("temperature", 71, "°C", 85, "normal"),
            ("vibration", 4.2, "mm/s", 7.0, "normal"),
            ("current", 35, "A", 40, "normal"),
            ("pressure", 5.9, "bar", 8.0, "normal"),
            ("rpm", 960, "RPM", 1200, "normal"),
            ("runtimeHours", 9800, "hrs", 15000, "normal"),
        ],
        "M004": [
            ("temperature", 62, "°C", 85, "normal"),
            ("vibration", 2.1, "mm/s", 7.0, "normal"),
            ("current", 31, "A", 40, "normal"),
            ("pressure", 4.8, "bar", 8.0, "normal"),
            ("rpm", 1200, "RPM", 1500, "normal"),
            ("runtimeHours", 6200, "hrs", 15000, "normal"),
        ],
        "M005": [
            ("temperature", 58, "°C", 85, "normal"),
            ("vibration", 1.8, "mm/s", 7.0, "normal"),
            ("current", 28, "A", 40, "normal"),
            ("pressure", 4.2, "bar", 8.0, "normal"),
            ("rpm", 1500, "RPM", 1500, "normal"),
            ("runtimeHours", 4500, "hrs", 15000, "normal"),
        ],
        "M006": [
            ("temperature", 88, "°C", 85, "critical"),
            ("vibration", 6.9, "mm/s", 7.0, "warning"),
            ("current", 39, "A", 40, "warning"),
            ("pressure", 7.8, "bar", 8.0, "warning"),
            ("rpm", 850, "RPM", 1000, "warning"),
            ("runtimeHours", 13900, "hrs", 15000, "warning"),
        ],
    }
    count = 0
    for machine_id, sensors in sensor_data.items():
        for sensor_type, value, unit, threshold, status in sensors:
            db.add(SensorReading(
                machine_id=machine_id, sensor_type=sensor_type,
                value=value, unit=unit, threshold=threshold, status=status
            ))
            count += 1
    db.commit()
    print(f"  ✓ Seeded {count} sensor readings")


def seed_production(db):
    daily_data = [
        ("Jun 12", 1000, 940, 60), ("Jun 13", 1000, 875, 125),
        ("Jun 14", 1000, 960, 40), ("Jun 15", 1000, 820, 180),
        ("Jun 16", 1000, 910, 90), ("Jun 17", 1000, 850, 150),
        ("Jun 18", 1000, 920, 80),
    ]
    for date, target, actual, loss in daily_data:
        eff = round((actual / target) * 100, 1)
        dt = round(random.uniform(1.0, 5.0), 1)
        lb = [
            {"category": "Conveyor Failure", "tons": round(loss * 0.4), "color": "#ef4444", "percent": 40},
            {"category": "Shift Delay", "tons": round(loss * 0.267), "color": "#f59e0b", "percent": 26.7},
            {"category": "Material Delay", "tons": round(loss * 0.2), "color": "#8b5cf6", "percent": 20},
            {"category": "Energy Loss", "tons": round(loss * 0.08), "color": "#06b6d4", "percent": 8},
            {"category": "Maintenance Stop", "tons": round(loss * 0.053), "color": "#f97316", "percent": 5.3},
        ]
        db.add(DailyProduction(date=date, target=target, actual=actual, loss=loss,
                               efficiency=eff, downtime=dt, loss_breakdown=lb))
    db.commit()
    print(f"  ✓ Seeded {len(daily_data)} daily production records")


def seed_rca(db):
    rcas = [
        RCAReport(
            id="RCA001", date="2026-06-17", loss_percent=15,
            primary_cause="Conveyor Belt Breakdown", primary_cause_dept="Rolling Mill",
            secondary_cause="Shift Handover Delay", secondary_cause_dept="Production",
            tertiary_cause="Material Shortage (Coke)", confidence=91, production_lost=150,
            ai_summary="Conveyor M12 bearing failure caused a 4.2-hour shutdown in Bay 3A. The failure was exacerbated by a delayed shift handover (38 min delay) which increased reaction time. Coke material shortage from Blast Furnace Section additionally reduced output by 30 tons.",
            timeline=[
                {"time": "06:20", "event": "Vibration alarm triggered on Conveyor M12"},
                {"time": "07:05", "event": "Operator reported abnormal sound"},
                {"time": "07:40", "event": "Conveyor M12 tripped — production stopped"},
                {"time": "08:15", "event": "Maintenance team reached site (35 min delay)"},
                {"time": "12:00", "event": "Bearing replaced, conveyor restarted"},
            ]
        ),
        RCAReport(
            id="RCA002", date="2026-06-15", loss_percent=18,
            primary_cause="Power Plant Fluctuation", primary_cause_dept="Power Plant",
            secondary_cause="Rolling Mill Stoppage", secondary_cause_dept="Rolling Mill",
            tertiary_cause="Emergency Maintenance", confidence=88, production_lost=180,
            ai_summary="A 2.5-hour power fluctuation event in the Power Plant caused multiple safety trips in the Rolling Mill. Emergency maintenance for protection relay recalibration was required. Production losses were compounded by lack of standby power protocol.",
            timeline=[
                {"time": "14:10", "event": "Power quality anomaly detected"},
                {"time": "14:18", "event": "Rolling Mill emergency stop triggered"},
                {"time": "14:25", "event": "Power Plant team notified"},
                {"time": "15:40", "event": "Relay recalibration complete"},
                {"time": "16:45", "event": "Rolling Mill restarted at 70% capacity"},
            ]
        ),
    ]
    for r in rcas:
        db.merge(r)
    db.commit()
    print(f"  ✓ Seeded {len(rcas)} RCA reports")


def seed_shifts(db):
    shifts = [
        ShiftRecord(id="S001", name="Morning Shift", supervisor="Rajesh Kumar",
                    time_range="06:00 - 14:00", date="2026-06-18", efficiency=92,
                    output=348, target=333, downtime=0.8, incidents=1, delays=0,
                    color="#10b981", status="excellent"),
        ShiftRecord(id="S002", name="Evening Shift", supervisor="Amit Sharma",
                    time_range="14:00 - 22:00", date="2026-06-18", efficiency=83,
                    output=302, target=333, downtime=2.1, incidents=2, delays=1,
                    color="#f59e0b", status="good"),
        ShiftRecord(id="S003", name="Night Shift", supervisor="Suresh Patil",
                    time_range="22:00 - 06:00", date="2026-06-18", efficiency=74,
                    output=267, target=333, downtime=4.2, incidents=3, delays=2,
                    color="#ef4444", status="poor"),
    ]
    for s in shifts:
        db.merge(s)

    incidents = [
        ShiftIncident(shift_name="Night", time="23:15", date="2026-06-18",
                      type="Equipment", description="Conveyor M12 vibration alarm",
                      severity="high", resolved=False),
        ShiftIncident(shift_name="Night", time="01:40", date="2026-06-18",
                      type="Process", description="Material feed interruption - Coke section",
                      severity="medium", resolved=True),
        ShiftIncident(shift_name="Night", time="03:20", date="2026-06-18",
                      type="Human", description="Shift handover delay - 38 minutes",
                      severity="medium", resolved=True),
        ShiftIncident(shift_name="Evening", time="15:10", date="2026-06-18",
                      type="Equipment", description="Pressure drop in Pump P-07",
                      severity="medium", resolved=True),
        ShiftIncident(shift_name="Evening", time="16:55", date="2026-06-18",
                      type="Process", description="Rolling schedule delayed - upstream fault",
                      severity="low", resolved=True),
        ShiftIncident(shift_name="Morning", time="07:00", date="2026-06-18",
                      type="Human", description="Safety inspection pause (routine)",
                      severity="low", resolved=True),
    ]
    for inc in incidents:
        db.add(inc)
    db.commit()
    print(f"  ✓ Seeded {len(shifts)} shift records, {len(incidents)} incidents")


def seed_energy(db):
    today = datetime.now().strftime("%Y-%m-%d")
    energy_data = [
        ("00:00", 4200, 320, 76), ("02:00", 3800, 290, 76), ("04:00", 3600, 270, 75),
        ("06:00", 4800, 420, 87), ("08:00", 5200, 460, 88), ("10:00", 5400, 490, 90),
        ("12:00", 5100, 450, 88), ("14:00", 4900, 410, 83), ("16:00", 4700, 380, 80),
        ("18:00", 4400, 350, 79), ("20:00", 4100, 310, 75), ("22:00", 3900, 295, 75),
    ]
    for time_label, consumed, produced, eff in energy_data:
        db.add(EnergyReading(
            time_label=time_label, consumed_kwh=consumed,
            produced_tons=produced, efficiency=eff, date=today
        ))

    waste_sources = [
        ("Idle Conveyor Operations", 18.5, "₹74,000", "#ef4444"),
        ("Blast Furnace Leakage", 12.3, "₹49,200", "#f59e0b"),
        ("Compressed Air Leaks", 8.7, "₹34,800", "#8b5cf6"),
        ("Lighting (Unoccupied)", 4.2, "₹16,800", "#06b6d4"),
        ("Cooling Tower Inefficiency", 6.1, "₹24,400", "#f97316"),
    ]
    for source, waste, cost, color in waste_sources:
        db.add(EnergyWaste(source=source, waste_mwh=waste, cost=cost, color=color, date=today))
    db.commit()
    print(f"  ✓ Seeded {len(energy_data)} energy readings, {len(waste_sources)} waste sources")


def seed_departments(db):
    depts = [
        Department(id="D001", name="Rolling Mill", head="Rajesh Kumar", efficiency=78, rank=4,
                   production=280, target=350, loss_contribution=32, downtime=5.2, incidents=4,
                   energy_waste=9, color="#f59e0b", trend="down",
                   weekly_efficiency=[82, 80, 79, 78, 77, 78, 78],
                   issues=["Conveyor M12 critical", "Scheduled maintenance overdue"]),
        Department(id="D002", name="Steel Melt Shop", head="Vikram Joshi", efficiency=86, rank=2,
                   production=322, target=350, loss_contribution=15, downtime=2.1, incidents=2,
                   energy_waste=7, color="#10b981", trend="up",
                   weekly_efficiency=[83, 84, 85, 85, 86, 86, 86],
                   issues=["Minor pump pressure issue"]),
        Department(id="D003", name="Blast Furnace", head="Dr. Anil Desai", efficiency=82, rank=3,
                   production=308, target=350, loss_contribution=22, downtime=3.5, incidents=3,
                   energy_waste=12, color="#0ea5e9", trend="stable",
                   weekly_efficiency=[81, 82, 83, 81, 82, 82, 82],
                   issues=["Coke Oven COM-1 at risk", "Energy leakage detected"]),
        Department(id="D004", name="Power Plant", head="Suresh Patil", efficiency=91, rank=1,
                   production=0, target=0, loss_contribution=8, downtime=1.2, incidents=1,
                   energy_waste=5, color="#10b981", trend="up",
                   weekly_efficiency=[89, 90, 90, 91, 91, 91, 91], issues=[]),
        Department(id="D005", name="Maintenance", head="Amit Sharma", efficiency=71, rank=5,
                   production=0, target=0, loss_contribution=23, downtime=6.8, incidents=5,
                   energy_waste=15, color="#ef4444", trend="down",
                   weekly_efficiency=[74, 73, 72, 72, 71, 71, 71],
                   issues=["2 critical machines overdue", "Response time increasing", "Staff shortage reported"]),
    ]
    for d in depts:
        db.merge(d)
    db.commit()
    print(f"  ✓ Seeded {len(depts)} departments")


def seed_knowledge(db):
    entries = [
        KnowledgeEntry(id="KV001", problem="Conveyor belt vibration exceeds 7 mm/s",
                       cause="Bearing wear due to contamination or fatigue",
                       solution="Stop conveyor immediately. Clean bearing housing. Replace bearing (SKF 6308-2RS). Align idler rollers. Restart at 50% speed and monitor for 2 hours.",
                       machine="Conveyor M12", department="Rolling Mill", severity="high",
                       added_by="Rajesh Kumar (Sr. Engineer)", date="2025-11-10",
                       tags=["bearing", "vibration", "conveyor", "rolling-mill"], success_rate=97, usage_count=14),
        KnowledgeEntry(id="KV002", problem="Blast Furnace fan noise and reduced airflow",
                       cause="Impeller blade erosion or foreign object lodged in housing",
                       solution="Shutdown fan safely. Inspect impeller for erosion or damage. Remove foreign objects. Rebalance impeller dynamically. Check inlet guide vanes.",
                       machine="Blast Furnace Fan BF-2", department="Blast Furnace", severity="high",
                       added_by="Dr. Anil Desai (Chief Engineer)", date="2025-09-22",
                       tags=["fan", "airflow", "impeller", "blast-furnace"], success_rate=94, usage_count=8),
        KnowledgeEntry(id="KV003", problem="Hydraulic pump pressure drops intermittently",
                       cause="Air ingestion through suction line leak or worn seal ring",
                       solution="Check suction lines for air leaks using soapy water test. Replace shaft seal if worn. Bleed air from system. Check reservoir oil level and cleanliness.",
                       machine="SMS Pump P-07", department="Steel Melt Shop", severity="medium",
                       added_by="Suresh Patil (Maintenance Engineer)", date="2026-01-15",
                       tags=["pump", "hydraulic", "pressure", "seal"], success_rate=92, usage_count=11),
        KnowledgeEntry(id="KV004", problem="Rolling mill motor overheating above 85°C",
                       cause="Blocked ventilation ducts, worn cooling fan, or overloading",
                       solution="Reduce load to 80% immediately. Clean ventilation ducts. Inspect cooling fan blades. Check if motor is overloaded — reduce feed rate. Allow 30 min cooling.",
                       machine="Rolling Mill Motor RM-3", department="Rolling Mill", severity="high",
                       added_by="Vikram Joshi (Lead Electrician)", date="2025-12-08",
                       tags=["motor", "temperature", "cooling", "overload"], success_rate=98, usage_count=19),
        KnowledgeEntry(id="KV005", problem="Generator voltage fluctuation during peak load",
                       cause="AVR (Automatic Voltage Regulator) malfunction or exciter fault",
                       solution="Check AVR settings and calibrate. Inspect exciter brushes for wear. Verify load balancing across phases. If unresolved, switch to standby generator.",
                       machine="Generator G-1", department="Power Plant", severity="critical",
                       added_by="Dr. Anil Desai (Chief Engineer)", date="2025-08-30",
                       tags=["generator", "voltage", "AVR", "power-plant"], success_rate=89, usage_count=5),
        KnowledgeEntry(id="KV006", problem="Coke oven gas pressure low during charging",
                       cause="Leaking offtake valve or blocked ascension pipe",
                       solution="Check all offtake valves for leakage. Rod the ascension pipe to clear blockage. Inspect gas collection main seals. Notify safety team before any repair.",
                       machine="Coke Oven Machine COM-1", department="Blast Furnace", severity="critical",
                       added_by="Rajesh Kumar (Sr. Engineer)", date="2026-02-14",
                       tags=["coke-oven", "gas", "pressure", "valve"], success_rate=91, usage_count=7),
        KnowledgeEntry(id="KV007", problem="Shift handover delay exceeds 30 minutes",
                       cause="Incomplete log books, absence of incoming supervisor, or unresolved alarms",
                       solution="Implement mandatory digital handover checklist. Notify incoming supervisor 1 hour before shift. All alarms must be acknowledged before handover completes.",
                       machine="Process (All)", department="All Departments", severity="medium",
                       added_by="HR & Operations Team", date="2026-03-01",
                       tags=["shift", "handover", "process", "human-factor"], success_rate=85, usage_count=22),
        KnowledgeEntry(id="KV008", problem="Material feed interruption from raw material yard",
                       cause="Conveyor overload, stacking machine fault, or stockpile exhaustion",
                       solution="Maintain 8-hour buffer stock at plant entry. Install level sensors in hoppers. Create alternate feed path from secondary yard. Alert procurement 24 hours in advance.",
                       machine="Material Handling System", department="Blast Furnace", severity="high",
                       added_by="Amit Sharma (Production Manager)", date="2026-04-18",
                       tags=["material", "feed", "stockpile", "conveyor"], success_rate=88, usage_count=16),
    ]
    for e in entries:
        db.merge(e)
    db.commit()
    print(f"  ✓ Seeded {len(entries)} knowledge entries")


def seed_users(db):
    users = [
        User(name="Anil Desai", email="manager@ispat.ai", role="Plant Manager", department="Management"),
        User(name="Rajesh Kumar", email="rajesh@ispat.ai", role="Maintenance Engineer", department="Rolling Mill"),
        User(name="Amit Sharma", email="amit@ispat.ai", role="Production Manager", department="Production"),
        User(name="Vikram Joshi", email="vikram@ispat.ai", role="Department Head", department="Steel Melt Shop"),
        User(name="Suresh Patil", email="suresh@ispat.ai", role="Operator", department="Power Plant"),
    ]
    for u in users:
        existing = db.query(User).filter_by(email=u.email).first()
        if not existing:
            db.add(u)
    db.commit()
    print(f"  ✓ Seeded {len(users)} users")


def seed_alerts(db):
    alerts = [
        Alert(type="sensor", severity="critical", title="Conveyor M12 — Critical Vibration",
              message="Vibration at 8.4 mm/s exceeds threshold of 7.0 mm/s. Bearing replacement required.",
              machine_id="M001", department="Rolling Mill"),
        Alert(type="sensor", severity="critical", title="Conveyor M12 — Temperature Warning",
              message="Temperature at 94°C exceeds threshold of 85°C. Immediate inspection required.",
              machine_id="M001", department="Rolling Mill"),
        Alert(type="maintenance", severity="critical", title="Coke Oven COM-1 — Overdue Maintenance",
              message="Maintenance overdue by 2 days. All sensors approaching threshold limits.",
              machine_id="M006", department="Blast Furnace"),
        Alert(type="production", severity="warning", title="Production Below Target",
              message="Today's production at 850T vs 1000T target (85% efficiency). 150T loss detected.",
              department="All"),
        Alert(type="energy", severity="warning", title="High Energy Waste — Idle Conveyors",
              message="18.5 MWh wasted on idle conveyor operations. ₹74,000/day impact.",
              department="Rolling Mill"),
        Alert(type="shift", severity="warning", title="Night Shift Performance Drop",
              message="Night shift efficiency at 74% — below minimum threshold of 80%. 4.2h downtime.",
              department="Production"),
    ]
    for a in alerts:
        db.add(a)
    db.commit()
    print(f"  ✓ Seeded {len(alerts)} alerts")


def run_seed():
    print("\n🌱 Seeding ISPAT AI Database...\n")
    init_db()
    db = SessionLocal()
    try:
        seed_machines(db)
        seed_sensors(db)
        seed_production(db)
        seed_rca(db)
        seed_shifts(db)
        seed_energy(db)
        seed_departments(db)
        seed_knowledge(db)
        seed_users(db)
        seed_alerts(db)
        print("\n✅ Database seeding complete!\n")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
