from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    top_k: int = 8


class SyncResponse(BaseModel):
    indexed_documents: int


class SummarizeRequest(BaseModel):
    document_id: int


class CompareRequest(BaseModel):
    document_ids: list[int]


class DiffRequest(BaseModel):
    older_document_id: int
    newer_document_id: int
