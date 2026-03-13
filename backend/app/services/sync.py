from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Document, DocumentChunk
from app.services.google_drive import list_pdf_files, download_file
from app.services.llm import embed_texts
from app.services.pdf_parser import extract_chunks_from_pdf


def sync_drive_folder(db: Session) -> int:
    files = list_pdf_files(settings.google_drive_folder_id)
    indexed = 0

    for file_meta in files:
        existing = (
            db.query(Document)
            .filter(Document.drive_file_id == file_meta["id"])
            .first()
        )

        # אם המסמך כבר קיים, תמיד נעדכן את המטא-דאטה
        # גם אם התוכן לא השתנה
        if existing:
            existing.name = file_meta["name"]
            existing.web_view_link = file_meta.get("webViewLink", "")
            existing.modified_time = file_meta.get("modifiedTime")

            # אם ה-MD5 זהה, התוכן לא השתנה ולכן לא צריך לאנדקס מחדש
            if existing.md5_checksum == file_meta.get("md5Checksum"):
                indexed += 1
                continue

        pdf_bytes = download_file(file_meta["id"])
        chunks = list(extract_chunks_from_pdf(pdf_bytes))
        if not chunks:
            continue

        embeddings = embed_texts([chunk["content"] for chunk in chunks])

        if existing:
            db.query(DocumentChunk).filter(
                DocumentChunk.document_id == existing.id
            ).delete()

            doc = existing
            doc.md5_checksum = file_meta.get("md5Checksum")
        else:
            doc = Document(
                drive_file_id=file_meta["id"],
                name=file_meta["name"],
                web_view_link=file_meta.get("webViewLink", ""),
                md5_checksum=file_meta.get("md5Checksum"),
                modified_time=file_meta.get("modifiedTime"),
            )
            db.add(doc)
            db.flush()

        for idx, chunk in enumerate(chunks):
            db.add(
                DocumentChunk(
                    document_id=doc.id,
                    page_number=chunk["page_number"],
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    embedding=embeddings[idx],
                )
            )

        indexed += 1

    db.commit()
    return indexed