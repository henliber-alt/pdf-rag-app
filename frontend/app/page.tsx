"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DISCLAIMER =
  "הבהרה חשובה: המידע המוצג במערכת זו נועד למטרות מידע, עזר והתמצאות בלבד. אין באמור משום התחייבות של כלל ביטוח ופיננסים, והמידע אינו מחליף את תנאי הפוליסה המלאים, החריגים, הסייגים והנהלים הרלוונטיים. בכל מקרה של סתירה או אי התאמה, תנאי הפוליסה המלאים והוראות החברה הם הקובעים. כל מענה כפוף לבדיקה, חיתום, נהלי החברה ואישור הגורמים המוסמכים, לרבות מחלקת תביעות לפי העניין.";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [docSearch, setDocSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function fetchDocuments() {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/documents`);
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("לא ניתן לטעון את רשימת המסמכים");
      setDocuments([]);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function askQuestion() {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError("");
      setCopied(false);

      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error("Ask failed");

      const data = await res.json();
      setAnswer(data.answer || "");
      setSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err) {
      setError("אירעה שגיאה בקבלת התשובה");
    } finally {
      setLoading(false);
    }
  }

  async function summarizeDoc() {
    if (!selectedDoc) return;

    try {
      setLoading(true);
      setError("");
      setCopied(false);

      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_id: Number(selectedDoc) }),
      });

      if (!res.ok) throw new Error("Summarize failed");

      const data = await res.json();
      setAnswer(data.summary || "");
      setSources([]);
    } catch (err) {
      setError("אירעה שגיאה בסיכום המסמך");
    } finally {
      setLoading(false);
    }
  }

  async function compareDocs() {
    if (compareIds.length < 2) {
      setError("יש לבחור לפחות שני מסמכים להשוואה");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCopied(false);

      const res = await fetch(`${API_BASE}/api/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_ids: compareIds.map(Number) }),
      });

      if (!res.ok) throw new Error("Compare failed");

      const data = await res.json();
      setAnswer(data.comparison || "");
      setSources([]);
    } catch (err) {
      setError("אירעה שגיאה בהשוואת המסמכים");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyAnswer() {
    if (!answer) return;

    const textToCopy = `${answer}\n\n${DISCLAIMER}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("לא ניתן להעתיק את התשובה");
    }
  }

  function toggleCompare(docId) {
    const id = String(docId);
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredDocuments = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return documents;

    return documents.filter((doc) =>
      (doc.name || "").toLowerCase().includes(q)
    );
  }, [documents, docSearch]);

  return (
    <main style={pageStyle}>
      <div style={headerWrapStyle}>
        <h1 style={titleStyle}>
          פוליסות הבריאות של כלל ביטוח ופיננסים - שאלות, תשובות והשוואות
        </h1>

        <div style={disclaimerTopStyle}>{DISCLAIMER}</div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={layoutStyle}>
        <section style={mainCardStyle}>
          <h2 style={sectionTitleStyle}>שאל שאלה</h2>

          <textarea
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  placeholder={`לדוגמה:
מה ההבדלים בין פוליסת מושלם לפוליסה אחרת?
מה כוללת הפוליסה במקרה של ניתוח בארץ?
אילו חריגים עיקריים קיימים בפוליסה?
השווה בין שתי פוליסות בריאות מרכזיות
סכם לי את הפוליסה של ניתוחים וטיפולים מחליפי ניתוח`}
  style={textareaStyle}
/>

          <button onClick={askQuestion} disabled={loading} style={primaryButtonStyle}>
            {loading ? "טוען..." : "שאל"}
          </button>

          {answer ? (
            <div style={{ marginTop: 24 }}>
              <div style={answerHeaderStyle}>
                <h3 style={answerTitleStyle}>תשובה</h3>

                <button onClick={handleCopyAnswer} style={copyButtonStyle}>
                  {copied ? "הועתק" : "העתק"}
                </button>
              </div>

              <div style={answerBoxStyle}>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                  {answer}
                </div>

                <div style={answerDisclaimerStyle}>{DISCLAIMER}</div>
              </div>

              {Array.isArray(sources) && sources.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={sectionTitleStyle}>מקורות</h3>

                  {sources.map((src, idx) => (
                    <div key={idx} style={sourceStyle}>
                      <div>
                        <strong>מסמך:</strong>{" "}
                        {src.name || src.file_name || src.document_name || "ללא שם"}
                      </div>

                      {src.page_number ? (
                        <div style={{ marginTop: 4 }}>
                          <strong>עמוד:</strong> {src.page_number}
                        </div>
                      ) : null}

                      {src.quote || src.content ? (
                        <div style={quoteStyle}>
                          "{src.quote || src.content}"
                        </div>
                      ) : null}

                      {src.web_view_link ? (
                        <a
                          href={src.web_view_link}
                          target="_blank"
                          rel="noreferrer"
                          style={openLinkStyle}
                        >
                          פתח מסמך מקור
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <aside style={sideColumnStyle}>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>סיכום מסמך</h2>

            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              style={selectStyle}
            >
              <option value="">בחר מסמך לסיכום</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>

            <button
              onClick={summarizeDoc}
              disabled={loading || !selectedDoc}
              style={primaryButtonStyle}
            >
              {loading ? "טוען..." : "סכם מסמך"}
            </button>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>השוואת מסמכים</h2>
            <p style={helperTextStyle}>
              בחר לפחות שני מסמכים כדי לקבל השוואה ביניהם.
            </p>

            <div style={compareListStyle}>
              {documents.map((doc) => {
                const checked = compareIds.includes(String(doc.id));

                return (
                  <label key={doc.id} style={compareItemStyle}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCompare(doc.id)}
                    />
                    <span>{doc.name}</span>
                  </label>
                );
              })}
            </div>

            <button
              onClick={compareDocs}
              disabled={loading || compareIds.length < 2}
              style={primaryButtonStyle}
            >
              {loading ? "טוען..." : "השווה מסמכים"}
            </button>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>כל המסמכים</h2>

            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="חפש מסמך לפי שם..."
              style={searchInputStyle}
            />

            {filteredDocuments.length === 0 ? (
              <div style={emptyTextStyle}>לא נמצאו מסמכים</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} style={docCardStyle}>
                    <div>
                      <div style={docNameStyle}>{doc.name || "ללא שם"}</div>

                      {doc.modified_time ? (
                        <div style={docDateStyle}>
                          עודכן: {new Date(doc.modified_time).toLocaleString("he-IL")}
                        </div>
                      ) : null}
                    </div>

                    {doc.web_view_link ? (
                      <a
                        href={doc.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                        style={openLinkStyle}
                      >
                        פתח מסמך
                      </a>
                    ) : (
                      <span style={{ color: "#7c8ba1" }}>אין קישור</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

const pageStyle = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: 24,
  fontFamily: "Arial, sans-serif",
  direction: "rtl",
  background: "#f4f8fc",
  minHeight: "100vh",
  color: "#12345b",
};

const headerWrapStyle = {
  background: "linear-gradient(135deg, #0f4c81 0%, #1b6cb8 100%)",
  color: "#ffffff",
  borderRadius: 18,
  padding: 28,
  marginBottom: 24,
  boxShadow: "0 8px 24px rgba(15,76,129,0.18)",
};

const titleStyle = {
  margin: 0,
  marginBottom: 14,
  fontSize: 34,
  lineHeight: 1.3,
  fontWeight: 700,
};

const disclaimerTopStyle = {
  fontSize: 13,
  lineHeight: 1.8,
  color: "#e8f2ff",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 12,
  padding: 14,
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1.3fr 0.9fr",
  gap: 20,
  alignItems: "start",
};

const mainCardStyle = {
  background: "#ffffff",
  border: "1px solid #d8e5f2",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 4px 14px rgba(12,51,92,0.06)",
};

const sideColumnStyle = {
  display: "grid",
  gap: 20,
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #d8e5f2",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 4px 14px rgba(12,51,92,0.06)",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 16,
  color: "#0f4c81",
  fontSize: 24,
};

const helperTextStyle = {
  marginTop: -6,
  marginBottom: 12,
  color: "#5f738d",
  fontSize: 14,
};

const textareaStyle = {
  width: "100%",
  minHeight: 140,
  padding: 14,
  borderRadius: 12,
  border: "1px solid #bdd1e6",
  marginBottom: 12,
  fontSize: 16,
  background: "#fdfefe",
  color: "#12345b",
  outline: "none",
  lineHeight: 1.7,
};

const selectStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #bdd1e6",
  marginBottom: 12,
  fontSize: 16,
  background: "#ffffff",
  color: "#12345b",
};

const searchInputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #bdd1e6",
  marginBottom: 16,
  fontSize: 16,
  background: "#ffffff",
  color: "#12345b",
};

const primaryButtonStyle = {
  background: "#0f4c81",
  color: "#ffffff",
  border: "none",
  padding: "11px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
  boxShadow: "0 3px 10px rgba(15,76,129,0.18)",
};

const copyButtonStyle = {
  background: "#ffffff",
  color: "#0f4c81",
  border: "1px solid #b8cfe6",
  padding: "8px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
};

const errorStyle = {
  background: "#fff0f0",
  color: "#a62323",
  padding: 12,
  borderRadius: 12,
  marginBottom: 20,
  border: "1px solid #f3c4c4",
};

const answerHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  gap: 12,
};

const answerTitleStyle = {
  margin: 0,
  color: "#0f4c81",
};

const answerBoxStyle = {
  background: "#f7fbff",
  border: "1px solid #d7e7f6",
  borderRadius: 14,
  padding: 18,
};

const answerDisclaimerStyle = {
  marginTop: 18,
  paddingTop: 14,
  borderTop: "1px solid #d7e7f6",
  fontSize: 13,
  lineHeight: 1.8,
  color: "#4f6480",
};

const sourceStyle = {
  border: "1px solid #dbe8f5",
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  background: "#f9fcff",
};

const quoteStyle = {
  marginTop: 8,
  fontStyle: "italic",
  color: "#34506f",
  lineHeight: 1.7,
};

const compareListStyle = {
  maxHeight: 260,
  overflow: "auto",
  border: "1px solid #dbe8f5",
  borderRadius: 12,
  padding: 12,
  background: "#f9fcff",
  marginBottom: 12,
};

const compareItemStyle = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  marginBottom: 10,
  color: "#12345b",
};

const docCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #dbe8f5",
  borderRadius: 12,
  padding: 14,
  background: "#f9fcff",
  gap: 16,
};

const docNameStyle = {
  fontWeight: "bold",
  marginBottom: 4,
  color: "#12345b",
};

const docDateStyle = {
  fontSize: 13,
  color: "#6a7f98",
};

const openLinkStyle = {
  textDecoration: "none",
  background: "#1b6cb8",
  color: "#ffffff",
  padding: "10px 14px",
  borderRadius: 10,
  whiteSpace: "nowrap",
  fontWeight: 600,
  display: "inline-block",
};

const emptyTextStyle = {
  color: "#5f738d",
};