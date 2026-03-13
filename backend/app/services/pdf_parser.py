from typing import Iterable
import fitz


def extract_chunks_from_pdf(pdf_bytes: bytes, max_chars: int = 1400) -> Iterable[dict]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page_idx, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        if not text:
            continue
        start = 0
        chunk_index = 0
        while start < len(text):
            chunk = text[start:start + max_chars]
            yield {
                "page_number": page_idx,
                "chunk_index": chunk_index,
                "content": chunk,
            }
            start += max_chars
            chunk_index += 1
