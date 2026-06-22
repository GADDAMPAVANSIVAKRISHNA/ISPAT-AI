"""
ISPAT AI — Backend Server
FastAPI application with REST APIs, ML model serving, and real-time data simulation.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from database import init_db
from ml.inference import ml_service
from data.simulator import simulate_sensor_tick

from routers import dashboard, machines, production, shifts, energy, departments, knowledge, alerts, auth, assistant

# Background scheduler for data simulation
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("\n[*] ISPAT AI Backend Starting...\n")

    # Initialize database
    print("  [DB] Initializing database...")
    init_db()

    # Load ML models
    print("  [ML] Loading ML models...")
    ml_service.load_models()

    # Start data simulator
    print("  [SIM] Starting data simulator...")
    scheduler.add_job(simulate_sensor_tick, "interval", seconds=10, id="sensor_sim")
    scheduler.start()

    print("\n[OK] ISPAT AI Backend Ready!\n")
    print("  [DOCS] API Docs: http://localhost:8000/docs")
    print("  [API]  API Base: http://localhost:8000/api/v1\n")

    yield

    # Shutdown
    print("\n[STOP] Shutting down ISPAT AI Backend...")
    scheduler.shutdown(wait=False)


# Create FastAPI app
app = FastAPI(
    title="ISPAT AI — Steel Manufacturing Intelligence Platform",
    description="Production-ready backend for steel plant operational intelligence with ML-powered predictions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(dashboard.router)
app.include_router(machines.router)
app.include_router(production.router)
app.include_router(shifts.router)
app.include_router(energy.router)
app.include_router(departments.router)
app.include_router(knowledge.router)
app.include_router(alerts.router)
app.include_router(auth.router)
app.include_router(assistant.router)


@app.get("/")
def root():
    return {
        "name": "ISPAT AI Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "ml_models_loaded": ml_service._loaded,
        "simulator_running": scheduler.running,
    }
