"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Session {
  session_number: number;
  session_title: string;
  session_date: string;
  start_time: string;
  end_time: string;
}

interface ClassData {
  id: string;
  class_code: string;
  class_name: string;
  meeting_url?: string;
  recording_url?: string;
  slide_url?: string;
  reference_url?: string;
  assignment_url?: string;
  courses?: { name: string };
  class_sessions?: Session[];
}

interface EnrollmentData {
  id: string;
  status: string;
  attendance_score: number | null;
  assignment_score: number | null;
  project_score: number | null;
  final_score: number | null;
  certificates?: { certificate_code: string }[];
  classes: ClassData;
}

interface StudentData {
  id: string;
  full_name: string;
  email: string;
  enrollments: EnrollmentData[];
}

export default function TraCuuPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Auto search on mount if email in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      performSearch(emailParam);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    performSearch(email);
  };

  const performSearch = async (targetEmail: string) => {
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(`/api/student/lookup?email=${encodeURIComponent(targetEmail.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Không tìm thấy dữ liệu. Vui lòng kiểm tra lại email hoặc liên hệ quản trị viên.");
        setStudentData(null);
      } else {
        setStudentData(data as StudentData);
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("email", targetEmail.trim());
        window.history.pushState({}, "", url.toString());
      }
    } catch (err: any) {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const isFinished = status === "completed" || status === "finished";
    return (
      <span style={{
        padding: "4px 10px",
        borderRadius: "100px",
        fontSize: "11px",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        background: isFinished ? "#ecfdf5" : "#eff6ff",
        color: isFinished ? "#059669" : "#2563eb",
        border: `1px solid ${isFinished ? "#10b98133" : "#3b82f633"}`
      }}>
        {isFinished ? "Hoàn thành" : "Đang học"}
      </span>
    );
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8fafc",
      backgroundImage: "radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.05), transparent), radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.05), transparent)",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: "#1e293b",
      paddingBottom: "80px"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet" />

      {/* Header / Logo */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "center" }}>
        <Link href="/">
          <img src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" alt="Dua Edu" style={{ height: "45px" }} />
        </Link>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>
        {/* Hero Search Section */}
        <div style={{ 
          textAlign: "center", 
          marginTop: studentData ? "20px" : "80px",
          transition: "all 0.5s ease"
        }}>
          {!studentData && (
            <>
              <h1 style={{ fontSize: "48px", fontWeight: 800, color: "#0f172a", marginBottom: "16px", letterSpacing: "-1px" }}>
                Cổng Tra Cứu Học Viên
              </h1>
              <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "40px" }}>
                Nhập email của bạn để xem điểm số, lịch học và tài nguyên khóa học.
              </p>
            </>
          )}

          <form onSubmit={handleSearch} style={{ 
            maxWidth: "600px", 
            margin: "0 auto", 
            position: "relative",
            display: "flex",
            gap: "12px"
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="email"
                placeholder="Email của bạn (ví dụ: nguyenvan@gmail.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  paddingLeft: "54px",
                  borderRadius: "20px",
                  border: "2px solid #e2e8f0",
                  fontSize: "16px",
                  outline: "none",
                  transition: "all 0.2s",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                  backgroundColor: "white"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <svg style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: "0 32px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: "20px",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.25)",
                whiteSpace: "nowrap"
              }}
            >
              {loading ? "Đang tìm..." : "Tra cứu"}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: "20px", color: "#ef4444", fontWeight: 600, padding: "12px 20px", background: "#fef2f2", borderRadius: "12px", display: "inline-block" }}>
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {studentData && (
          <div style={{ marginTop: "60px", animation: "fadeIn 0.5s ease-out" }}>
            {/* Student Info Card */}
            <div style={{ 
              background: "white", borderRadius: "32px", padding: "32px", marginBottom: "40px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: "24px"
            }}>
              <div style={{ 
                width: "80px", height: "80px", borderRadius: "50%", 
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "32px", fontWeight: 800
              }}>
                {studentData.full_name.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: "28px", fontWeight: 800, margin: 0, color: "#0f172a" }}>{studentData.full_name}</h2>
                <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "16px" }}>Học viên tại DUA Edu • {studentData.email}</p>
              </div>
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "24px", color: "#475569" }}>CÁC KHÓA HỌC CỦA BẠN</h3>

            {/* Class Tabs */}
            {studentData.enrollments.length > 1 && (
              <div style={{ 
                display: "flex", gap: "12px", marginBottom: "24px", overflowX: "auto", paddingBottom: "8px",
                scrollbarWidth: "none"
              }}>
                {studentData.enrollments.map((en, idx) => (
                  <button 
                    key={en.id}
                    onClick={() => setActiveTabIndex(idx)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "14px",
                      border: "none",
                      background: activeTabIndex === idx ? "#10b981" : "white",
                      color: activeTabIndex === idx ? "white" : "#64748b",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: activeTabIndex === idx ? "0 10px 15px -3px rgba(16, 185, 129, 0.2)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
                      transition: "all 0.2s"
                    }}
                  >
                    {en.classes.class_name}
                  </button>
                ))}
              </div>
            )}

            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              {(() => {
                const enrollment = studentData.enrollments[activeTabIndex];
                if (!enrollment) return null;
                return (
                  <div key={enrollment.id} style={{ 
                    background: "white", borderRadius: "32px", overflow: "hidden",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9"
                  }}>
                    {/* Class Header */}
                    <div style={{ padding: "32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                          {enrollment.classes.courses?.name || "KHOÁ HỌC"}
                        </div>
                        <h4 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>{enrollment.classes.class_name}</h4>
                        <div style={{ display: "flex", gap: "16px", marginTop: "12px", color: "#64748b", fontSize: "14px" }}>
                          <span>Mã lớp: <strong>{enrollment.classes.class_code}</strong></span>
                          {enrollment.certificates && enrollment.certificates.length > 0 && (
                            <Link 
                              href={`/certificate/${enrollment.certificates[0].certificate_code}`} 
                              target="_blank"
                              style={{ 
                                fontSize: "12px", 
                                fontWeight: 800, 
                                color: "white", 
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                background: "linear-gradient(135deg, #059669, #10b981)",
                                borderRadius: "10px",
                                boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
                                transition: "all 0.2s"
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              XEM CHỨNG CHỈ
                            </Link>
                          )}
                          <Link href={`/leaderboard/${enrollment.classes.class_code}`} target="_blank" style={{ color: "#10b981", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                            Bảng xếp hạng lớp
                          </Link>
                        </div>
                      </div>
                      {renderStatusBadge(enrollment.status)}
                    </div>

                    {/* Scores Grid */}
                    <div style={{ padding: "32px", background: "#fafafa" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px" }}>
                        {[
                          { label: "Chuyên cần", val: enrollment.attendance_score, color: "#10b981" },
                          { label: "Bài tập", val: enrollment.assignment_score, color: "#6366f1" },
                          { label: "Đồ án", val: enrollment.project_score, color: "#f59e0b" },
                          { label: "Tổng kết", val: enrollment.final_score, color: "#0f172a", isBold: true }
                        ].map((s, i) => (
                          <div key={i} style={{ background: "white", padding: "20px", borderRadius: "20px", textAlign: "center", border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>{s.label}</div>
                            <div style={{ fontSize: "28px", fontWeight: 800, color: s.color }}>{s.val ?? "-"}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Class-level Resources */}
                    {(enrollment.classes.meeting_url ||
                      enrollment.classes.slide_url ||
                      enrollment.classes.reference_url ||
                      enrollment.classes.assignment_url ||
                      enrollment.classes.recording_url) && (
                      <div style={{ padding: "0 32px 24px 32px" }}>
                        <h5 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "#475569" }}>TÀI NGUYÊN LỚP HỌC</h5>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {enrollment.classes.meeting_url && <ResourceBtn url={enrollment.classes.meeting_url} type="meeting" label="Học online" />}
                          {enrollment.classes.slide_url && <ResourceBtn url={enrollment.classes.slide_url} type="slide" label="Slide bài giảng" />}
                          {enrollment.classes.reference_url && <ResourceBtn url={enrollment.classes.reference_url} type="doc" label="Tài liệu tham khảo" />}
                          {enrollment.classes.assignment_url && <ResourceBtn url={enrollment.classes.assignment_url} type="hw" label="Bài tập" />}
                          {enrollment.classes.recording_url && <ResourceBtn url={enrollment.classes.recording_url} type="video" label="Video xem lại" />}
                        </div>
                      </div>
                    )}

                    {/* Sessions Table */}
                    {enrollment.classes.class_sessions && enrollment.classes.class_sessions.length > 0 && (
                      <div style={{ padding: "0 32px 32px 32px" }}>
                        <h5 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "20px", color: "#475569" }}>LỊCH HỌC</h5>
                        <div style={{ overflowX: "auto", borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                              <tr style={{ background: "#fafafa", textAlign: "left", borderBottom: "1px solid #f1f5f9" }}>
                                <th style={{ padding: "16px", color: "#94a3b8", fontWeight: 700, width: "60px" }}>BUỔI</th>
                                <th style={{ padding: "16px", color: "#94a3b8", fontWeight: 700 }}>NỘI DUNG BÀI HỌC</th>
                                <th style={{ padding: "16px", color: "#94a3b8", fontWeight: 700 }}>THỜI GIAN</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enrollment.classes.class_sessions
                                .sort((a, b) => a.session_number - b.session_number)
                                .map((session) => (
                                <tr key={session.session_number} style={{ borderBottom: "1px solid #f8fafc" }}>
                                  <td style={{ padding: "16px", fontWeight: 800, color: "#94a3b8" }}>{session.session_number}</td>
                                  <td style={{ padding: "16px", fontWeight: 700, color: "#1e293b" }}>{session.session_title}</td>
                                  <td style={{ padding: "16px", color: "#64748b", fontSize: "13px" }}>
                                    {session.session_date ? new Date(session.session_date).toLocaleDateString("vi-VN") : "N/A"}<br/>
                                    <span style={{ fontSize: "11px", opacity: 0.7 }}>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

function ResourceBtn({ url, type, label }: { url: string, type: string, label: string }) {
  const colors: Record<string, string> = {
    meeting: "#10b981",
    slide: "#f59e0b",
    doc: "#3b82f6",
    hw: "#ef4444",
    video: "#8b5cf6"
  };
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      padding: "6px 12px",
      borderRadius: "100px",
      fontSize: "11px",
      fontWeight: 800,
      textDecoration: "none",
      color: colors[type] || "#64748b",
      background: `${colors[type]}11` || "#f1f5f9",
      border: `1px solid ${colors[type]}33` || "#e2e8f0",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      transition: "all 0.2s"
    }}>
      {label}
    </a>
  );
}
