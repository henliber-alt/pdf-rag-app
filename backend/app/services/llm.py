from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.openai_api_key)


def embed_texts(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(model=settings.embedding_model, input=texts)
    return [item.embedding for item in response.data]


def answer_with_context(question: str, contexts: list[dict]) -> str:
    context_text = "\n\n".join(
        f"[מקור {i+1}] מסמך: {c['document_name']} | עמוד: {c['page_number']}\n{c['content']}"
        for i, c in enumerate(contexts)
    )
    prompt = f"""
ענה בעברית בלבד.
הסתמך רק על המקורות שסופקו.
אם אין מספיק מידע, אמור שאין מספיק מידע במאגר.
כלול תשובה מפורטת אך עניינית.
בסיום הוסף סעיף קצר בשם 'מקורות עיקריים'.

שאלה:
{question}

מקורות:
{context_text}
"""
    response = client.responses.create(
        model=settings.chat_model,
        input=prompt,
    )
    return response.output_text
