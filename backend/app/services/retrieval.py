from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.models import Document, DocumentChunk
from app.services.llm import embed_texts


def search_chunks(db: Session, question: str, top_k: int = 8):
    embedding = embed_texts([question])[0]
    sql = text(
        """
        SELECT dc.id, dc.content, dc.page_number, d.name AS document_name, d.web_view_link, d.id AS document_id,
               dc.embedding <=> CAST(:embedding AS vector) AS distance
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
        """
    )
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    rows = db.execute(sql, {"embedding": embedding_str, "top_k": top_k}).mappings().all()
    return [dict(r) for r in rows]


def get_document_text(db: Session, document_id: int) -> str:
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.page_number.asc(), DocumentChunk.chunk_index.asc())
        .all()
    )
    return "\n\n".join(chunk.content for chunk in chunks)


def list_documents(db: Session):
    return db.query(Document).order_by(Document.name.asc()).all()
