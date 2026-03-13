# אפליקציית שאלות-תשובות על PDF מ-Google Drive

זהו בסיס מלא ל-MVP של מערכת RAG שמבוססת **רק** על קבצי PDF שיושבים בתיקייה ב-Google Drive.

המערכת כוללת:
- סנכרון PDFים מתיקיית Google Drive
- חילוץ טקסט לפי עמודים
- אינדוקס ל-PostgreSQL + pgvector
- שאלות ותשובות בעברית על בסיס המאגר בלבד
- ציטוטים עם שם מסמך, עמוד וקישור למסמך
- סיכום מסמך
- השוואה בין מסמכים
- זיהוי מה השתנה בין שתי גרסאות

## ארכיטקטורה
- **Frontend**: Next.js 15
- **Backend**: FastAPI
- **DB**: PostgreSQL + pgvector
- **PDF parsing**: PyMuPDF
- **LLM / embeddings**: OpenAI API
- **Google Drive access**: Service Account + shared folder

## מה אתה צריך לעשות עכשיו – שלב אחרי שלב

### שלב 1 – הכנת Google Cloud
1. היכנס ל-Google Cloud Console.
2. צור Project חדש.
3. הפעל את **Google Drive API**.
4. צור **Service Account**.
5. צור עבורו JSON key והורד את הקובץ.
6. שתף את תיקיית ה-Drive שבה יושבים ה-PDFים עם כתובת המייל של ה-Service Account כ-Viewer.
7. שמור את מזהה התיקייה (`folder_id`) מתוך ה-URL של התיקייה.

דוגמה:
אם הקישור הוא:
`https://drive.google.com/drive/folders/1AbCdEfGhIjKlMn`
אז ה-`folder_id` הוא:
`1AbCdEfGhIjKlMn`

### שלב 2 – OpenAI API
1. צור API key.
2. תשמור אותו לצורך קובץ ה-`.env`.

### שלב 3 – התקנת Docker
תצטרך מחשב עם:
- Docker Desktop
- Git
- Node.js 22+
- Python 3.12+

### שלב 4 – יצירת קבצי סביבה
#### backend/.env
```env
OPENAI_API_KEY=your_openai_key
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_SERVICE_ACCOUNT_FILE=/app/secrets/google-service-account.json
DATABASE_URL=postgresql+psycopg://app:app@db:5432/pdf_rag
EMBEDDING_MODEL=text-embedding-3-large
CHAT_MODEL=gpt-5-mini
APP_BASE_URL=http://localhost:3000
```

#### frontend/.env.local
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### שלב 5 – מיקום קובץ ה-Service Account
העתק את קובץ ה-JSON שהורדת לנתיב הבא:
`backend/secrets/google-service-account.json`

### שלב 6 – הרצה
מה-root של הפרויקט:
```bash
docker compose up --build
```

לאחר מכן:
- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

### שלב 7 – סנכרון ראשוני
בממשק לחץ על **סנכרון עכשיו**
או שלח POST ל:
`POST /api/sync`

### שלב 8 – בדיקה
שאל בממשק:
- "מה כתוב במסמכים לגבי עמלות?"
- "סכם לי את המסמך X"
- "מה ההבדל בין המסמך A למסמך B?"

## מה עוד תצטרך ממך בהמשך
1. להחליט אם השמות של קבצים מייצגים גרסאות או שצריך שדה ייעודי.
2. להחליט אם אתה רוצה סנכרון אוטומטי כל שעה.
3. להחליט אם לשמור היסטוריית שאלות.
4. להחליט אם תרצה בהמשך הרשאות משתמשים.

## הערות חשובות
- המערכת מניחה שה-PDFים הם **טקסטואליים**. אם חלקם סרוקים כתמונה, תצטרך בהמשך OCR.
- כרגע זה MVP עובד עם מבנה ברור להרחבה.
- לפני Production רצוי להוסיף:
  - Sentry
  - Auth
  - Rate limiting
  - background jobs (Celery / RQ)
  - Redis caching
  - cron sync

## מבנה הפרויקט
```text
pdf-rag-app/
  backend/
  frontend/
  infra/
  docker-compose.yml
  README.md
```
