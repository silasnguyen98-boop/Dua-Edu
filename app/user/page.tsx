"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Premium SVG Icons
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  ),
  Courses: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
  ),
  Certificate: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-2 5L9 9l11 4-5 2zm0 0l4 8 3-1" /></svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  ),
  Trending: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  Quiz: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 5-5" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
  )
};

const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <svg width="46" height="34" viewBox="0 0 46 34" fill="none" aria-hidden focusable="false">
        <defs>
          <linearGradient id="rank-crown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <path d="M4 24 L9 10 L16 18 L23 5 L30 18 L37 10 L42 24 Z" fill="url(#rank-crown)" stroke="#92400e" strokeWidth="1" strokeLinejoin="round" />
        <rect x="6" y="23" width="34" height="7" rx="2" fill="url(#rank-crown)" stroke="#92400e" strokeWidth="1" />
        <circle cx="9" cy="10" r="2.4" fill="#fef3c7" stroke="#a16207" strokeWidth="0.5" />
        <circle cx="23" cy="5" r="2.8" fill="#fecaca" stroke="#b91c1c" strokeWidth="0.5" />
        <circle cx="37" cy="10" r="2.4" fill="#fef3c7" stroke="#a16207" strokeWidth="0.5" />
      </svg>
    );
  }
  const cfg = rank === 2
    ? { gradId: "rank-silver", stops: ["#f8fafc", "#cbd5e1", "#64748b"], text: "#334155" }
    : { gradId: "rank-bronze", stops: ["#fed7aa", "#fb923c", "#9a3412"], text: "#7c2d12" };
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" fill="none" aria-hidden focusable="false">
      <defs>
        <linearGradient id={cfg.gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cfg.stops[0]} />
          <stop offset="55%" stopColor={cfg.stops[1]} />
          <stop offset="100%" stopColor={cfg.stops[2]} />
        </linearGradient>
      </defs>
      <path d="M10 2 L14 2 L17 16 L13 16 Z" fill="#2563eb" />
      <path d="M24 2 L20 2 L17 16 L21 16 Z" fill="#dc2626" />
      <circle cx="17" cy="25" r="12" fill={`url(#${cfg.gradId})`} stroke="white" strokeWidth="2" />
      <circle cx="17" cy="25" r="8.5" fill="none" stroke={cfg.text} strokeWidth="0.6" opacity="0.35" />
      <text x="17" y="30" textAnchor="middle" fontSize="14" fontWeight="900" fill={cfg.text}>{rank}</text>
    </svg>
  );
}

