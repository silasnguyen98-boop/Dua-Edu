"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { exportQuizTemplateXlsx, exportQuizzesXlsx, parseQuizzesXlsx, type ParsedQuiz } from "../quiz/excel";

type ClassRow = {
  id: string;
  class_code: string;
  class_name: string;
  total_sessions: number | null;
  course?: { name: string } | null;
};

interface QuizViewProps {
  visibleClassItems: Array<{
    id: string;
    classCode: string;
    className: string;
    courseName?: string;
    totalSessions?: string | number | null;
  }>;
}

type QuizSummary = {
  id: string;
  class_id: string;
  session_number: number;
  title: string;
  description: string | null;
  open_at: string | null;
  close_at: string | null;
  time_limit_minutes: number;
  pass_threshold: number;
  shuffle_questions: boolean;
  is_active: boolean;
  quiz_items: any[];
};

type DraftItem = {
  content: string;
  options: string[];
  correct: boolean[];
  explanation: string;
};

const emptyItem = (): DraftItem => ({
  content: "",
  options: ["", "", "", ""],
  correct: [false, false, false, false],
  explanation: "",
});

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoOrNull(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function QuizView({ visibleClassItems }: QuizViewProps) {
  const classes: ClassRow[] = useMemo(
    () =>
      visibleClassItems.map((c) => ({
        id: c.id,
        class_code: c.classCode,
        class_name: c.className,
        total_sessions: c.totalSessions == null || c.totalSessions === "-" ? null : Number(c.totalSessions),
        course: c.courseName ? { name: c.courseName } : null,
      })),
    [visibleClassItems],
  );
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [sessions, setSessions] = useState<{ session_number: number; session_title: string | null }[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Draft form
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftOpenAt, setDraftOpenAt] = useState("");
  const [draftCloseAt, setDraftCloseAt] = useState("");
  const [draftTimeLimit, setDraftTimeLimit] = useState<number>(15);
  const [draftPassPct, setDraftPassPct] = useState<number>(40);
  const [draftShuffle, setDraftShuffle] = useState<boolean>(true);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyItem()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [attemptsByQuiz, setAttemptsByQuiz] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importTargetSession, setImportTargetSession] = useState<number | null>(null);
  const [shareQuiz, setShareQuiz] = useState<QuizSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareSubmissions, setShareSubmissions] = useState<any[]>([]);
  const [shareSubLoading, setShareSubLoading] = useState(false);
  const [historyQuiz, setHistoryQuiz] = useState<QuizSummary | null>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Khôi phục lớp đã chọn lần trước nếu vẫn nằm trong danh sách được phép thấy.
  useEffect(() => {
    if (classes.length === 0) return;
    if (selectedClassId && classes.some((c) => c.id === selectedClassId)) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem("adminQuiz.selectedClassId") : null;
    if (saved && classes.some((c) => c.id === saved)) {
      setSelectedClassId(saved);
    } else if (classes.length === 1) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedClassId) {
      localStorage.setItem("adminQuiz.selectedClassId", selectedClassId);
    } else {
      localStorage.removeItem("adminQuiz.selectedClassId");
    }
  }, [selectedClassId]);

  const loadSessionsAndQuizzes = useCallback(async (classId: string) => {
    // Clear state cũ ngay để table không hiển thị dữ liệu của lớp trước.
    setSessions([]);
    setQuizzes([]);
    setAttemptsByQuiz({});
    if (!classId) return;
    const [{ data: sData }, { data: qData }] = await Promise.all([
      supabase
        .from("class_sessions")
        .select("session_number, session_title")
        .eq("class_id", classId)
        .order("session_number", { ascending: true }),
      supabase
        .from("quizzes")
        .select(`id, class_id, session_number, title, description, open_at, close_at,
                 time_limit_minutes, pass_threshold, shuffle_questions, is_active,
                 quiz_items ( id, order_index, content, options, correct_indices, explanation )`)
        .eq("class_id", classId)
        .order("session_number", { ascending: true }),
    ]);
    setSessions((sData as any[]) ?? []);
    setQuizzes((qData as any[]) ?? []);

    const quizIds = ((qData as any[]) ?? []).map((q) => q.id);
    if (quizIds.length > 0) {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id")
        .in("quiz_id", quizIds);
      const counts: Record<string, number> = {};
      (attempts ?? []).forEach((a: any) => {
        counts[a.quiz_id] = (counts[a.quiz_id] ?? 0) + 1;
      });
      setAttemptsByQuiz(counts);
    } else {
      setAttemptsByQuiz({});
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) loadSessionsAndQuizzes(selectedClassId);
  }, [selectedClassId, loadSessionsAndQuizzes]);

  const existingQuiz = useMemo(
    () => quizzes.find((q) => q.session_number === selectedSession) ?? null,
    [quizzes, selectedSession],
  );

  const resetDraft = useCallback((quiz: QuizSummary | null) => {
    if (!quiz) {
      setDraftTitle("");
      setDraftDescription("");
      setDraftOpenAt("");
      setDraftCloseAt("");
      setDraftTimeLimit(15);
      setDraftPassPct(40);
      setDraftShuffle(true);
      setDraftItems([emptyItem()]);
      setEditingId(null);
      return;
    }
    setDraftTitle(quiz.title);
    setDraftDescription(quiz.description ?? "");
    setDraftOpenAt(toLocalDateTime(quiz.open_at));
    setDraftCloseAt(toLocalDateTime(quiz.close_at));
    setDraftTimeLimit(quiz.time_limit_minutes);
    setDraftPassPct(Math.round(Number(quiz.pass_threshold) * 100));
    setDraftShuffle(quiz.shuffle_questions);
    const items = (quiz.quiz_items ?? []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    setDraftItems(
      items.length === 0
        ? [emptyItem()]
        : items.map((it: any) => {
            const opts: string[] = it.options ?? [];
            const correctSet = new Set<number>(it.correct_indices ?? []);
            return {
              content: it.content,
              options: opts.length >= 2 ? opts : [...opts, "", ""].slice(0, Math.max(2, opts.length)),
              correct: opts.map((_, i) => correctSet.has(i)),
              explanation: it.explanation ?? "",
            };
          }),
    );
    setEditingId(quiz.id);
  }, []);

  useEffect(() => {
    // Khi đổi lớp: đóng form đang mở (tránh leak draft sang lớp khác).
    setShowForm(false);
    setEditingId(null);
    setMessage(null);
  }, [selectedClassId]);

  const openCreateForm = () => {
    resetDraft(null);
    setSelectedSession(1);
    setMessage(null);
    setShowForm(true);
  };

  const openEditForm = (quiz: QuizSummary) => {
    resetDraft(quiz);
    setSelectedSession(quiz.session_number);
    setMessage(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setMessage(null);
  };

  const handleExportQuiz = async (q: QuizSummary) => {
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return;
    try {
      await exportQuizzesXlsx({
        classInfo: { code: `${cls.class_code}_buoi-${q.session_number}`, name: cls.class_name, course: cls.course?.name },
        quizzes: [q] as any,
      });
      setMessage({ kind: "ok", text: `Đã tải buổi ${q.session_number}: ${q.title}.` });
    } catch (e: any) {
      setMessage({ kind: "err", text: e.message || "Lỗi khi tạo file Excel." });
    }
  };

  const handleExportTemplateForSession = async (sessionNumber: number) => {
    const cls = classes.find((c) => c.id === selectedClassId);
    try {
      await exportQuizTemplateXlsx({
        classInfo: { code: cls?.class_code ?? "TEMPLATE", name: cls?.class_name ?? "Mẫu" },
        sessionNumber,
      });
      setMessage({ kind: "ok", text: `Đã tải mẫu buổi ${sessionNumber} — điền nội dung rồi nhập lại.` });
    } catch (e: any) {
      setMessage({ kind: "err", text: e.message || "Lỗi khi tạo file mẫu." });
    }
  };

  const importQuizzes = async (parsed: ParsedQuiz[]) => {
    if (!selectedClassId) return;
    const existingBySession = new Map<number, string>();
    quizzes.forEach((q) => existingBySession.set(q.session_number, q.id));

    const conflicts = parsed.filter((p) => existingBySession.has(p.session_number));
    const isSingleSession = parsed.length === 1;
    const proceed = window.confirm(
      isSingleSession
        ? `Sẽ tạo quiz cho buổi ${parsed[0].session_number}${conflicts.length > 0 ? " (ghi đè quiz cũ + mọi lượt làm)" : ""}.\n\nTiếp tục?`
        : `Sẽ tạo ${parsed.length} quiz từ file:\n` +
          `  • ${parsed.length - conflicts.length} mới\n` +
          `  • ${conflicts.length} ghi đè (xoá quiz cũ + mọi lượt làm)\n\nTiếp tục?`
    );
    if (!proceed) return;

    setImporting(true);
    setMessage(null);
    let ok = 0;
    const errors: string[] = [];
    try {
      for (const p of parsed) {
        const existingId = existingBySession.get(p.session_number);
        if (existingId) {
          await fetch(`/api/quiz/${existingId}`, { method: "DELETE" });
        }
        const payload = {
          class_id: selectedClassId,
          session_number: p.session_number,
          title: p.title,
          description: p.description || null,
          open_at: p.open_at,
          close_at: p.close_at,
          time_limit_minutes: p.time_limit_minutes,
          pass_threshold: Math.min(1, Math.max(0, p.pass_pct / 100)),
          shuffle_questions: p.shuffle_questions,
          items: p.items.map((it) => ({
            content: it.content,
            options: it.options,
            correct_indices: it.correct_indices,
            explanation: it.explanation || null,
          })),
        };
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          errors.push(`Buổi ${p.session_number}: ${j.error || res.statusText}`);
        } else {
          ok++;
        }
      }
      await loadSessionsAndQuizzes(selectedClassId);
      if (errors.length === 0) {
        setMessage({ kind: "ok", text: `Đã import ${ok}/${parsed.length} quiz.` });
      } else {
        setMessage({ kind: "err", text: `Import ${ok}/${parsed.length} quiz. Lỗi:\n${errors.slice(0, 5).join("\n")}` });
      }
    } finally {
      setImporting(false);
    }
  };

  const loadShareSubmissions = useCallback(async (quizId: string) => {
    setShareSubLoading(true);
    try {
      const { data } = await supabase
        .from("quiz_share_submissions")
        .select("id, email, matched_student_id, correct_count, total_count, score, passed, status_changed, match_reason, submitted_at, students:matched_student_id(full_name)")
        .eq("quiz_id", quizId)
        .order("submitted_at", { ascending: false })
        .limit(200);
      setShareSubmissions(data ?? []);
    } finally {
      setShareSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shareQuiz) {
      loadShareSubmissions(shareQuiz.id);
    } else {
      setShareSubmissions([]);
    }
  }, [shareQuiz, loadShareSubmissions]);

  const loadHistory = useCallback(async (quizId: string) => {
    setHistoryLoading(true);
    try {
      const [attemptsRes, sharesRes] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("id, score, passed, correct_count, total_count, was_absent, status_changed, submitted_at, started_at, students:student_id(full_name, email)")
          .eq("quiz_id", quizId)
          .order("submitted_at", { ascending: false }),
        supabase
          .from("quiz_share_submissions")
          .select("id, email, correct_count, total_count, score, passed, status_changed, match_reason, submitted_at, students:matched_student_id(full_name)")
          .eq("quiz_id", quizId)
          .order("submitted_at", { ascending: false }),
      ]);
      if (attemptsRes.error) console.error("loadHistory attempts error:", attemptsRes.error);
      if (sharesRes.error) console.error("loadHistory shares error:", sharesRes.error);
      const attempts = attemptsRes.data;
      const shares = sharesRes.data;
      const allRows = [
        ...((attempts ?? []) as any[]).map((a) => ({
          id: `a-${a.id}`,
          source: "login" as const,
          name: (Array.isArray(a.students) ? a.students[0]?.full_name : a.students?.full_name) || "—",
          email: (Array.isArray(a.students) ? a.students[0]?.email : a.students?.email) || null,
          correct: a.correct_count,
          total: a.total_count,
          score: a.score,
          passed: a.passed,
          status_changed: a.status_changed,
          was_absent: a.was_absent,
          submitted_at: a.submitted_at,
          match_reason: "ok",
        })),
        ...((shares ?? []) as any[]).map((s) => ({
          id: `s-${s.id}`,
          source: "share" as const,
          name: (Array.isArray(s.students) ? s.students[0]?.full_name : s.students?.full_name) || null,
          email: s.email,
          correct: s.correct_count,
          total: s.total_count,
          score: s.score,
          passed: s.passed,
          status_changed: s.status_changed,
          was_absent: null,
          submitted_at: s.submitted_at,
          match_reason: s.match_reason,
        })),
      ];

      // Dedupe by normalized email: prefer login (real attempt) over share (audit log).
      // Rows without email (anonymous shares) are kept individually.
      const byEmail = new Map<string, typeof allRows[number]>();
      const anonymousRows: typeof allRows = [];
      for (const r of allRows) {
        const key = r.email ? r.email.trim().toLowerCase() : "";
        if (!key) {
          anonymousRows.push(r);
          continue;
        }
        const existing = byEmail.get(key);
        if (!existing) {
          byEmail.set(key, r);
          continue;
        }
        if (r.source === "login" && existing.source === "share") {
          byEmail.set(key, r);
        } else if (r.source === existing.source) {
          if (new Date(r.submitted_at).getTime() > new Date(existing.submitted_at).getTime()) {
            byEmail.set(key, r);
          }
        }
      }

      const merged = [...byEmail.values(), ...anonymousRows]
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setHistoryRows(merged);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (historyQuiz) {
      loadHistory(historyQuiz.id);
    } else {
      setHistoryRows([]);
    }
  }, [historyQuiz, loadHistory]);

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const targetSession = importTargetSession;
    setImportTargetSession(null);
    if (!file) return;
    if (!selectedClassId) {
      setMessage({ kind: "err", text: "Chọn lớp trước khi import." });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setMessage({ kind: "err", text: "Chỉ hỗ trợ file .xlsx (Excel 2007+). Lưu lại file rồi thử lại." });
      return;
    }
    try {
      let parsed = await parseQuizzesXlsx(file);
      if (parsed.length === 0) {
        setMessage({ kind: "err", text: "Không tìm thấy quiz hợp lệ trong file." });
        return;
      }

      // Per-row import: chỉ update đúng buổi user đã click.
      // Nếu file có quiz cùng session_number → ưu tiên. Nếu không → lấy quiz đầu trong file.
      // Dù sao session_number sẽ bị override về buổi user click.
      if (targetSession != null) {
        const pick = parsed.length === 1
          ? parsed[0]
          : parsed.find((p) => p.session_number === targetSession) ?? parsed[0];
        parsed = [{ ...pick, session_number: targetSession }];
      }

      const invalidItems = parsed.flatMap((q) =>
        q.items
          .filter((it) => it.options.length < 2 || it.correct_indices.length === 0)
          .map((it) => `Buổi ${q.session_number} câu ${it.order}: ${it.options.length < 2 ? "thiếu đáp án" : "thiếu đáp án đúng"}`),
      );
      if (invalidItems.length > 0) {
        setMessage({ kind: "err", text: `File có lỗi:\n${invalidItems.slice(0, 5).join("\n")}` });
        return;
      }
      await importQuizzes(parsed);
    } catch (err: any) {
      setMessage({ kind: "err", text: err.message || "Không đọc được file Excel." });
    }
  };

  const triggerImport = (sessionNumber: number | null) => {
    if (!selectedClassId) return;
    setImportTargetSession(sessionNumber);
    fileInputRef.current?.click();
  };

  const removeQuiz = async (quiz: QuizSummary) => {
    if (!confirm(`Xóa quiz "${quiz.title}" của buổi ${quiz.session_number}? Tất cả lượt làm sẽ bị xóa theo.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/quiz/${quiz.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage({ kind: "err", text: j.error || "Xóa thất bại." });
        return;
      }
      await loadSessionsAndQuizzes(selectedClassId);
      setMessage({ kind: "ok", text: `Đã xóa quiz buổi ${quiz.session_number}.` });
    } finally {
      setBusy(false);
    }
  };

  const startCreateForSession = (sessionNumber: number) => {
    resetDraft(null);
    setSelectedSession(sessionNumber);
    setMessage(null);
    setShowForm(true);
  };

  const updateItem = (idx: number, patch: Partial<DraftItem>) => {
    setDraftItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addOption = (itemIdx: number) => {
    updateItem(itemIdx, {
      options: [...draftItems[itemIdx].options, ""],
      correct: [...draftItems[itemIdx].correct, false],
    });
  };

  const removeOption = (itemIdx: number, optIdx: number) => {
    const it = draftItems[itemIdx];
    if (it.options.length <= 2) return;
    updateItem(itemIdx, {
      options: it.options.filter((_, i) => i !== optIdx),
      correct: it.correct.filter((_, i) => i !== optIdx),
    });
  };

  const submit = async () => {
    if (!selectedClassId || !draftTitle.trim()) {
      setMessage({ kind: "err", text: "Cần chọn lớp và nhập tiêu đề." });
      return;
    }
    const items = draftItems.map((it, idx) => {
      const correctIdx: number[] = [];
      it.correct.forEach((c, i) => { if (c && it.options[i]?.trim()) correctIdx.push(i); });
      return {
        content: it.content.trim(),
        options: it.options.map((o) => o.trim()).filter((o) => o.length > 0),
        correct_indices: correctIdx,
        explanation: it.explanation.trim() || null,
        _idx: idx,
      };
    });

    for (const it of items) {
      if (!it.content) return setMessage({ kind: "err", text: `Câu ${it._idx + 1}: thiếu nội dung` });
      if (it.options.length < 2) return setMessage({ kind: "err", text: `Câu ${it._idx + 1}: cần ≥ 2 đáp án` });
      if (it.correct_indices.length === 0) return setMessage({ kind: "err", text: `Câu ${it._idx + 1}: chọn ít nhất 1 đáp án đúng` });
      const maxIdx = it.options.length - 1;
      if (it.correct_indices.some((c) => c > maxIdx)) return setMessage({ kind: "err", text: `Câu ${it._idx + 1}: đáp án đúng phải nằm trong danh sách đáp án không rỗng` });
    }

    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        class_id: selectedClassId,
        session_number: selectedSession,
        title: draftTitle.trim(),
        description: draftDescription.trim() || null,
        open_at: toIsoOrNull(draftOpenAt),
        close_at: toIsoOrNull(draftCloseAt),
        time_limit_minutes: Math.max(0, Math.floor(draftTimeLimit || 0)),
        pass_threshold: Math.min(1, Math.max(0, draftPassPct / 100)),
        shuffle_questions: draftShuffle,
        items: items.map(({ _idx, ...rest }) => rest),
      };

      // If existing, delete then recreate (simplest update path for items)
      if (editingId) {
        await fetch(`/api/quiz/${editingId}`, { method: "DELETE" });
      }

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: json.error || "Tạo quiz thất bại." });
        return;
      }
      await loadSessionsAndQuizzes(selectedClassId);
      setShowForm(false);
      setEditingId(null);
      setMessage({ kind: "ok", text: editingId ? "Đã cập nhật quiz." : "Đã tạo quiz." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editingId) return;
    if (!confirm("Xóa quiz này? Tất cả lần làm bài sẽ bị xóa theo.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/quiz/${editingId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        setMessage({ kind: "err", text: j.error || "Xóa thất bại" });
        return;
      }
      await loadSessionsAndQuizzes(selectedClassId);
      resetDraft(null);
      setShowForm(false);
      setMessage({ kind: "ok", text: "Đã xóa quiz." });
    } finally {
      setBusy(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const sessionOptions = (() => {
    const setNums = new Set<number>();
    sessions.forEach((s) => setNums.add(s.session_number));
    const total = selectedClass?.total_sessions ?? 0;
    for (let i = 1; i <= total; i++) setNums.add(i);
    return Array.from(setNums).sort((a, b) => a - b);
  })();

  return (
    <>
      <div>
        <div style={card}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label style={{ ...field, flex: "1 1 320px" }}>
              <span style={fieldLabel}>Lớp</span>
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={input}>
                <option value="">— Chọn lớp —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_code} · {c.course?.name || c.class_name}
                  </option>
                ))}
              </select>
            </label>
            {selectedClassId && !showForm && (
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={onFileChosen}
                style={{ display: "none" }}
              />
            )}
          </div>
        </div>

        {message && !showForm && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: message.kind === "ok" ? "#ecfdf5" : "#fef2f2", color: message.kind === "ok" ? "#065f46" : "#991b1b", fontWeight: 700, whiteSpace: "pre-line" }}>
            {message.text}
          </div>
        )}

        {selectedClassId && !showForm && (() => {
          const sessionNums = new Set<number>();
          sessions.forEach((s) => sessionNums.add(s.session_number));
          const total = selectedClass?.total_sessions ?? 0;
          for (let i = 1; i <= total; i++) sessionNums.add(i);
          quizzes.forEach((q) => sessionNums.add(q.session_number));
          const sessionList = Array.from(sessionNums).sort((a, b) => a - b);
          const quizBySession = new Map<number, QuizSummary>();
          quizzes.forEach((q) => quizBySession.set(q.session_number, q));
          const titleBySession = new Map<number, string>();
          sessions.forEach((s) => titleBySession.set(s.session_number, s.session_title ?? ""));

          return (
            <div style={{ ...card, marginTop: 16 }}>
              <h2 style={{ margin: "0 0 14px", fontSize: 18, color: "#0f172a" }}>
                Buổi học {selectedClass ? `· ${selectedClass.class_code}` : ""}
              </h2>
              {sessionList.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 12 }}>
                  Lớp này chưa có thông tin buổi học. Cập nhật <b>Tổng số buổi</b> hoặc thêm buổi trong mục Lớp học.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ ...th, width: 50, textAlign: "center" }}>STT</th>
                        <th style={th}>Buổi</th>
                        <th style={th}>Tên buổi</th>
                        <th style={th}>Quiz</th>
                        <th style={th}>Câu hỏi</th>
                        <th style={th}>Đã làm</th>
                        <th style={th}>Trạng thái</th>
                        <th style={{ ...th, textAlign: "right" }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionList.map((n, idx) => {
                        const q = quizBySession.get(n);
                        const sessionTitle = titleBySession.get(n) ?? "";
                        if (!q) {
                          return (
                            <tr key={`s-${n}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ ...td, textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                              <td style={td}><b>Buổi {n}</b></td>
                              <td style={{ ...td, color: "#64748b" }}>{sessionTitle || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                              <td style={{ ...td, color: "#94a3b8", fontStyle: "italic" }}>Chưa có quiz</td>
                              <td style={td}>—</td>
                              <td style={td}>—</td>
                              <td style={td}>—</td>
                              <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                                <button onClick={() => startCreateForSession(n)} style={{ ...btnPrimary, padding: "6px 12px", fontSize: 13, marginRight: 6 }}>+ Tạo</button>
                                <button onClick={() => handleExportTemplateForSession(n)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, marginRight: 6 }} title="Tải file mẫu cho buổi này">📥 Xuất</button>
                                <button onClick={() => triggerImport(n)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13 }} disabled={importing} title="Nhập Excel cho buổi này">📤 Nhập</button>
                              </td>
                            </tr>
                          );
                        }
                        const itemCount = (q.quiz_items ?? []).length;
                        const attemptCount = attemptsByQuiz[q.id] ?? 0;
                        const now = Date.now();
                        const notOpen = q.open_at && new Date(q.open_at).getTime() > now;
                        const closed = q.close_at && new Date(q.close_at).getTime() < now;
                        const statusLabel = !q.is_active ? "Tạm dừng" : notOpen ? "Chưa mở" : closed ? "Đã đóng" : "Đang mở";
                        const statusBg = !q.is_active ? "#f1f5f9" : notOpen ? "#e0e7ff" : closed ? "#fef3c7" : "#dcfce7";
                        const statusColor = !q.is_active ? "#475569" : notOpen ? "#3730a3" : closed ? "#92400e" : "#065f46";
                        return (
                          <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ ...td, textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                            <td style={td}><b>Buổi {n}</b></td>
                            <td style={{ ...td, color: "#0f172a", fontWeight: 600 }}>
                              {q.title}
                              {sessionTitle && <div style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>{sessionTitle}</div>}
                            </td>
                            <td style={td}><span style={{ ...chip, background: "#ecfdf5", color: "#065f46" }}>Có ({Math.round(Number(q.pass_threshold) * 100)}%)</span></td>
                            <td style={td}>{itemCount}</td>
                            <td style={td}>{attemptCount}</td>
                            <td style={td}>
                              <span style={{ ...chip, background: statusBg, color: statusColor }}>{statusLabel}</span>
                            </td>
                            <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                              <button onClick={() => setHistoryQuiz(q)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, marginRight: 6 }} title="Xem lịch sử lượt làm quiz">📊 Lịch sử</button>
                              <button onClick={() => { setShareQuiz(q); setCopied(false); }} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, marginRight: 6 }}>🔗 Share</button>
                              <button onClick={() => handleExportQuiz(q)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, marginRight: 6 }} title="Xuất Excel chỉ buổi này">📥 Xuất</button>
                              <button onClick={() => triggerImport(n)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, marginRight: 6 }} disabled={importing} title="Nhập Excel để ghi đè buổi này">📤 Nhập</button>
                              <button onClick={() => openEditForm(q)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 13, marginRight: 6 }}>Sửa</button>
                              <button onClick={() => removeQuiz(q)} style={{ ...btnDanger, padding: "6px 12px", fontSize: 13 }} disabled={busy}>Xóa</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {selectedClassId && showForm && (
          <div style={{ ...card, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button onClick={closeForm} style={btnGhost}>← Quay lại danh sách</button>
              {editingId && (
                <span style={{ ...chip, background: "#ecfdf5", color: "#065f46" }}>Đang sửa</span>
              )}
            </div>
            <h2 style={{ margin: "0 0 14px", fontSize: 18, color: "#0f172a" }}>
              {editingId ? "Sửa quiz" : "Tạo quiz mới"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label style={field}>
                <span style={fieldLabel}>Buổi học</span>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                  style={input}
                  disabled={Boolean(editingId)}
                >
                  {sessionOptions.length === 0 ? (
                    <option value={1}>Buổi 1</option>
                  ) : (
                    sessionOptions.map((n) => {
                      const taken = quizzes.some((q) => q.session_number === n && q.id !== editingId);
                      return (
                        <option key={n} value={n} disabled={taken && !editingId}>
                          Buổi {n}{taken ? " (đã có quiz)" : ""}
                        </option>
                      );
                    })
                  )}
                </select>
              </label>
              <label style={field}>
                <span style={fieldLabel}>Tiêu đề</span>
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} style={input} placeholder="VD: Quiz ôn buổi 3 - Vòng lặp" />
              </label>
              <label style={field}>
                <span style={fieldLabel}>Mô tả (tùy chọn)</span>
                <input value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} style={input} placeholder="Hướng dẫn cho học viên" />
              </label>
              <label style={field}>
                <span style={fieldLabel}>Mở từ</span>
                <input type="datetime-local" value={draftOpenAt} onChange={(e) => setDraftOpenAt(e.target.value)} style={input} />
              </label>
              <label style={field}>
                <span style={fieldLabel}>Đóng lúc</span>
                <input type="datetime-local" value={draftCloseAt} onChange={(e) => setDraftCloseAt(e.target.value)} style={input} />
              </label>
              <label style={field}>
                <span style={fieldLabel}>Thời gian (phút, 0 = không giới hạn)</span>
                <input type="number" min={0} value={draftTimeLimit} onChange={(e) => setDraftTimeLimit(Number(e.target.value))} style={input} />
              </label>
              <label style={field}>
                <span style={fieldLabel}>Đạt khi đúng ≥ (%)</span>
                <input type="number" min={0} max={100} value={draftPassPct} onChange={(e) => setDraftPassPct(Number(e.target.value))} style={input} />
              </label>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={draftShuffle} onChange={(e) => setDraftShuffle(e.target.checked)} style={checkboxStyle} />
                <span style={{ fontWeight: 600, color: "#0f172a" }}>Đảo thứ tự câu hỏi cho mỗi học viên</span>
              </div>
            </div>

            <h3 style={{ margin: "22px 0 10px", fontSize: 16, color: "#0f172a" }}>Câu hỏi ({draftItems.length})</h3>

            {draftItems.map((it, idx) => (
              <div key={idx} style={itemBlock}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong style={{ color: "#0f172a" }}>Câu {idx + 1}</strong>
                  {draftItems.length > 1 && (
                    <button onClick={() => setDraftItems((prev) => prev.filter((_, i) => i !== idx))} style={btnDanger}>Xóa câu</button>
                  )}
                </div>
                <textarea
                  value={it.content}
                  onChange={(e) => updateItem(idx, { content: e.target.value })}
                  placeholder="Nội dung câu hỏi"
                  style={{ ...input, minHeight: 60, fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {it.options.map((opt, oi) => (
                    <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={it.correct[oi]}
                        onChange={(e) => {
                          const next = [...it.correct];
                          next[oi] = e.target.checked;
                          updateItem(idx, { correct: next });
                        }}
                        title="Đáp án đúng"
                        style={checkboxStyle}
                      />
                      <span style={{ width: 22, flexShrink: 0, color: "#64748b", fontWeight: 700 }}>{String.fromCharCode(65 + oi)}.</span>
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...it.options];
                          next[oi] = e.target.value;
                          updateItem(idx, { options: next });
                        }}
                        placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                        style={{ ...input, flex: 1, minWidth: 0 }}
                      />
                      {it.options.length > 2 && (
                        <button onClick={() => removeOption(idx, oi)} style={{ ...btnGhost, color: "#ef4444", flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addOption(idx)} style={{ ...btnSecondary, alignSelf: "flex-start", marginTop: 4 }}>
                    + Thêm đáp án
                  </button>
                </div>
                <input
                  value={it.explanation}
                  onChange={(e) => updateItem(idx, { explanation: e.target.value })}
                  placeholder="Giải thích (hiện cho học viên sau khi nộp, tùy chọn)"
                  style={{ ...input, marginTop: 10 }}
                />
              </div>
            ))}

            <button onClick={() => setDraftItems((prev) => [...prev, emptyItem()])} style={{ ...btnSecondary, marginTop: 10 }}>
              + Thêm câu hỏi
            </button>

            {message && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: message.kind === "ok" ? "#ecfdf5" : "#fef2f2", color: message.kind === "ok" ? "#065f46" : "#991b1b", fontWeight: 700 }}>
                {message.text}
              </div>
            )}

            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                {editingId && (
                  <button onClick={remove} disabled={busy} style={btnDanger}>Xóa quiz</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => resetDraft(existingQuiz)} style={btnSecondary} disabled={busy}>Reset</button>
                <button onClick={submit} disabled={busy} style={btnPrimary}>{busy ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo quiz"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {historyQuiz && (
        <div
          onClick={() => setHistoryQuiz(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 920, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Lịch sử làm quiz</h2>
              <button onClick={() => setHistoryQuiz(null)} style={btnGhost}>×</button>
            </div>
            <p style={{ color: "#475569", marginTop: 8, fontSize: 13 }}>
              <b>{historyQuiz.title}</b> · Buổi {historyQuiz.session_number}
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 14, flexWrap: "wrap" }}>
              {(() => {
                const total = historyRows.length;
                const login = historyRows.filter((r) => r.source === "login").length;
                const share = historyRows.filter((r) => r.source === "share").length;
                const passed = historyRows.filter((r) => r.passed).length;
                const converted = historyRows.filter((r) => r.status_changed).length;
                return [
                  { label: "Tổng", value: total, bg: "#f1f5f9", color: "#0f172a" },
                  { label: "Đăng nhập", value: login, bg: "#ecfdf5", color: "#065f46" },
                  { label: "Qua share", value: share, bg: "#eff6ff", color: "#1e3a8a" },
                  { label: "Đã đạt", value: passed, bg: "#dcfce7", color: "#065f46" },
                  { label: "Chuyển có phép", value: converted, bg: "#fef3c7", color: "#92400e" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "8px 14px", borderRadius: 10, background: s.bg, color: s.color, fontWeight: 700, fontSize: 13 }}>
                    <span style={{ opacity: 0.7, fontSize: 11, marginRight: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.label}</span>
                    {s.value}
                  </div>
                ));
              })()}
              <button onClick={() => loadHistory(historyQuiz.id)} style={{ ...btnGhost, fontSize: 13, marginLeft: "auto" }} disabled={historyLoading}>
                {historyLoading ? "Đang tải..." : "↻ Refresh"}
              </button>
            </div>

            {historyRows.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                {historyLoading ? "Đang tải..." : "Chưa có ai làm quiz này."}
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ ...th, width: 50, textAlign: "center" }}>STT</th>
                      <th style={th}>Thời gian</th>
                      <th style={th}>Nguồn</th>
                      <th style={th}>Học viên</th>
                      <th style={th}>Email</th>
                      <th style={th}>Điểm</th>
                      <th style={th}>Đạt?</th>
                      <th style={th}>Ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((r, idx) => {
                      const sourceBadge = r.source === "login"
                        ? { label: "🔐 Đăng nhập", bg: "#ecfdf5", color: "#065f46" }
                        : { label: "🔗 Share link", bg: "#eff6ff", color: "#1e3a8a" };
                      const statusBadge = (() => {
                        if (r.status_changed) return { label: "✓ Đã chuyển có phép", bg: "#dcfce7", color: "#065f46" };
                        if (r.source === "share") {
                          if (r.match_reason === "already_submitted") return { label: "Đã làm trước", bg: "#fef3c7", color: "#92400e" };
                          if (r.match_reason === "not_in_class") return { label: "Không thuộc lớp", bg: "#fee2e2", color: "#991b1b" };
                          if (r.match_reason === "email_not_found") return { label: "Email không khớp", bg: "#f1f5f9", color: "#475569" };
                          if (r.match_reason === "no_email") return { label: "Ẩn danh", bg: "#f1f5f9", color: "#475569" };
                        }
                        if (r.passed) return { label: "Đạt — không cần đổi", bg: "#ecfdf5", color: "#065f46" };
                        return { label: "Chưa đạt", bg: "#fee2e2", color: "#991b1b" };
                      })();
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ ...td, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                          <td style={{ ...td, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                            {new Date(r.submitted_at).toLocaleString("vi-VN")}
                          </td>
                          <td style={td}>
                            <span style={{ ...chip, background: sourceBadge.bg, color: sourceBadge.color, fontSize: 11 }}>{sourceBadge.label}</span>
                          </td>
                          <td style={{ ...td, fontSize: 13 }}>{r.name || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={{ ...td, fontSize: 12, color: "#64748b" }}>{r.email || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                          <td style={{ ...td, fontSize: 13, whiteSpace: "nowrap" }}>
                            {r.correct}/{r.total} ({Math.round(Number(r.score) * 100)}%)
                          </td>
                          <td style={td}>
                            {r.passed ? <span style={{ color: "#10b981", fontWeight: 800 }}>✓</span> : <span style={{ color: "#94a3b8" }}>—</span>}
                          </td>
                          <td style={td}>
                            <span style={{ ...chip, background: statusBadge.bg, color: statusBadge.color, fontSize: 11 }}>{statusBadge.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {shareQuiz && (() => {
        const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/quiz/share/${shareQuiz.id}`;
        const copy = async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        };
        return (
          <div
            onClick={() => setShareQuiz(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 760, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Chia sẻ quiz</h2>
                <button onClick={() => setShareQuiz(null)} style={btnGhost}>×</button>
              </div>
              <p style={{ color: "#475569", marginTop: 8, fontSize: 13 }}>
                <b>{shareQuiz.title}</b> · Buổi {shareQuiz.session_number}
              </p>
              <p style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                Ai có link cũng làm được. Khi nộp, học viên DUA Edu nhập email trùng với hồ sơ lớp này + đang vắng buổi {shareQuiz.session_number} sẽ được tự động chuyển <b>Có phép</b>.
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  style={{ ...input, flex: 1, minWidth: 0, fontFamily: "monospace", fontSize: 13 }}
                />
                <button onClick={copy} style={btnPrimary}>{copied ? "✓ Đã copy" : "Copy"}</button>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Mở thử</a>
              </div>

              <div style={{ marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>Lượt nộp qua link share ({shareSubmissions.length})</h3>
                  <button onClick={() => loadShareSubmissions(shareQuiz.id)} style={{ ...btnGhost, fontSize: 13 }} disabled={shareSubLoading}>
                    {shareSubLoading ? "Đang tải..." : "↻ Refresh"}
                  </button>
                </div>
                {shareSubmissions.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                    {shareSubLoading ? "Đang tải..." : "Chưa có lượt nộp nào có nhập email."}
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ ...th, width: 50, textAlign: "center" }}>STT</th>
                          <th style={th}>Thời gian</th>
                          <th style={th}>Email</th>
                          <th style={th}>Học viên</th>
                          <th style={th}>Điểm</th>
                          <th style={th}>Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shareSubmissions.map((s, idx) => {
                          const studentName = Array.isArray(s.students) ? s.students[0]?.full_name : s.students?.full_name;
                          const reasonBadge = (() => {
                            if (s.match_reason === "ok" && s.status_changed) return { label: "✓ Đã chuyển có phép", bg: "#dcfce7", color: "#065f46" };
                            if (s.match_reason === "ok") return { label: "Đã ghi nhận", bg: "#ecfdf5", color: "#065f46" };
                            if (s.match_reason === "already_submitted") return { label: "Đã làm trước", bg: "#fef3c7", color: "#92400e" };
                            if (s.match_reason === "not_in_class") return { label: "Không thuộc lớp", bg: "#fee2e2", color: "#991b1b" };
                            if (s.match_reason === "email_not_found") return { label: "Email không khớp", bg: "#f1f5f9", color: "#475569" };
                            if (s.match_reason === "no_email") return { label: "Ẩn danh", bg: "#f1f5f9", color: "#475569" };
                            return { label: s.match_reason, bg: "#f1f5f9", color: "#475569" };
                          })();
                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ ...td, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                              <td style={{ ...td, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                                {new Date(s.submitted_at).toLocaleString("vi-VN")}
                              </td>
                              <td style={{ ...td, fontSize: 13 }}>{s.email}</td>
                              <td style={{ ...td, fontSize: 13 }}>{studentName || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                              <td style={{ ...td, fontSize: 13, whiteSpace: "nowrap" }}>
                                {s.correct_count}/{s.total_count} ({Math.round(Number(s.score) * 100)}%)
                                {s.passed && <span style={{ color: "#10b981", marginLeft: 6 }}>✓</span>}
                              </td>
                              <td style={{ ...td }}>
                                <span style={{ ...chip, background: reasonBadge.bg, color: reasonBadge.color, fontSize: 11 }}>{reasonBadge.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 18, padding: 22, boxShadow: "0 12px 30px rgba(15,23,42,0.05)" };
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: "#475569", letterSpacing: 0.3, textTransform: "uppercase" };
const input: React.CSSProperties = { padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", background: "white" };
const itemBlock: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, marginBottom: 12, background: "#fdfdfd" };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", background: "#10b981", color: "white", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { padding: "10px 16px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 700, cursor: "pointer" };
const btnGhost: React.CSSProperties = { border: "none", background: "transparent", color: "#0f766e", fontWeight: 700, cursor: "pointer", padding: "4px 8px" };
const btnDanger: React.CSSProperties = { padding: "8px 14px", background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 };
const chip: React.CSSProperties = { padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 };
const checkboxStyle: React.CSSProperties = { width: 18, height: 18, flexShrink: 0, margin: 0, accentColor: "#10b981", cursor: "pointer" };
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 800, letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: "10px 14px", color: "#1e293b", verticalAlign: "middle" };
