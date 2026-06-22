"""Knowledge Vault API — full CRUD for knowledge entries."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
from models.knowledge import KnowledgeEntry

router = APIRouter(prefix="/api/v1/knowledge", tags=["Knowledge Vault"])


class KnowledgeCreate(BaseModel):
    problem: str
    cause: str
    solution: str
    machine: str
    department: str
    severity: str = "medium"
    added_by: str = "System User"


@router.get("")
def get_knowledge(
    search: str = None,
    department: str = None,
    severity: str = None,
    db: Session = Depends(get_db)
):
    """Search and filter knowledge entries."""
    query = db.query(KnowledgeEntry)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            KnowledgeEntry.problem.ilike(search_term)
            | KnowledgeEntry.cause.ilike(search_term)
            | KnowledgeEntry.solution.ilike(search_term)
        )

    if department and department != "All Departments":
        query = query.filter(KnowledgeEntry.department == department)

    if severity and severity != "All":
        query = query.filter(KnowledgeEntry.severity == severity)

    entries = query.order_by(KnowledgeEntry.usage_count.desc()).all()

    return [
        {
            "id": e.id, "problem": e.problem, "cause": e.cause,
            "solution": e.solution, "machine": e.machine,
            "department": e.department, "severity": e.severity,
            "addedBy": e.added_by, "date": e.date,
            "tags": e.tags or [], "successRate": e.success_rate,
            "usageCount": e.usage_count,
        }
        for e in entries
    ]


@router.post("")
def create_knowledge(entry: KnowledgeCreate, db: Session = Depends(get_db)):
    """Create a new knowledge entry."""
    count = db.query(KnowledgeEntry).count()
    new_id = f"KV{count + 1:03d}"

    tags = [
        entry.machine.lower().replace(" ", "-"),
        entry.department.lower().replace(" ", "-"),
    ]

    db_entry = KnowledgeEntry(
        id=new_id,
        problem=entry.problem,
        cause=entry.cause,
        solution=entry.solution,
        machine=entry.machine,
        department=entry.department,
        severity=entry.severity,
        added_by=entry.added_by,
        date=datetime.now().strftime("%Y-%m-%d"),
        tags=tags,
        success_rate=90.0,
        usage_count=0,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    return {
        "id": db_entry.id, "problem": db_entry.problem,
        "message": "Knowledge entry created successfully"
    }


@router.get("/stats")
def get_knowledge_stats(db: Session = Depends(get_db)):
    """Get knowledge vault statistics."""
    entries = db.query(KnowledgeEntry).all()
    if not entries:
        return {"total": 0, "avgSuccessRate": 0, "totalUsages": 0}
    return {
        "total": len(entries),
        "avgSuccessRate": round(sum(e.success_rate for e in entries) / len(entries)),
        "totalUsages": sum(e.usage_count for e in entries),
    }
