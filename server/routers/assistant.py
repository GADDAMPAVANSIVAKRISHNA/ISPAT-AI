"""Assistant API — backend-powered chat with Gemini using real-time plant data."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import httpx
from database import get_db
from models.machine import Machine
from models.production import DailyProduction
from models.shift import ShiftRecord
from models.energy import EnergyWaste
from models.department import Department
from data.simulator import get_current_sensors

router = APIRouter(prefix="/api/v1/assistant", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str
    api_key: str = ""


def build_plant_context(db: Session) -> str:
    # 1. Today's production
    today = db.query(DailyProduction).order_by(DailyProduction.id.desc()).first()
    prod_str = ""
    if today:
        prod_str = f"- Today's Production: {today.actual} Tons (Target: {today.target} Tons, Loss: {today.loss} Tons)\n- Plant Efficiency: {today.efficiency}%\n- Total Downtime: {today.downtime} Hours"
    else:
        prod_str = "- Today's Production: 850 Tons (Target: 1000 Tons, Loss: 150 Tons)\n- Plant Efficiency: 85%\n- Total Downtime: 4.2 Hours"

    # 2. Critical machines
    machines = db.query(Machine).filter(Machine.status != "healthy").all()
    m_str = ""
    for i, m in enumerate(machines):
        sensors = get_current_sensors(db, m.id)
        temp_val = sensors.get("temperature", {}).get("value", "N/A")
        temp_unit = sensors.get("temperature", {}).get("unit", "")
        vib_val = sensors.get("vibration", {}).get("value", "N/A")
        vib_unit = sensors.get("vibration", {}).get("unit", "")
        m_str += f"{i+1}. {m.name} ({m.department}) - Failure Risk: {m.failure_probability}%, RUL: {m.rul_days} days. Temp: {temp_val}{temp_unit}, Vibration: {vib_val}{vib_unit}\n"
    if not m_str:
        m_str = "No critical machines detected. All machines operating normally."

    # 3. Shifts
    shifts = db.query(ShiftRecord).order_by(ShiftRecord.id.desc()).limit(3).all()
    s_str = ""
    for s in shifts:
        s_str += f"- {s.name}: {s.efficiency}% efficiency (Supervisor: {s.supervisor})\n"

    # 4. Departments
    depts = db.query(Department).order_by(Department.efficiency.desc()).all()
    d_str = ""
    for i, d in enumerate(depts):
        d_str += f"{i+1}. {d.name}: {d.efficiency}% (Incidents: {d.incidents}, Downtime: {d.downtime}h)\n"

    # 5. Energy Waste
    wastes = db.query(EnergyWaste).order_by(EnergyWaste.waste_mwh.desc()).limit(3).all()
    w_str = ""
    for w in wastes:
        w_str += f"- {w.source}: {w.waste_mwh} MWh wasted ({w.cost}/day impact)\n"

    context = f"""
You are ISPAT AI Assistant, an expert AI operational intelligence system for Ispat Steel Plant.

Current Plant Status:
{prod_str}

CRITICAL MACHINES:
{m_str}

SHIFT PERFORMANCE:
{s_str}

DEPARTMENT EFFICIENCY:
{d_str}

ENERGY WASTE PATHWAYS:
{w_str}

Answer questions concisely, professionally, and use the real-time data provided above. Provide actionable engineering recommendations. Use clear formatting and bullet points.
"""
    return context


@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Look for API Key: 1. Environment variable, 2. Passed key
    key = os.getenv("GEMINI_API_KEY") or request.api_key
    if not key:
        raise HTTPException(status_code=400, detail="Gemini API Key not found. Please provide an API key in settings or environment.")

    context = build_plant_context(db)
    prompt = f"{context}\n\nUser question: {request.message}"

    MODELS = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.0-pro'
    ]

    async with httpx.AsyncClient() as client:
        last_error = None
        for model in MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
                response = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
                    },
                    timeout=30.0
                )
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if text:
                        return {"content": text, "model": model}
                else:
                    last_error = f"Model {model} failed with status {response.status_code}: {response.text}"
            except Exception as e:
                last_error = str(e)
                continue

        raise HTTPException(status_code=500, detail=f"Failed to generate content: {last_error}")
