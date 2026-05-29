"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type QuizMeta = {
  id: string;
  session_number: number;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  pass_threshold: number;
  shuffle_questions: boolean;
  is_active: boolean;
  classes?: { class_code: string; class_name: string; courses?: { name: string } | null } | null;
};

type QuizItem = {
  id: string;
  order_index: number;
  content: string;
  options: string[];
  explanation: string | null;
  correct_indices: number[] | null;
};

type ResultPayload = {
  attempt: { score: number; correct_count: number; total_count: number; passed: boolean; status_changed?: boolean };
  items: Array<{
    id: string;
    content: string;
    options: string[];
    correct_indices: number[];
    explanation: string | null;
    chosen: number[];
    is_correct: boolean;
  }>;
  matched: boolean;
  reason: string;
  student_name?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PublicQuizPage() {
  const params = useParams<{ id: string }>();
  const quizId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [items, setItems] = useState<QuizItem[]>([]);

  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [email, setEmail] = useState("");
  const [startedAt] = useState<string>(() => new Date().toISOString());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${quizId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Không tải được quiz.");
        return;
      }
      const q: QuizMeta = json.quiz;
      const qItems: QuizItem[] = json.items ?? [];
      if (!q.is_active) {
        setError("Quiz này đang tạm dừng.");
        return;
      }
      setQuiz(q);
      setItems(q.shuffle_questions ? shuffle(qItems) : qItems);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { load(); }, [load]);

  const doSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${quizId}/share-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || null,
          started_at: startedAt,
          answers,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Nộp bài thất bại.");
        return;
      }
      setResult(json);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, submitting, quizId, email, startedAt, answers]);

  useEffect(() => {
    if (!quiz || result) return;
    if (!quiz.time_limit_minutes) return;
    const deadline = new Date(startedAt).getTime() + quiz.time_limit_minutes * 60_000;
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) doSubmit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [quiz, result, startedAt, doSubmit]);

  const toggleAnswer = (itemId: string, idx: number, multi: boolean) => {
    setAnswers((prev) => {
      const cur = prev[itemId] ?? [];
      if (multi) {
        return { ...prev, [itemId]: cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx] };
      }
      return { ...prev, [itemId]: cur[0] === idx ? [] : [idx] };
    });
  };

  const passLabel = useMemo(
    () => (quiz ? `${Math.round(Number(quiz.pass_threshold) * 100)}%` : ""),
    [quiz],
  );

  if (loading) {
    return (
      <div style={pageBg}>
        <div style={{ color: "#10b981", fontSize: 40, fontWeight: 900, letterSpacing: -2 }}>DUA</div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div style={pageBg}>
        <div style={card}>
          <h2 style={{ margin: 0, color: "#991b1b" }}>Có lỗi</h2>
          <p style={{ color: "#475569" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (result) {
    const att = result.attempt;
    const reasonText = (() => {
      if (!result.matched) {
        if (result.reason === "no_email") return "Bạn chưa nhập email — không thể tự chuyển trạng thái chuyên cần.";
        if (result.reason === "email_not_found") return "Email không khớp học viên DUA Edu nào — không tự chuyển trạng thái chuyên cần.";
        if (result.reason === "not_in_class") return `${result.student_name ?? "Bạn"} không thuộc lớp của quiz này — không tự chuyển trạng thái chuyên cần.`;
        return "Không tự chuyển trạng thái chuyên cần.";
      }
      if (result.reason === "already_submitted") return `${result.student_name ?? "Bạn"} đã làm quiz này rồi — đây là kết quả lần trước.`;
      return null;
    })();

    return (
      <div style={pageBg}>
        <div style={{ ...card, maxWidth: 820 }}>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>{quiz.title}</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>Buổi {quiz.session_number}{quiz.classes ? ` · ${quiz.classes.courses?.name ?? quiz.classes.class_name}` : ""}</p>

          <div style={{ marginTop: 18, padding: 18, borderRadius: 16, background: att.passed ? "#ecfdf5" : "#fff7ed", border: `1px solid ${att.passed ? "#6ee7b7" : "#fed7aa"}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: att.passed ? "#065f46" : "#9a3412", letterSpacing: 0.4, textTransform: "uppercase" }}>
              {att.passed ? "Đạt" : "Chưa đạt"}
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: att.passed ? "#047857" : "#c2410c", marginTop: 6 }}>
              {att.correct_count}/{att.total_count}
              <span style={{ fontSize: 16, color: "#64748b", fontWeight: 700, marginLeft: 10 }}>
                ({Math.round(att.score * 100)}%, ngưỡng đạt {passLabel})
              </span>
            </div>
            {att.status_changed && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#dcfce7", color: "#065f46", fontWeight: 700 }}>
                ✓ {result.student_name ?? "Bạn"} đã được chuyển sang <b>Có phép</b> cho buổi {quiz.session_number} (+0.5 điểm chuyên cần).
              </div>
            )}
            {result.matched && result.reason === "ok" && att.passed && !att.status_changed && (
              <div style={{ marginTop: 10, color: "#475569", fontSize: 13 }}>
                {result.student_name ?? "Bạn"} không bị đánh vắng buổi này nên trạng thái không thay đổi — quiz vẫn được ghi nhận.
              </div>
            )}
            {reasonText && (
              <div style={{ marginTop: 10, color: "#475569", fontSize: 13 }}>{reasonText}</div>
            )}
          </div>

          <h2 style={{ marginTop: 24, fontSize: 18 }}>Đáp án &amp; giải thích</h2>
          {result.items.map((it, idx) => {
            const correct = it.correct_indices ?? [];
            return (
              <div key={it.id} style={reviewBlock}>
                <div style={{ fontWeight: 800, color: "#1e293b" }}>
                  Câu {idx + 1}. {it.content}
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {it.options.map((opt, i) => {
                    const isCorrect = correct.includes(i);
                    const isChosen = it.chosen.includes(i);
                    let bg = "#f8fafc", border = "#e2e8f0", color = "#1e293b";
                    if (isCorrect) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; }
                    else if (isChosen) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; }
                    return (
                      <div key={i} style={{ padding: "10px 14px", border: `1px solid ${border}`, borderRadius: 10, background: bg, color, fontWeight: 600 }}>
                        {String.fromCharCode(65 + i)}. {opt}
                        {isCorrect && <span style={{ marginLeft: 8, fontSize: 12, color: "#10b981" }}>✓ đáp án đúng</span>}
                        {!isCorrect && isChosen && <span style={{ marginLeft: 8, fontSize: 12, color: "#ef4444" }}>✗ bạn chọn</span>}
                      </div>
                    );
                  })}
                </div>
                {it.explanation && (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#eff6ff", color: "#1e3a8a", fontSize: 14, border: "1px solid #bfdbfe" }}>
                    <b>Giải thích:</b> {it.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Taking
  const answered = Object.values(answers).filter((a) => a.length > 0).length;
  const total = items.length;
  const className = quiz.classes?.class_name || quiz.classes?.class_code;
  const courseName = quiz.classes?.courses?.name;

  return (
    <div style={pageBg}>
      <div style={{ ...card, maxWidth: 820 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f766e", letterSpacing: 0.4, textTransform: "uppercase" }}>
          Buổi {quiz.session_number}{courseName ? ` · ${courseName}` : ""}{className ? ` · ${className}` : ""}
        </div>
        <h1 style={{ margin: "6px 0 0", color: "#0f172a" }}>{quiz.title}</h1>
        {quiz.description && <p style={{ color: "#475569", marginTop: 8 }}>{quiz.description}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <span style={chip}>📝 {total} câu</span>
          {quiz.time_limit_minutes > 0 && (
            <span style={{ ...chip, background: secondsLeft != null && secondsLeft < 60 ? "#fef2f2" : "#eff6ff", color: secondsLeft != null && secondsLeft < 60 ? "#991b1b" : "#1e3a8a" }}>
              ⏱ {secondsLeft != null ? formatSeconds(secondsLeft) : `${quiz.time_limit_minutes} phút`}
            </span>
          )}
          <span style={chip}>Đạt khi ≥ {passLabel}</span>
          <span style={chip}>Đã chọn {answered}/{total}</span>
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {items.map((it, idx) => {
            const multi = (it.correct_indices?.length ?? 0) > 1;
            const cur = answers[it.id] ?? [];
            return (
              <div key={it.id} style={reviewBlock}>
                <div style={{ fontWeight: 800, color: "#1e293b" }}>
                  Câu {idx + 1}. {it.content} {multi && <span style={{ fontSize: 12, color: "#0f766e", fontWeight: 600 }}>(chọn nhiều)</span>}
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {it.options.map((opt, i) => {
                    const checked = cur.includes(i);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleAnswer(it.id, i, multi)}
                        style={{
                          textAlign: "left",
                          padding: "12px 14px",
                          border: `1.5px solid ${checked ? "#10b981" : "#e2e8f0"}`,
                          borderRadius: 10,
                          background: checked ? "#ecfdf5" : "#ffffff",
                          color: checked ? "#065f46" : "#1e293b",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, padding: 18, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0f172a" }}>Email của bạn @gmail.com</h3>
          <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
            Nếu bạn là học viên đang đăng ký lớp này, nhập email để hệ thống ghi nhận kết quả. Nếu bạn đang bị đánh vắng buổi {quiz.session_number} và đạt quiz, hệ thống sẽ tự chuyển sang <b>Có phép</b>.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@gmail.com"
            style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, background: "white" }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#fef2f2", color: "#991b1b", fontWeight: 700 }}>{error}</div>
        )}

        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            {answered === total ? "Sẵn sàng nộp bài." : `Còn ${total - answered} câu chưa chọn.`}
          </div>
          <button
            disabled={submitting || answered === 0}
            onClick={doSubmit}
            style={{ ...btnPrimary, opacity: submitting || answered === 0 ? 0.6 : 1 }}
          >
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const pageBg: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 16px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};
const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 820,
  background: "white",
  borderRadius: 20,
  padding: "26px 28px",
  boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
};
const btnPrimary: React.CSSProperties = {
  padding: "12px 22px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};
const chip: React.CSSProperties = {
  padding: "6px 12px",
  background: "#f1f5f9",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  color: "#334155",
};
const reviewBlock: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 18,
  background: "#ffffff",
};