function LeaderboardInline({ data, currentStudentId, currentStudentName }: { data: any; currentStudentId?: string; currentStudentName?: string }) {
  const { topStudents = [], isFinished, updatedAt } = data;
  if (topStudents.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Chưa có học viên trong bảng xếp hạng.</p>;
  }
  const normalize = (s: string) => s?.trim().toLocaleLowerCase("vi-VN") || "";
  const myNameNormalized = normalize(currentStudentName || "");
  const isMatchUser = (s: any) => {
    if (currentStudentId && s.id === currentStudentId) return true;
    if (myNameNormalized && normalize(s.name) === myNameNormalized) return true;
    return false;
  };
  const myIndex = topStudents.findIndex(isMatchUser);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myEntry = myIndex >= 0 ? topStudents[myIndex] : null;
  const top3 = topStudents.slice(0, 3);
  const rest = topStudents.slice(3);

  const rankStyles: Record<number, { bg: string; pedestal: string; pillBg: string; pillText: string; height: number }> = {
    1: { bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", pedestal: "linear-gradient(180deg, #fde68a, #fbbf24)", pillBg: "#fef3c7", pillText: "#92400e", height: 86 },
    2: { bg: "linear-gradient(135deg, #cbd5e1, #94a3b8)", pedestal: "linear-gradient(180deg, #e2e8f0, #cbd5e1)", pillBg: "#f1f5f9", pillText: "#475569", height: 60 },
    3: { bg: "linear-gradient(135deg, #fdba74, #f97316)", pedestal: "linear-gradient(180deg, #fed7aa, #fb923c)", pillBg: "#ffedd5", pillText: "#9a3412", height: 40 },
  };

  const slot = (s: any, rank: number) => {
    const isMe = isMatchUser(s);
    const r = rankStyles[rank];
    const avatarSize = rank === 1 ? 84 : 68;
    return (
      <div style={{ flex: 1, maxWidth: 180, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", minHeight: 40 }}><RankIcon rank={rank} /></div>
        <div style={{ position: "relative" }}>
          <div style={{
            width: avatarSize, height: avatarSize, borderRadius: "50%",
            background: r.bg,
            display: "grid", placeItems: "center",
            color: "white", fontWeight: 900, fontSize: rank === 1 ? 32 : 26,
            boxShadow: isMe ? "0 0 0 4px rgba(16, 185, 129, 0.35), 0 10px 24px rgba(0,0,0,0.12)" : "0 10px 24px rgba(0,0,0,0.10)",
            border: "3px solid white",
            boxSizing: "border-box"
          }}>
            {s.name?.charAt(0)?.toUpperCase()}
          </div>
          {isMe && (
            <div style={{ position: "absolute", top: -8, right: -8, background: "#10b981", color: "white", padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, boxShadow: "0 4px 10px rgba(16,185,129,0.3)" }}>BẠN</div>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", textAlign: "center", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
        <div style={{ fontWeight: 900, fontSize: rank === 1 ? 26 : 20, color: r.pillText }}>{s.final}</div>
        <div style={{ width: "100%", height: r.height, background: r.pedestal, borderRadius: "10px 10px 0 0", display: "grid", placeItems: "center", color: r.pillText, fontWeight: 900, fontSize: rank === 1 ? 28 : 22, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.06)" }}>
          {rank}
        </div>
      </div>
    );
  };

  const myBanner = myRank ? (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", border: "1px solid #6ee7b7", borderRadius: 14, marginBottom: 18 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#10b981", color: "white", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18 }}>#{myRank}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#065f46", letterSpacing: 0.4, textTransform: "uppercase" }}>Vị trí của bạn</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#065f46" }}>{myEntry?.name} · {myEntry?.final} điểm</div>
      </div>
    </div>
  ) : (
    <div style={{ padding: "12px 18px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, marginBottom: 18, fontSize: 13, color: "#9a3412" }}>
      Bạn chưa lọt vào top 10 của lớp này. Cố lên nhé!
    </div>
  );

  return (
    <>
      {myBanner}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, margin: "8px 0 28px", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
        {[1, 0, 2].map((idx) => {
          const s = top3[idx];
          if (!s) return <div key={idx} style={{ flex: 1, maxWidth: 180, visibility: "hidden" }} />;
          return <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>{slot(s, idx + 1)}</div>;
        })}
      </div>

      {rest.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#f8fafc", borderRadius: 12, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "white" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 800, letterSpacing: 0.5, borderBottom: "1px solid #e2e8f0" }}>Hạng</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 800, letterSpacing: 0.5, borderBottom: "1px solid #e2e8f0" }}>Học viên</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 800, letterSpacing: 0.5, borderBottom: "1px solid #e2e8f0" }}>
                {isFinished ? "Tổng điểm" : "Tích lũy"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rest.map((s: any, i: number) => {
              const isMe = isMatchUser(s);
              const rowBg = isMe ? "#ecfdf5" : "transparent";
              const rowColor = isMe ? "#065f46" : "#1e293b";
              return (
                <tr key={s.id || i} style={{ background: rowBg }}>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #eef2f7" }}>
                    <span style={{ display: "inline-block", minWidth: 28, fontWeight: 800, color: isMe ? "#10b981" : "#94a3b8" }}>{i + 4}</span>
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #eef2f7", color: rowColor, fontWeight: isMe ? 800 : 400 }}>
                    {s.name}{isMe && <span style={{ marginLeft: 8, fontSize: 11, background: "#10b981", color: "white", padding: "2px 8px", borderRadius: 999, fontWeight: 800 }}>Bạn</span>}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #eef2f7", textAlign: "right", fontWeight: 800, color: rowColor }}>{s.final}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {updatedAt && <p style={{ margin: "14px 0 0", textAlign: "right", fontSize: 12, color: "#94a3b8" }}>Cập nhật: {updatedAt}</p>}
    </>
  );
}

function CourseCoverArt() {
  return (
    <svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <defs>
        <linearGradient id="dua-cover-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <linearGradient id="dua-cover-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#dua-cover-bg)" />
      <circle cx="70" cy="60" r="40" fill="#ffffff" opacity="0.45" />
      <circle cx="540" cy="290" r="56" fill="#ffffff" opacity="0.35" />
      <circle cx="500" cy="60" r="14" fill="#10b981" opacity="0.18" />
      <circle cx="120" cy="290" r="10" fill="#059669" opacity="0.22" />

      <rect x="110" y="70" width="380" height="210" rx="18" fill="#ffffff" />
      <rect x="130" y="92" width="120" height="10" rx="4" fill="#cbd5e1" />
      <rect x="130" y="110" width="80" height="6" rx="3" fill="#e2e8f0" />

      <rect x="138" y="200" width="34" height="62" rx="6" fill="url(#dua-cover-bar)" />
      <rect x="186" y="172" width="34" height="90" rx="6" fill="url(#dua-cover-bar)" opacity="0.9" />
      <rect x="234" y="148" width="34" height="114" rx="6" fill="url(#dua-cover-bar)" />
      <rect x="282" y="186" width="34" height="76" rx="6" fill="url(#dua-cover-bar)" opacity="0.9" />
      <rect x="330" y="132" width="34" height="130" rx="6" fill="url(#dua-cover-bar)" />
      <rect x="378" y="166" width="34" height="96" rx="6" fill="url(#dua-cover-bar)" opacity="0.9" />
      <rect x="426" y="156" width="34" height="106" rx="6" fill="url(#dua-cover-bar)" />

      <polyline points="155,208 203,178 251,154 299,192 347,138 395,172 443,162" stroke="#065f46" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#065f46">
        <circle cx="155" cy="208" r="4" />
        <circle cx="203" cy="178" r="4" />
        <circle cx="251" cy="154" r="4" />
        <circle cx="299" cy="192" r="4" />
        <circle cx="347" cy="138" r="4" />
        <circle cx="395" cy="172" r="4" />
        <circle cx="443" cy="162" r="4" />
      </g>
    </svg>
  );
}

const getSingle = <T,>(value?: T | T[] | null) => (Array.isArray(value) ? value[0] : value) ?? null;

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

const toNumber = (value?: number | null) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function getCourseProgress(e: any): { percent: number; label: string } {
  if (e?.status === "completed") return { percent: 100, label: "100%" };
  const final = e?.final_score;
  if (final == null) return { percent: 0, label: "Chưa có điểm" };
  const pct = Math.max(0, Math.min(100, toNumber(final) * 10));
  return { percent: pct, label: `${pct.toFixed(1).replace(/\.0$/, "")}%` };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [activeNav, setActiveNav] = useState("courses");
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any | null>(null);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<Record<string, any>>({});
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, any>>({});

  const pendingQuizCount = (() => {
    const now = Date.now();
    return quizzes.filter((q) => {
      if (quizAttempts[q.id]) return false;
      if (q.open_at && new Date(q.open_at).getTime() > now) return false;
      if (q.close_at && new Date(q.close_at).getTime() < now) return false;
      return true;
    }).length;
  })();

  const loadLeaderboard = useCallback(async (classCode: string) => {
    if (leaderboardData[classCode]) return;
    setLeaderboardData(prev => ({ ...prev, [classCode]: { loading: true } }));
    try {
      const res = await fetch(`/api/leaderboard/${encodeURIComponent(classCode)}`);
      const json = await res.json();
      setLeaderboardData(prev => ({ ...prev, [classCode]: res.ok ? json : { error: json.error || "Không tải được dữ liệu." } }));
    } catch {
      setLeaderboardData(prev => ({ ...prev, [classCode]: { error: "Không thể kết nối đến máy chủ." } }));
    }
  }, [leaderboardData]);

  useEffect(() => {
    if (activeNav === "leaderboard" && !activeLeaderboardTab && enrollments.length > 0) {
      const firstCode = getSingle(enrollments[0].classes)?.class_code;
      if (firstCode) {
        setActiveLeaderboardTab(firstCode);
        loadLeaderboard(firstCode);
      }
    }
  }, [activeNav, activeLeaderboardTab, enrollments, loadLeaderboard]);

  const loadStudentData = useCallback(async (authUser: User) => {
    try {
      const metadataStudentId = String(authUser.user_metadata?.student_id || "");
      const { data: student } = metadataStudentId
        ? await supabase.from("students").select("*").eq("id", metadataStudentId).maybeSingle()
        : await supabase.from("students").select("*").eq("email", authUser.email || "").maybeSingle();

      if (!student) return;
      setStudentInfo(student);

      const [enrollmentRes, certRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select(`
            id, status, attendance_score, assignment_score, project_score, final_score, note, created_at,
            classes (
              id, class_name, class_code, start_date, total_sessions, schedule, study_time,
              meeting_url, recording_url, slide_url, reference_url, assignment_url,
              courses ( id, name, course_code, course_type ),
              teachers ( id, full_name )
            )
          `)
          .eq("student_id", student.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("certificates")
          .select("*, enrollments!inner(student_id, classes(class_code, courses(name)))")
          .eq("enrollments.student_id", student.id),
      ]);

      const nextEnrollments = ((enrollmentRes.data as any[] | null) ?? []).filter((item) => item.classes);
      setEnrollments(nextEnrollments);
      setCertificates(certRes.data ?? []);

      const classIds = nextEnrollments
        .map((e) => getSingle(e.classes)?.id)
        .filter((id): id is string => Boolean(id));
      if (classIds.length > 0) {
        const [{ data: qData }, { data: aData }] = await Promise.all([
          supabase
            .from("quizzes")
            .select("id, class_id, session_number, title, description, open_at, close_at, time_limit_minutes, pass_threshold, is_active")
            .in("class_id", classIds)
            .eq("is_active", true),
          supabase
            .from("quiz_attempts")
            .select("id, quiz_id, score, passed, correct_count, total_count, status_changed, submitted_at")
            .eq("student_id", student.id),
        ]);
        setQuizzes(qData ?? []);
        const map: Record<string, any> = {};
        (aData ?? []).forEach((a: any) => { map[a.quiz_id] = a; });
        setQuizAttempts(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    if (sessionsLoaded || enrollments.length === 0) return;
    setSessionsLoaded(true);
    const classIds = enrollments
      .map((e) => getSingle(e.classes)?.id)
      .filter((id): id is string => Boolean(id));
    if (classIds.length === 0) return;
    const { data } = await supabase
      .from("class_sessions")
      .select("class_id, session_number, session_title, session_date, start_time, end_time")
      .in("class_id", classIds);
    const byClass: Record<string, any[]> = {};
    (data ?? []).forEach((s: any) => {
      const cid = String(s.class_id);
      if (!byClass[cid]) byClass[cid] = [];
      byClass[cid].push(s);
    });
    setEnrollments((prev) => prev.map((e) => {
      const ci = getSingle(e.classes);
      if (!ci) return e;
      const sessions = byClass[String(ci.id)] || [];
      const newClass = { ...ci, class_sessions: sessions };
      return { ...e, classes: Array.isArray(e.classes) ? [newClass] : newClass };
    }));
  }, [enrollments, sessionsLoaded]);

  useEffect(() => {
    if (activeNav === "schedule" && !sessionsLoaded && enrollments.length > 0) {
      loadSessions();
    }
  }, [activeNav, sessionsLoaded, enrollments, loadSessions]);

  useEffect(() => {
    let active = true;
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        router.push("/login");
        return;
      }
      setAuthReady(true);
      await loadStudentData(session.user);
    };
    checkUser();
    return () => { active = false; };
  }, [loadStudentData, router]);

  if (!authReady) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#10b981", letterSpacing: -2, animation: "dua-pulse 1.5s infinite" }}>DUA</div>
        <style dangerouslySetInnerHTML={{ __html: "@keyframes dua-pulse{0%,100%{opacity:.5;transform:scale(.95)}50%{opacity:1;transform:scale(1.05)}}" }} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Background Decor */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <img src={logoUrl} alt="DUA" />
        </div>
        <nav className="menu">
          <button className={activeNav === "courses" ? "active" : ""} onClick={() => setActiveNav("courses")}>
            <Icons.Courses /> <span>Khóa học của tôi</span>
          </button>
          <button className={activeNav === "schedule" ? "active" : ""} onClick={() => setActiveNav("schedule")}>
            <Icons.Clock /> <span>Lịch học</span>
          </button>
          <button className={activeNav === "resources" ? "active" : ""} onClick={() => setActiveNav("resources")}>
            <Icons.Dashboard /> <span>Tài nguyên lớp</span>
          </button>
          <button className={activeNav === "leaderboard" ? "active" : ""} onClick={() => setActiveNav("leaderboard")}>
            <Icons.Trending /> <span>Bảng xếp hạng</span>
          </button>
          <button className={activeNav === "quiz" ? "active" : ""} onClick={() => setActiveNav("quiz")}>
            <Icons.Quiz /> <span>Quiz</span>
            {pendingQuizCount > 0 && <span className="nav-badge">{pendingQuizCount}</span>}
          </button>
          <button className={activeNav === "certs" ? "active" : ""} onClick={() => setActiveNav("certs")}>
            <Icons.Certificate /> <span>Chứng nhận của tôi</span>
          </button>
        </nav>
        <button className="logout" onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}>
          <Icons.Logout /> <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main">
        <header className="header">
          <div className="greeting">
            <h1>Chào {studentInfo?.full_name?.split(" ").pop() || "bạn"}! 👋</h1>
            <p>Hôm nay bạn đã sẵn sàng cho những kiến thức mới chưa?</p>
          </div>
        </header>

        <div className="scroll-content">
          {loading ? (
            <div className="skeleton-stack" aria-busy="true" aria-live="polite">
              <div className="skel-line title" />
              <div className="skel-grid">
                <div className="skel-card" />
                <div className="skel-card" />
                <div className="skel-card" />
              </div>
            </div>
          ) : (<>
          {activeNav === "certs" && (
            <div className="certs-page">
              <div className="certs-header">
                <h2>CHỨNG NHẬN CỦA TÔI ({certificates.length})</h2>
              </div>
              <div className="certs-grid">
                {certificates.length > 0 ? certificates.map(cert => {
                  const enrollment = getSingle(cert.enrollments);
                  const classInfo = getSingle(enrollment?.classes);
                  const course = getSingle(classInfo?.courses);
                  return (
                    <div className="cert-card-view" key={cert.id} onClick={() => setSelectedCert(cert)}>
                      <div className="cert-preview">
                        <img
                          src={`/api/certificate/${cert.certificate_code}`}
                          alt={`Chứng nhận ${cert.certificate_code}`}
                          className="cert-preview-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="cert-card-body">
                        <h3>{course?.name || "Chứng nhận hoàn thành"}</h3>
                        <div className="cert-sub-info">
                          <span className="class-tag">Lớp: {classInfo?.class_code || "N/A"}</span>
                          <span className="date-tag">Ngày cấp: {formatDate(cert.issued_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="empty-box">Bạn chưa có chứng nhận nào.</div>
                )}
              </div>
            </div>
          )}

          {activeNav === "courses" && (
            <div className="my-courses-page">
              <div className="certs-header">
                <h2>KHÓA HỌC CỦA TÔI ({enrollments.length})</h2>
              </div>
              {enrollments.length > 0 ? (
                <div className="courses-grid">
                  {enrollments.map(e => {
                    const classInfo = getSingle(e.classes);
                    const course = getSingle(classInfo?.courses);
                    const progress = getCourseProgress(e);
                    const isCompleted = e.status === "completed";
                    return (
                      <button className="course-tile" key={e.id} onClick={() => setSelectedEnrollment(e)}>
                        <div className="course-tile-cover">
                          <CourseCoverArt />
                          <span className={`course-tile-status ${isCompleted ? "done" : "active"}`}>
                            {isCompleted ? "Đã hoàn thành" : "Đang học"}
                          </span>
                        </div>
                        <div className="course-tile-body">
                          <h3>{course?.name}</h3>
                          <p className="teacher-name">GV: {getSingle(classInfo?.teachers)?.full_name || "DUA Team"}</p>
                          <div className="progress-group">
                            <div className="prog-label">
                              <span>Tiến độ học tập</span>
                              <span>{progress.label}</span>
                            </div>
                            <div className="prog-track">
                              <div className="prog-fill" style={{ width: `${Math.max(5, progress.percent)}%` }}></div>
                            </div>
                          </div>
                          <div className="course-tags-row">
                            <span className="c-tag">#{classInfo?.class_code}</span>
                            {classInfo?.schedule && <span className="c-tag schedule">{classInfo.schedule}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-box">Bạn chưa ghi danh khóa học nào.</div>
              )}
            </div>
          )}

          {activeNav === "schedule" && (() => {
            const now = new Date(); now.setHours(0, 0, 0, 0);
            type SessionWithClass = { session: any; enrollment: any; classInfo: any; course: any; date: Date | null };
            const upcoming: SessionWithClass[] = [];
            const past: SessionWithClass[] = [];
            enrollments.forEach(e => {
              const classInfo = getSingle(e.classes);
              const course = getSingle(classInfo?.courses);
              const sessions = (classInfo?.class_sessions || [])
                .map((s: any) => ({ session: s, enrollment: e, classInfo, course, date: s.session_date ? new Date(s.session_date) : null }))
                .filter((x: SessionWithClass) => x.date);
              const nextUp = sessions.filter((x: SessionWithClass) => x.date! >= now).sort((a: SessionWithClass, b: SessionWithClass) => a.date!.getTime() - b.date!.getTime())[0];
              const lastDone = sessions.filter((x: SessionWithClass) => x.date! < now).sort((a: SessionWithClass, b: SessionWithClass) => b.date!.getTime() - a.date!.getTime())[0];
              if (nextUp) upcoming.push(nextUp);
              if (lastDone) past.push(lastDone);
            });
            upcoming.sort((a, b) => a.date!.getTime() - b.date!.getTime());
            past.sort((a, b) => b.date!.getTime() - a.date!.getTime());
            const total = upcoming.length + past.length;
            const buildTitle = (s: any) => {
              const num = s.session_number;
              const title = (s.session_title || "").trim();
              if (!title) return `Buổi ${num}`;
              if (/^buổi\s*\d+/i.test(title)) return title;
              return `Buổi ${num}: ${title}`;
            };
            const formatTimeRange = (s: any) => {
              const a = s.start_time?.slice(0, 5);
              const b = s.end_time?.slice(0, 5);
              if (!a && !b) return null;
              if (a && b) return `${a} – ${b}`;
              return a || b;
            };
            const renderItem = (x: SessionWithClass, isPast: boolean) => {
              const time = formatTimeRange(x.session);
              return (
                <div className={`session-row ${isPast ? "past" : ""}`} key={`${x.enrollment.id}-${x.session.session_number}`}>
                  <div className="session-date">
                    <span className="session-day">{x.date ? x.date.getDate() : "—"}</span>
                    <span className="session-month">{x.date ? `Th${x.date.getMonth() + 1}` : ""}</span>
                  </div>
                  <div className="session-main">
                    <h4>{buildTitle(x.session)}</h4>
                    <div className="session-meta">
                      <span className="session-chip">#{x.classInfo?.class_code}</span>
                      {time && <span className="session-time">🕐 {time}</span>}
                    </div>
                  </div>
                  <div className="session-actions">
                    {!isPast && x.classInfo?.meeting_url && (
                      <a className="btn-primary sm" href={x.classInfo.meeting_url} target="_blank" rel="noopener noreferrer">Vào học</a>
                    )}
                    {isPast && x.classInfo?.recording_url && (
                      <a className="btn-secondary sm" href={x.classInfo.recording_url} target="_blank" rel="noopener noreferrer">Xem lại</a>
                    )}
                  </div>
                </div>
              );
            };
            return (
              <div className="my-courses-page">
                <div className="certs-header"><h2>LỊCH HỌC ({total} buổi gần nhất)</h2></div>
                <h3 className="class-section-title">Sắp tới ({upcoming.length})</h3>
                {upcoming.length > 0 ? (
                  <div className="session-list">{upcoming.map(x => renderItem(x, false))}</div>
                ) : (
                  <div className="empty-box">Không có buổi học sắp tới.</div>
                )}
                {past.length > 0 && (
                  <>
                    <h3 className="class-section-title" style={{ marginTop: 32 }}>Đã diễn ra ({past.length})</h3>
                    <div className="session-list">{past.map(x => renderItem(x, true))}</div>
                  </>
                )}
              </div>
            );
          })()}

          {activeNav === "resources" && (
            <div className="my-courses-page">
              <div className="certs-header"><h2>TÀI NGUYÊN LỚP HỌC</h2></div>
              {enrollments.length > 0 ? (
                <div className="resources-stack">
                  {enrollments.map(e => {
                    const classInfo = getSingle(e.classes);
                    const course = getSingle(classInfo?.courses);
                    const links = [
                      { key: "meeting_url", label: "Vào lớp (Meet)", color: "#10b981" },
                      { key: "slide_url", label: "Slide bài giảng", color: "#f59e0b" },
                      { key: "recording_url", label: "Recording", color: "#8b5cf6" },
                      { key: "reference_url", label: "Tài liệu tham khảo", color: "#3b82f6" },
                      { key: "assignment_url", label: "Bài tập", color: "#ef4444" },
                    ].filter(l => classInfo?.[l.key]);
                    return (
                      <div className="resource-block" key={e.id}>
                        <div className="resource-block-head">
                          <h3>{course?.name}</h3>
                          <span className="c-tag">#{classInfo?.class_code}</span>
                        </div>
                        {links.length > 0 ? (
                          <div className="resource-links">
                            {links.map(l => (
                              <a key={l.key} href={classInfo[l.key]} target="_blank" rel="noopener noreferrer" className="resource-link" style={{ borderColor: l.color, color: l.color }}>
                                {l.label}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="resource-empty">Chưa có tài nguyên cho lớp này.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-box">Bạn chưa ghi danh khóa học nào.</div>
              )}
            </div>
          )}

          {activeNav === "leaderboard" && (
            <div className="my-courses-page">
              <div className="certs-header"><h2>BẢNG XẾP HẠNG</h2></div>
              {enrollments.length > 0 ? (
                <>
                  <div className="lb-tabs">
                    {enrollments.map(e => {
                      const classInfo = getSingle(e.classes);
                      const course = getSingle(classInfo?.courses);
                      const code = classInfo?.class_code;
                      if (!code) return null;
                      const isActive = activeLeaderboardTab === code;
                      return (
                        <button
                          key={e.id}
                          className={`lb-tab ${isActive ? "active" : ""}`}
                          onClick={() => { setActiveLeaderboardTab(code); loadLeaderboard(code); }}
                        >
                          <span className="lb-tab-code">#{code}</span>
                          <span className="lb-tab-name">{course?.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="resource-block" style={{ marginTop: 0 }}>
                    {(() => {
                      if (!activeLeaderboardTab) return <p className="resource-empty">Chọn lớp để xem bảng xếp hạng.</p>;
                      const data = leaderboardData[activeLeaderboardTab];
                      if (!data || data.loading) return <p className="resource-empty">Đang tải bảng xếp hạng...</p>;
                      if (data.error) return <p className="resource-empty">{data.error}</p>;
                      return <LeaderboardInline data={data} currentStudentId={studentInfo?.id} currentStudentName={studentInfo?.full_name} />;
                    })()}
                  </div>
                </>
              ) : (
                <div className="empty-box">Bạn chưa ghi danh khóa học nào.</div>
              )}
            </div>
          )}

          {activeNav === "quiz" && (() => {
            const now = Date.now();
            const items = quizzes.map((q) => {
              const enrollment = enrollments.find((e) => getSingle(e.classes)?.id === q.class_id);
              const classInfo = getSingle(enrollment?.classes);
              const course = getSingle(classInfo?.courses);
              const attempt = quizAttempts[q.id];
              const openAt = q.open_at ? new Date(q.open_at).getTime() : null;
              const closeAt = q.close_at ? new Date(q.close_at).getTime() : null;
              const notOpen = openAt != null && openAt > now;
              const closed = closeAt != null && closeAt < now;
              return { q, classInfo, course, attempt, notOpen, closed };
            }).sort((a, b) => {
              const pri = (x: typeof a) => x.attempt ? 2 : x.closed ? 3 : x.notOpen ? 1 : 0;
              if (pri(a) !== pri(b)) return pri(a) - pri(b);
              return (b.q.session_number ?? 0) - (a.q.session_number ?? 0);
            });
            return (
              <div className="my-courses-page">
                <div className="certs-header">
                  <h2>QUIZ ({items.length})</h2>
                </div>
                <p style={{ color: "#64748b", marginTop: -8, marginBottom: 18, fontSize: 14 }}>
                  Làm quiz cho buổi học. Nếu bạn vắng buổi đó và đạt ≥ ngưỡng pass, hệ thống tự chuyển trạng thái sang <b>Có phép</b> (+0.5 điểm chuyên cần).
                </p>
                {items.length === 0 ? (
                  <div className="empty-box">Chưa có quiz nào.</div>
                ) : (
                  <div className="quiz-list">
                    {items.map(({ q, classInfo, course, attempt, notOpen, closed }) => {
                      const passLabel = `${Math.round(Number(q.pass_threshold) * 100)}%`;
                      return (
                        <div className="quiz-card" key={q.id}>
                          <div className="quiz-card-head">
                            <span className="quiz-session">Buổi {q.session_number}</span>
                            <span className="c-tag">#{classInfo?.class_code}</span>
                            {attempt && <span className={`quiz-status ${attempt.passed ? "passed" : "failed"}`}>{attempt.passed ? "Đã đạt" : "Chưa đạt"}</span>}
                            {!attempt && notOpen && <span className="quiz-status pending">Chưa mở</span>}
                            {!attempt && closed && <span className="quiz-status closed">Đã đóng</span>}
                            {!attempt && !notOpen && !closed && <span className="quiz-status open">Chưa làm</span>}
                          </div>
                          <h3 className="quiz-title">{q.title}</h3>
                          <p className="quiz-meta">{course?.name}</p>
                          <div className="quiz-card-foot">
                            <div className="quiz-info">
                              <span>⏱ {q.time_limit_minutes || "—"} phút</span>
                              <span>· Đạt ≥ {passLabel}</span>
                              {attempt && (
                                <span>· {attempt.correct_count}/{attempt.total_count} ({Math.round(Number(attempt.score) * 100)}%)</span>
                              )}
                            </div>
                            {!notOpen && !closed && (
                              <button className="btn-primary sm" onClick={() => router.push(`/quiz/${q.id}`)}>
                                {attempt ? "Xem lại" : "Làm quiz"}
                              </button>
                            )}
                            {attempt && attempt.status_changed && (
                              <span style={{ fontSize: 12, color: "#065f46", fontWeight: 700 }}>✓ Đã chuyển có phép</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          </>)}
        </div>
      </main>

      {/* Class Overview Modal */}
      {selectedEnrollment && (() => {
        const classInfo = getSingle(selectedEnrollment.classes);
        const course = getSingle(classInfo?.courses);
        const teacher = getSingle(classInfo?.teachers);
        const att = toNumber(selectedEnrollment.attendance_score);
        const assign = toNumber(selectedEnrollment.assignment_score);
        const proj = toNumber(selectedEnrollment.project_score);
        const final = toNumber(selectedEnrollment.final_score);
        const status = selectedEnrollment.status;
        const statusLabel: Record<string, string> = {
          completed: "Đã hoàn thành",
          active: "Đang học",
          enrolled: "Đã ghi danh",
          dropped: "Đã huỷ",
        };
        return (
          <div className="modal-overlay" onClick={() => setSelectedEnrollment(null)}>
            <div className="modal-content class-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelectedEnrollment(null)}>×</button>
              <div className="class-detail-cover">
                <CourseCoverArt />
                <div className="class-detail-cover-overlay">
                  <span className="course-code-pill">{course?.course_code}</span>
                  <h2>{course?.name}</h2>
                  <p>Lớp #{classInfo?.class_code} · GV: {teacher?.full_name || "DUA Team"}</p>
                </div>
              </div>
              <div className="class-detail-body">
                <div className="class-info-row">
                  <span className={`status-pill ${status || "active"}`}>{statusLabel[status] || "Đang học"}</span>
                  {classInfo?.start_date && <span className="info-chip">Khai giảng: {formatDate(classInfo.start_date)}</span>}
                  {classInfo?.total_sessions != null && <span className="info-chip">{classInfo.total_sessions} buổi</span>}
                  {classInfo?.schedule && <span className="info-chip">Lịch: {classInfo.schedule}</span>}
                  {classInfo?.study_time && <span className="info-chip">Giờ học: {classInfo.study_time}</span>}
                </div>

                <h3 className="class-section-title">Kết quả học tập của bạn (thang điểm 10)</h3>
                <div className="score-grid">
                  <div className="score-card">
                    <span className="score-label">Điểm danh</span>
                    <span className="score-value">{att}<span className="score-unit">/10</span></span>
                    <div className="prog-track sm"><div className="prog-fill" style={{ width: `${Math.min(100, att * 10)}%` }} /></div>
                  </div>
                  <div className="score-card">
                    <span className="score-label">Bài tập</span>
                    <span className="score-value">{assign}<span className="score-unit">/10</span></span>
                    <div className="prog-track sm"><div className="prog-fill" style={{ width: `${Math.min(100, assign * 10)}%` }} /></div>
                  </div>
                  <div className="score-card">
                    <span className="score-label">Project</span>
                    <span className="score-value">{proj}<span className="score-unit">/10</span></span>
                    <div className="prog-track sm"><div className="prog-fill" style={{ width: `${Math.min(100, proj * 10)}%` }} /></div>
                  </div>
                  <div className="score-card final">
                    <span className="score-label">Điểm tổng</span>
                    <span className="score-value">{final}<span className="score-unit">/10</span></span>
                    <div className="prog-track sm"><div className="prog-fill" style={{ width: `${Math.min(100, final * 10)}%` }} /></div>
                  </div>
                </div>

                {selectedEnrollment.note && (
                  <div className="class-note-box">
                    <strong>Ghi chú từ GV:</strong>
                    <p>{selectedEnrollment.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="modal-content cert-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCert(null)}>×</button>
            <div className="cert-viewer-container">
              <div className="cert-canvas">
                <img
                  src={`/api/certificate/${selectedCert.certificate_code}`}
                  alt={`Chứng nhận ${selectedCert.certificate_code}`}
                  className="cert-image"
                />
              </div>
              <div className="viewer-actions">
                <button
                  className="btn-primary"
                  onClick={() => window.open(`/api/certificate/${selectedCert.certificate_code}`, "_blank")}
                >
                  Tải xuống bản gốc (.png)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => window.open(`/certificate/${selectedCert.certificate_code}`, "_blank")}
                >
                  Xem trang xác thực
                </button>
                <p>Chứng nhận này được cấp bởi DUA Edu sau khi học viên hoàn thành khóa học.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .app-shell {
          display: flex;
          height: 100vh;
          background: #fdfdfd;
          overflow: hidden;
          position: relative;
          color: #2d3748;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
        }

        /* Background Graphics */
        .blob { position: absolute; filter: blur(100px); opacity: 0.25; z-index: 0; border-radius: 50%; }
        .blob-1 { width: 500px; height: 500px; background: #10b981; top: -150px; right: -100px; }
        .blob-2 { width: 400px; height: 400px; background: #34d399; bottom: -100px; left: -100px; }

        /* Sidebar */
        .sidebar {
          width: 250px;
          background: #ffffff;
          border-right: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          padding: 32px 20px;
          z-index: 10;
        }
        .brand { margin-bottom: 50px; }
        .brand img { height: 42px; }
        .menu { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .menu button, .logout {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border: none; background: none;
          color: #718096; font-weight: 600; font-size: 14px;
          border-radius: 14px; cursor: pointer; transition: 0.2s all ease;
        }
        .menu button:hover { background: #f7fafc; color: #10b981; }
        .menu button.active { 
          background: #ffffff; 
          color: #10b981; 
          border: 1.5px solid #10b981; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); 
        }
        .logout {
          position: fixed;
          left: 24px;
          bottom: 24px;
          z-index: 50;
          margin-top: 0;
          background: #ffffff;
          border: 1px solid #fed7d7;
          color: #e53e3e;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.12);
        }
        .logout:hover { background: #fff5f5; }

        /* Main Area */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; z-index: 5; position: relative; }
        .header { padding: 40px 50px 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .greeting h1 { font-size: 30px; font-weight: 800; margin: 0; color: #1a202c; letter-spacing: -0.5px; }
        .greeting p { color: #718096; margin: 6px 0 0; font-size: 15px; }
        
        .top-user-info { display: flex; align-items: center; gap: 20px; }
        .level-box { text-align: right; }
        .lv-label { display: block; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #a0aec0; letter-spacing: 1px; }
        .lv-val { font-size: 22px; font-weight: 900; color: #10b981; line-height: 1; }
        .avatar-circle { width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; display: grid; place-items: center; border-radius: 16px; font-weight: 800; font-size: 22px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2); }

        .scroll-content { flex: 1; overflow-y: auto; padding: 0 50px 50px; }

        /* Loading skeletons */
        .skeleton-stack { display: flex; flex-direction: column; gap: 24px; }
        .skel-line { height: 22px; width: 260px; border-radius: 8px; background: linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%); background-size: 200% 100%; animation: skel-shimmer 1.4s linear infinite; }
        .skel-line.title { height: 26px; width: 320px; }
        .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .skel-card { height: 220px; border-radius: 18px; background: linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%); background-size: 200% 100%; animation: skel-shimmer 1.4s linear infinite; }
        @keyframes skel-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Sidebar badge */
        .nav-badge { margin-left: auto; min-width: 22px; padding: 2px 8px; border-radius: 999px; background: #ef4444; color: white; font-size: 11px; font-weight: 800; text-align: center; }
        .menu button.active .nav-badge { background: #10b981; }

        /* Quiz list */
        .quiz-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
        .quiz-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 10px; }
        .quiz-card-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .quiz-session { background: #ecfdf5; color: #065f46; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
        .quiz-status { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; }
        .quiz-status.open { background: #fef3c7; color: #92400e; }
        .quiz-status.passed { background: #dcfce7; color: #065f46; }
        .quiz-status.failed { background: #fee2e2; color: #991b1b; }
        .quiz-status.pending { background: #e0e7ff; color: #3730a3; }
        .quiz-status.closed { background: #f1f5f9; color: #64748b; }
        .quiz-title { margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #1e293b; }
        .quiz-meta { margin: 0; color: #64748b; font-size: 13px; }
        .quiz-card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; gap: 10px; flex-wrap: wrap; }
        .quiz-info { color: #475569; font-size: 12px; font-weight: 600; }

        /* Widgets */
        .widgets-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
        .widget-card { background: #ffffff; border-radius: 24px; padding: 26px; border: 1px solid #edf2f7; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: 0.3s; }
        .widget-card:hover { transform: translateY(-4px); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.08); }
        
        .widget-icon { width: 60px; height: 60px; border-radius: 18px; display: grid; place-items: center; }
        .xp .widget-icon { background: #f0fdf4; color: #10b981; }
        .done .widget-icon { background: #ecfdf5; color: #059669; }
        .learning .widget-icon { background: #fffbeb; color: #d97706; }

        .w-label { display: block; font-size: 13px; color: #718096; font-weight: 600; margin-bottom: 2px; }
        .w-val { font-size: 24px; font-weight: 800; color: #1a202c; }

        /* Grid Layout */
        .layout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
        .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-head h2 { font-size: 20px; font-weight: 800; margin: 0; color: #1a202c; }
        .btn-link { background: none; border: none; color: #10b981; font-weight: 700; cursor: pointer; font-size: 14px; }

        /* Course Cards */
        .course-cards-stack { display: grid; gap: 20px; }
        .course-card-premium { 
          background: #ffffff; 
          border: 1px solid #edf2f7; 
          border-radius: 24px; 
          padding: 20px; 
          display: flex; 
          gap: 20px; 
          transition: 0.3s; 
          cursor: pointer;
          align-items: center;
        }
        .course-card-premium:hover { border-color: #10b981; box-shadow: 0 12px 24px rgba(0,0,0,0.04); }
        
        .course-image { 
          width: 100px; 
          height: 100px; 
          border-radius: 20px; 
          background: linear-gradient(135deg, #10b981, #34d399); 
          position: relative; 
          flex-shrink: 0;
          overflow: hidden;
        }
        .course-code-badge { 
          position: absolute; 
          bottom: 8px; 
          left: 8px; 
          right: 8px;
          background: rgba(0,0,0,0.4); 
          color: #fff; 
          font-size: 9px; 
          font-weight: 800; 
          padding: 4px; 
          border-radius: 6px; 
          backdrop-filter: blur(8px); 
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .course-body { flex: 1; min-width: 0; }
        .course-body h3 { margin: 0 0 4px; font-size: 18px; color: #1a202c; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .teacher-name { margin: 0 0 16px; color: #718096; font-size: 13px; font-weight: 500; }
        
        .progress-group { margin-bottom: 12px; max-width: 400px; }
        .prog-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #4a5568; margin-bottom: 8px; }
        .prog-track { height: 6px; background: #f7fafc; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; }
        .prog-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 20px; }

        .course-tags-row { display: flex; gap: 8px; }
        .c-tag { font-size: 11px; font-weight: 700; color: #718096; background: #f7fafc; padding: 4px 10px; border-radius: 8px; }
        .c-tag:empty { display: none; }
        .c-tag.schedule { border: 1px solid #edf2f7; background: transparent; }

        /* Side Widgets */
        .side-widgets { display: flex; flex-direction: column; gap: 32px; }
        .side-card { background: #ffffff; border-radius: 24px; padding: 24px; border: 1px solid #edf2f7; box-shadow: 0 4px 12px rgba(0,0,0,0.01); }
        
        .level-widget { text-align: center; }
        .level-widget h3 { font-size: 16px; margin: 0 0 20px; color: #1a202c; }
        .progress-circle-container { width: 120px; height: 120px; margin: 0 auto 16px; position: relative; }
        .circular-chart-premium { width: 100%; height: 100%; }
        .circle-bg { fill: none; stroke: #f7fafc; stroke-width: 2.5; }
        .circle { fill: none; stroke: #10b981; stroke-width: 2.5; stroke-linecap: round; transition: 0.6s all ease; }
        .circle-inner-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; }
        .big-num { font-size: 32px; font-weight: 900; color: #1a202c; line-height: 1; }
        .small-label { font-size: 10px; text-transform: uppercase; font-weight: 800; color: #a0aec0; margin-top: 2px; }
        .xp-remaining { font-size: 12px; color: #718096; margin: 0; font-weight: 500; }

        .cert-widget-premium .widget-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cert-widget-premium h3 { font-size: 16px; margin: 0; color: #1a202c; font-weight: 800; }
        .cert-row { display: flex; align-items: center; gap: 14px; background: #f8fafc; padding: 14px 16px; border-radius: 20px; border: 1px solid #f1f5f9; }
        .cert-lead-icon { font-size: 24px; }
        .cert-meta { flex: 1; }
        .cert-meta strong { display: block; font-size: 14px; color: #1a202c; font-weight: 800; }
        .cert-meta span { font-size: 12px; color: #a0aec0; font-weight: 500; }
        .btn-dl { width: 36px; height: 36px; border-radius: 50%; background: #ffffff; display: grid; place-items: center; color: #10b981; border: 1px solid #edf2f7; transition: 0.2s; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .btn-dl:hover { transform: scale(1.1); box-shadow: 0 6px 12px rgba(16, 185, 129, 0.1); }

        /* Certs Page */
        .certs-header { border-left: 4px solid #10b981; padding-left: 16px; margin-bottom: 30px; }
        .certs-header h2 { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; }

        .my-courses-page .course-cards-stack { display: flex; flex-direction: column; gap: 18px; }
        .course-status-tag { position: absolute; top: 8px; right: 8px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.3px; }
        .course-status-tag.done { background: rgba(16, 185, 129, 0.95); color: #fff; }

        .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .course-tile { background: #ffffff; border: 1px solid #edf2f7; border-radius: 20px; overflow: hidden; cursor: pointer; padding: 0; text-align: left; transition: 0.25s ease; box-shadow: 0 4px 18px rgba(0,0,0,0.03); display: flex; flex-direction: column; }
        .course-tile:hover { transform: translateY(-4px); box-shadow: 0 18px 36px rgba(15, 23, 42, 0.10); border-color: #10b981; }
        .course-tile-cover { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; background: #ecfdf5; }
        .course-tile-cover svg { width: 100%; height: 100%; display: block; transition: transform 0.4s ease; }
        .course-tile:hover .course-tile-cover svg { transform: scale(1.04); }
        .course-tile-status { position: absolute; top: 12px; right: 12px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.4px; backdrop-filter: blur(6px); }
        .course-tile-status.active { background: rgba(255,255,255,0.95); color: #0f766e; }
        .course-tile-status.done { background: rgba(16, 185, 129, 0.95); color: #fff; }
        .course-tile-body { padding: 20px 22px 22px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .course-tile-body h3 { font-size: 17px; font-weight: 800; color: #1a202c; margin: 0; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: calc(1.35em * 2); }
        .course-tile-body .teacher-name { margin: 0; }
        .course-tile-body .progress-group { margin-top: auto; }
        .course-tile-body .course-tags-row { min-height: 32px; }

        .class-detail-modal { max-width: 720px; padding: 0; }
        .class-detail-cover { position: relative; width: 100%; aspect-ratio: 16/7; overflow: hidden; background: #ecfdf5; }
        .class-detail-cover svg { width: 100%; height: 100%; display: block; }
        .class-detail-cover-overlay { position: absolute; inset: 0; padding: 24px 28px; display: flex; flex-direction: column; justify-content: flex-end; color: #fff; background: linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.75) 100%); }
        .class-detail-cover-overlay h2 { margin: 6px 0 4px; font-size: 24px; font-weight: 800; line-height: 1.25; }
        .class-detail-cover-overlay p { margin: 0; font-size: 14px; opacity: 0.92; }
        .course-code-pill { align-self: flex-start; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }

        .class-detail-body { padding: 24px 28px 30px; }
        .class-info-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .status-pill { padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.3px; }
        .status-pill.completed { background: #d1fae5; color: #065f46; }
        .status-pill.active, .status-pill.enrolled { background: #e0f2fe; color: #075985; }
        .status-pill.dropped { background: #fee2e2; color: #991b1b; }
        .info-chip { background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }

        .class-section-title { font-size: 15px; font-weight: 800; color: #334155; margin: 0 0 14px; letter-spacing: 0.2px; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; }
        .score-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
        .score-card.final { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-color: #6ee7b7; }
        .score-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .score-value { font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1; display: inline-flex; align-items: baseline; gap: 2px; }
        .score-unit { font-size: 13px; font-weight: 700; color: #94a3b8; }
        .prog-track.sm { height: 6px; }

        .class-note-box { margin-top: 22px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; font-size: 14px; color: #78350f; }
        .class-note-box strong { display: block; margin-bottom: 4px; }
        .class-note-box p { margin: 0; line-height: 1.5; }

        /* Schedule tab */
        .session-list { display: flex; flex-direction: column; gap: 10px; }
        .session-row { display: grid; grid-template-columns: 56px 1fr auto; gap: 16px; align-items: center; background: #ffffff; border: 1px solid #edf2f7; border-radius: 14px; padding: 12px 16px; }
        .session-row.past { background: #f8fafc; opacity: 0.85; }
        .session-row:hover { border-color: #d1fae5; }
        .session-date { display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #10b981, #34d399); color: #fff; border-radius: 10px; padding: 8px 0; width: 56px; height: 56px; }
        .session-row.past .session-date { background: #cbd5e1; }
        .session-day { font-size: 20px; font-weight: 900; line-height: 1; }
        .session-month { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; margin-top: 2px; opacity: 0.9; }
        .session-main { min-width: 0; }
        .session-main h4 { margin: 0 0 6px; font-size: 14px; color: #1a202c; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .session-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .session-chip { font-size: 11px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 3px 9px; border-radius: 999px; }
        .session-time { font-size: 12px; color: #64748b; font-weight: 600; }
        .btn-primary.sm, .btn-secondary.sm { padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 999px; text-decoration: none; display: inline-block; white-space: nowrap; }

        /* Resources & Leaderboard */
        .resources-stack { display: flex; flex-direction: column; gap: 16px; }
        .resource-block { background: #ffffff; border: 1px solid #edf2f7; border-radius: 18px; padding: 20px 22px; }
        .resource-block-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .resource-block-head h3 { font-size: 17px; font-weight: 800; color: #1a202c; margin: 0; flex: 1; }
        .resource-links { display: flex; flex-wrap: wrap; gap: 10px; }
        .resource-link { padding: 10px 16px; border: 1.5px solid; border-radius: 12px; font-weight: 700; font-size: 13px; text-decoration: none; background: white; transition: 0.2s; }
        .resource-link:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .resource-empty { color: #94a3b8; font-size: 14px; margin: 0; }

        /* Leaderboard tabs */
        .lb-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
        .lb-tab { background: white; border: 1.5px solid #e2e8f0; padding: 10px 18px; border-radius: 999px; cursor: pointer; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; transition: 0.2s ease; min-width: 140px; }
        .lb-tab:hover { border-color: #10b981; color: #10b981; }
        .lb-tab.active { background: linear-gradient(135deg, #10b981, #059669); border-color: #10b981; color: white; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25); }
        .lb-tab-code { font-size: 12px; font-weight: 800; letter-spacing: 0.3px; opacity: 0.85; }
        .lb-tab-name { font-size: 13px; font-weight: 700; text-align: left; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .certs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 30px; }
        .cert-card-view { background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: 0.3s; cursor: pointer; }
        .cert-card-view:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
        .cert-preview { width: 100%; aspect-ratio: 1.414 / 1; background: #f1f5f9; position: relative; border-bottom: 1px solid #edf2f7; overflow: hidden; }
        .cert-preview-img { width: 100%; height: 100%; object-fit: contain; display: block; background: white; transition: transform 0.3s ease; }
        .cert-card-view:hover .cert-preview-img { transform: scale(1.03); }
        .cert-card-body { padding: 24px; }
        .cert-card-body h3 { font-size: 20px; font-weight: 800; color: #10b981; margin: 0 0 12px; line-height: 1.3; }
        .cert-sub-info { display: flex; flex-wrap: wrap; gap: 12px; }
        .class-tag, .date-tag { font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 8px; }
        .class-tag { background: #f0fdf4; color: #10b981; }
        .date-tag { background: #f7fafc; color: #718096; }

        /* Modal Viewer */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 100; display: grid; place-items: center; padding: 40px; }
        .modal-content { background: white; border-radius: 32px; width: 100%; max-width: 1000px; position: relative; overflow: hidden; animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .close-btn { position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; border: none; font-size: 24px; cursor: pointer; z-index: 110; transition: 0.2s; }
        .close-btn:hover { background: #e2e8f0; transform: rotate(90deg); }
        
        .cert-modal { max-width: 820px; max-height: 92vh; display: flex; flex-direction: column; }
        .cert-viewer-container { padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 18px; overflow-y: auto; }
        .cert-canvas { width: 100%; max-width: 700px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 28px rgba(0,0,0,0.12); flex-shrink: 0; }
        .cert-image { width: 100%; height: auto; display: block; }

        .viewer-actions { text-align: center; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px; flex-shrink: 0; }
        .viewer-actions > .btn-primary, .viewer-actions > .btn-secondary { min-width: 200px; }
        .viewer-actions p { font-size: 13px; color: #718096; margin: 4px 0 0; flex-basis: 100%; }

        /* Roadmap */
        .roadmap-page { padding: 8px 0 48px; }
        .roadmap-header { max-width: 720px; margin-bottom: 32px; }
        .roadmap-kicker { margin: 0 0 8px; color: #0f766e; font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .roadmap-header h2 { margin: 0 0 10px; color: #1a202c; font-size: 28px; font-weight: 900; }
        .roadmap-header p { margin: 0; color: #64748b; font-size: 15px; line-height: 1.6; }
        .roadmap-track { display: grid; grid-template-columns: minmax(260px, 1fr) 96px minmax(260px, 1fr); align-items: stretch; gap: 0; max-width: 1040px; }
        .roadmap-card { position: relative; display: flex; gap: 18px; min-height: 260px; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06); }
        .roadmap-card.foundation { border-top: 5px solid #0f766e; }
        .roadmap-card.practice { border-top: 5px solid #d97706; }
        .roadmap-step { width: 52px; height: 52px; display: grid; place-items: center; flex-shrink: 0; border-radius: 18px; background: #f0fdfa; color: #0f766e; font-size: 18px; font-weight: 900; }
        .practice .roadmap-step { background: #fffbeb; color: #b45309; }
        .roadmap-content { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: flex-start; }
        .roadmap-label { margin-bottom: 10px; color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .roadmap-content h3 { margin: 0 0 12px; color: #1a202c; font-size: 24px; font-weight: 900; line-height: 1.2; }
        .roadmap-content p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.65; }
        .roadmap-action { margin-top: auto; }
        .btn-secondary { background: #ffffff; color: #0f766e; border: 1px solid #99f6e4; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .btn-secondary:hover { background: #f0fdfa; border-color: #14b8a6; }
        .roadmap-connector { position: relative; height: 100%; min-height: 260px; }
        .roadmap-connector::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 3px; transform: translateY(-50%); background: linear-gradient(90deg, #0f766e, #d97706); }
        .roadmap-connector span { position: absolute; top: 50%; left: 50%; width: 38px; height: 38px; transform: translate(-50%, -50%); border-radius: 50%; background: #ffffff; border: 3px solid #f59e0b; box-shadow: 0 10px 22px rgba(217, 119, 6, 0.18); }
        .roadmap-connector span::after { content: ""; position: absolute; top: 50%; left: 50%; width: 10px; height: 10px; border-top: 3px solid #d97706; border-right: 3px solid #d97706; transform: translate(-65%, -50%) rotate(45deg); }

        /* Empty State Full */
        .empty-state-full { text-align: center; padding: 80px 20px; }
        .empty-state-full .icon { font-size: 60px; margin-bottom: 24px; }
        .empty-state-full h3 { font-size: 24px; font-weight: 800; margin: 0 0 12px; }
        .empty-state-full p { color: #718096; margin-bottom: 32px; }
        .btn-primary { background: #10b981; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-primary:hover { background: #059669; }

        .empty-box, .cert-empty { text-align: center; color: #a0aec0; font-size: 14px; padding: 30px 20px; border: 2px dashed #edf2f7; border-radius: 20px; }

        @media (max-width: 760px) {
          .app-shell { height: auto; min-height: 100vh; flex-direction: column; overflow: visible; overflow-x: hidden; }
          .main { overflow: visible; }
          .scroll-content { overflow-y: visible; flex: none; }
          .blob { display: none; }

          .sidebar { width: auto; padding: 10px 12px; border-right: none; border-bottom: 1px solid #edf2f7; flex-direction: row; align-items: center; gap: 8px; position: sticky; top: 0; background: #ffffff; z-index: 30; }
          .brand { display: none; }
          .menu { flex: 1; min-width: 0; flex-direction: row; overflow-x: auto; gap: 6px; padding: 2px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .menu::-webkit-scrollbar { display: none; }
          .menu button { flex-shrink: 0; padding: 8px 12px; font-size: 12px; gap: 6px; border-radius: 999px; }
          .menu button span { white-space: nowrap; }
          .menu button svg { width: 16px; height: 16px; }
          .logout { position: static; margin-top: 0; flex-shrink: 0; padding: 8px 12px; font-size: 12px; box-shadow: none; gap: 4px; border-radius: 999px; }
          .logout svg { width: 16px; height: 16px; }
          .logout span { display: none; }

          .header { padding: 22px 18px 18px; align-items: flex-start; gap: 12px; }
          .greeting h1 { font-size: 22px; }
          .greeting p { font-size: 13px; }
          .scroll-content { padding: 0 18px 32px; }

          .certs-header h2 { font-size: 18px; }
          .certs-grid { grid-template-columns: 1fr; gap: 16px; }

          .courses-grid { grid-template-columns: 1fr; gap: 16px; }
          .course-tile-body { padding: 16px 18px 18px; }
          .course-tile-body h3 { font-size: 16px; min-height: 0; }

          .modal-overlay { padding: 12px; }
          .modal-content { border-radius: 22px; }
          .close-btn { top: 10px; right: 10px; width: 34px; height: 34px; font-size: 22px; }

          .cert-modal { max-height: 95vh; }
          .cert-viewer-container { padding: 16px; gap: 14px; }
          .viewer-actions { width: 100%; }
          .viewer-actions > .btn-primary, .viewer-actions > .btn-secondary { min-width: 0; width: 100%; }

          .class-detail-cover { aspect-ratio: 16/9; }
          .class-detail-cover-overlay { padding: 16px 18px; }
          .class-detail-cover-overlay h2 { font-size: 18px; }
          .class-detail-cover-overlay p { font-size: 12px; }
          .class-detail-body { padding: 18px 20px 24px; }
          .info-chip { font-size: 11px; padding: 5px 10px; }
          .score-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .score-card { padding: 12px; }
          .score-value { font-size: 22px; }

          .session-row { grid-template-columns: 48px 1fr auto; gap: 12px; padding: 10px 12px; }
          .session-date { width: 48px; height: 48px; padding: 6px 0; }
          .session-day { font-size: 18px; }
          .session-main h4 { font-size: 13px; }
          .session-meta { gap: 6px; }
          .session-time { font-size: 11px; }
          .btn-primary.sm, .btn-secondary.sm { padding: 6px 12px; font-size: 11px; }

          .lb-tabs { gap: 6px; }
          .lb-tab { min-width: 0; flex: 1; padding: 8px 12px; }
          .lb-tab-code { font-size: 11px; }
          .lb-tab-name { font-size: 11px; max-width: 110px; }

          .resource-block { padding: 16px 18px; }
          .resource-block-head h3 { font-size: 15px; }
          .resource-link { padding: 8px 12px; font-size: 12px; }
        }

        @media (max-width: 480px) {
          .greeting h1 { font-size: 20px; }
          .menu button, .logout { padding: 8px 12px; font-size: 12px; }
          .courses-grid { gap: 14px; }
          .resource-link { font-size: 11px; padding: 7px 10px; }
        }
      `}</style>
    </div>
  );
}
