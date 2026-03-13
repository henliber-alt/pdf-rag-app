from difflib import unified_diff
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import Base, engine, get_db
from app.schemas import AskRequest, CompareRequest, DiffRequest, SummarizeRequest, SyncResponse
from app.services.llm import answer_with_context
from app.services.retrieval import get_document_text, list_documents, search_chunks
from app.services.sync import sync_drive_folder

app = FastAPI(title="PDF RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/sync", response_model=SyncResponse)
def sync(db: Session = Depends(get_db)):
    indexed = sync_drive_folder(db)
    return {"indexed_documents": indexed}


@app.get("/api/documents")
def documents(db: Session = Depends(get_db)):
    docs = list_documents(db)
    return [
        {
            "id": d.id,
            "name": d.name,
            "web_view_link": d.web_view_link,
            "modified_time": d.modified_time,
        }
        for d in docs
    ]


@app.post("/api/ask")
def ask(payload: AskRequest, db: Session = Depends(get_db)):
    chunks = search_chunks(db, payload.question, payload.top_k)
    answer = answer_with_context(payload.question, chunks)
    return {"answer": answer, "sources": chunks}


@app.post("/api/summarize")
def summarize(payload: SummarizeRequest, db: Session = Depends(get_db)):
    content = get_document_text(db, payload.document_id)
    answer = answer_with_context("סכם את המסמך בצורה מפורטת בעברית עם סעיפים עיקריים", [{
        "document_name": f"document-{payload.document_id}",
        "page_number": 1,
        "content": content[:20000],
    }])
    return {"summary": answer}


@app.post("/api/compare")
def compare(payload: CompareRequest, db: Session = Depends(get_db)):
    contexts = []
    for doc_id in payload.document_ids[:5]:
        contexts.append({
            "document_name": f"document-{doc_id}",
            "page_number": 1,
            "content": get_document_text(db, doc_id)[:15000],
        })
    answer = answer_with_context("השווה בין המסמכים הבאים בעברית: דמיון, הבדלים, נושאים מרכזיים, מסקנות", contexts)
    return {"comparison": answer}


@app.post("/api/diff")
def diff_docs(payload: DiffRequest, db: Session = Depends(get_db)):
    old_text = get_document_text(db, payload.older_document_id).splitlines()
    new_text = get_document_text(db, payload.newer_document_id).splitlines()
    raw_diff = "\n".join(unified_diff(old_text, new_text, fromfile="older", tofile="newer", n=2))
    answer = answer_with_context("סכם בעברית מה השתנה בין הגרסה הישנה לחדשה. התמקד בתוספות, מחיקות ושינויים מהותיים.", [{
        "document_name": "diff",
        "page_number": 1,
        "content": raw_diff[:25000],
    }])
    return {"diff_summary": answer, "raw_diff": raw_diff[:50000]}
