"use client";

import React, { useState } from "react";

interface AttendanceViewProps {
  visibleClassItems: any[];
  selectedAttendanceClassId: string | null;
  setSelectedAttendanceClassId: (id: string | null) => void;
  selectedAttendanceSession: number;
  setSelectedAttendanceSession: (num: number) => void;
  attendanceRecordsByEnrollment: Map<string, any>;
  selectedClassEnrollments: any[];
  isSaving: boolean;
  onUpdateAttendance: (enrollmentId: string, status: string, note?: string) => void;
  onRefresh: () => void;
  attendanceSessionCount: number;
  attendanceError: string | null;
  attendanceMode: "session" | "summary";
  setAttendanceMode: (mode: "session" | "summary") => void;
  attendanceRecords: any[];
  showAttendanceGuide: boolean;
  setShowAttendanceGuide: (val: boolean) => void;
}

export function AttendanceView({
  visibleClassItems,
  selectedAttendanceClassId,
  setSelectedAttendanceClassId,
  selectedAttendanceSession,
  setSelectedAttendanceSession,
  attendanceRecordsByEnrollment,
  selectedClassEnrollments,
  isSaving,
  onUpdateAttendance,
  onRefresh,
  attendanceSessionCount,
  attendanceError,
  attendanceMode,
  setAttendanceMode,
  attendanceRecords,
  showAttendanceGuide,
  setShowAttendanceGuide,
}: AttendanceViewProps) {
  // Helper to get status label and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "present": return { label: "V", color: "#10b981", title: "Có mặt" };
      case "absent": return { label: "X", color: "#ef4444", title: "Vắng mặt" };
      case "late": return { label: "M", color: "#f59e0b", title: "Đi muộn" };
      case "excused": return { label: "P", color: "#3b82f6", title: "Có phép" };
      default: return { label: "-", color: "#e2e8f0", title: "Chưa điểm danh" };
    }
  };

  // Calculate score: (V:1, P:0.75, M:0.5, X:0.25, Unmarked:0)
  // Buổi 0 (session_number = 0) là buổi mở đầu, không tính vào điểm chuyên cần.
  const calculateAttendanceScore = (enrollmentId: string) => {
    const studentRecords = attendanceRecords.filter(r =>
      String(r.enrollment_id) === String(enrollmentId) && Number(r.session_number) !== 0,
    );
    if (attendanceSessionCount === 0) return 0;

    let totalPoints = 0;
    studentRecords.forEach(r => {
      if (r.status === "present") totalPoints += 1;
      else if (r.status === "late") totalPoints += 0.75;
      else if (r.status === "excused") totalPoints += 0.5;
      else if (r.status === "absent") totalPoints += 0;
    });

    return Number(((totalPoints / attendanceSessionCount) * 10).toFixed(2));
  };

  return (
    <section className="analytics-grid" aria-label="Giao diện điểm danh">
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div className="attendance-toolbar" style={{ marginBottom: "24px", gap: "16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "16px", flex: "1", minWidth: "200px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ flex: "1 1 200px", maxWidth: "350px" }}>
              <span>Lớp học</span>
              <select onChange={(e) => { setSelectedAttendanceClassId(e.target.value || null); setSelectedAttendanceSession(1); }} value={selectedAttendanceClassId ?? ""}>
                <option value="">Chọn lớp học</option>
                {visibleClassItems.map(item => <option key={item.id} value={item.id}>{item.classCode} - {item.className}</option>)}
              </select>
            </label>

            {attendanceMode === "session" && (
              <label style={{ width: "140px" }}>
                <span>Buổi học</span>
                <select onChange={(e) => setSelectedAttendanceSession(Number(e.target.value))} value={selectedAttendanceSession}>
                  {Array.from({ length: attendanceSessionCount + 1 }, (_, i) => i).map(n => (
                    <option key={n} value={n}>{n === 0 ? "Buổi 0 (không tính điểm)" : `Buổi ${n}`}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px", background: "var(--background-secondary)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <button 
                onClick={() => setAttendanceMode("session")}
                style={{ 
                  padding: "6px 14px", 
                  borderRadius: "7px", 
                  border: "none", 
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: attendanceMode === "session" ? "white" : "transparent",
                  color: attendanceMode === "session" ? "var(--primary)" : "var(--text-secondary)",
                  boxShadow: attendanceMode === "session" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Theo buổi
              </button>
              <button 
                onClick={() => setAttendanceMode("summary")}
                style={{ 
                  padding: "6px 14px", 
                  borderRadius: "7px", 
                  border: "none", 
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: attendanceMode === "summary" ? "white" : "transparent",
                  color: attendanceMode === "summary" ? "var(--primary)" : "var(--text-secondary)",
                  boxShadow: attendanceMode === "summary" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Tổng hợp
              </button>
            </div>
            <button 
              className={`attendance-icon-button guide-trigger ${showAttendanceGuide ? "active" : ""}`} 
              onClick={() => setShowAttendanceGuide(!showAttendanceGuide)} 
              type="button" 
              aria-label="Hướng dẫn"
              title="Hướng dẫn"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: showAttendanceGuide ? "var(--primary-soft)" : "transparent",
                color: showAttendanceGuide ? "var(--primary)" : "inherit"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          {showAttendanceGuide && (
            <div 
              className="guide-popover" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
              position: "absolute",
              top: "0",
              right: "0",
              zIndex: 100,
              width: "360px",
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid var(--border)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              animation: "fadeIn 0.2s ease-out"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ padding: "6px", backgroundColor: "var(--primary-soft)", color: "var(--primary)", borderRadius: "6px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Quy đổi điểm chuyên cần</h4>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {[
                  { code: "V", label: "Có mặt", score: "1.0", bg: "#f0fdf4", color: "#166534" },
                  { code: "M", label: "Đi muộn", score: "0.75", bg: "#fffbeb", color: "#92400e" },
                  { code: "P", label: "Có phép", score: "0.8", bg: "#f0f9ff", color: "#075985" },
                  { code: "X", label: "Vắng mặt", score: "0", bg: "#fef2f2", color: "#991b1b" }
                ].map(rule => (
                  <div key={rule.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: rule.bg, borderRadius: "8px", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <strong style={{ color: rule.color, width: "15px" }}>{rule.code}</strong>
                      <span style={{ fontWeight: 500 }}>{rule.label}</span>
                    </div>
                    <b style={{ color: rule.color }}>+{rule.score}</b>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px", padding: "10px", backgroundColor: "var(--background-soft)", borderRadius: "8px" }}>
                <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--foreground)" }}>Công thức tính:</div>
                <code style={{ fontSize: "11px" }}>(Tổng điểm các buổi / Tổng số buổi) x 10</code>
              </div>

              <p style={{ fontSize: "13px", margin: "0 0 16px", color: "var(--foreground-muted)" }}>
                Điểm chuyên cần chiếm <strong>30%</strong> trong điểm tổng kết của học viên.
              </p>

              <button 
                onClick={() => setShowAttendanceGuide(false)}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: "var(--primary)", 
                  color: "white", 
                  fontWeight: 600, 
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Đã hiểu
              </button>
            </div>
          )}
        </div>

        {attendanceError && <div className="notice error">{attendanceError}</div>}

        <div className="class-table" style={{ overflowX: "auto" }}>
          {attendanceMode === "session" ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>STT</th>
                  <th>Học viên</th>
                  <th style={{ width: "200px" }}>Trạng thái buổi {selectedAttendanceSession}</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {selectedClassEnrollments.length ? (
                  selectedClassEnrollments.map((enrollment, index) => {
                    const record = attendanceRecordsByEnrollment.get(String(enrollment.id));
                    return (
                      <tr key={enrollment.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{enrollment.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{enrollment.email}</div>
                        </td>
                        <td>
                          <select 
                            className={`status-select ${record?.status || "unmarked"}`} 
                            value={record?.status || ""} 
                            onChange={(e) => onUpdateAttendance(enrollment.id, e.target.value, record?.note || "")}
                            disabled={isSaving}
                            style={{ width: "100%" }}
                          >
                            <option value="">Chưa điểm danh</option>
                            <option value="present">Có mặt (V)</option>
                            <option value="absent">Vắng mặt (X)</option>
                            <option value="late">Đi muộn (M)</option>
                            <option value="excused">Có phép (P)</option>
                          </select>
                        </td>
                        <td>
                          <input 
                            key={`${selectedAttendanceSession}-${enrollment.id}`}
                            type="text" 
                            placeholder="Ghi chú..." 
                            defaultValue={record?.note || ""} 
                            onBlur={(e) => { 
                              if (e.target.value !== (record?.note || "")) {
                                onUpdateAttendance(enrollment.id, record?.status || "present", e.target.value); 
                              }
                            }}
                            style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", width: "100%" }}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={4}>Chọn lớp để thực hiện điểm danh.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="summary-table">
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, zIndex: 2, background: "white", width: 50, textAlign: "center" }}>STT</th>
                  <th style={{ position: "sticky", left: 50, zIndex: 2, background: "white" }}>Học viên</th>
                  {Array.from({ length: attendanceSessionCount + 1 }, (_, i) => i).map(n => (
                    <th
                      key={n}
                      title={n === 0 ? "Buổi 0 — không tính vào điểm chuyên cần" : undefined}
                      style={{
                        textAlign: "center",
                        minWidth: "40px",
                        padding: "8px 4px",
                        color: n === 0 ? "var(--text-secondary)" : undefined,
                        fontStyle: n === 0 ? "italic" : undefined,
                      }}
                    >
                      B{n}
                    </th>
                  ))}
                  <th style={{ textAlign: "center", fontWeight: 700, background: "var(--background-secondary)" }}>Điểm CC</th>
                </tr>
              </thead>
              <tbody>
                {selectedClassEnrollments.length ? (
                  selectedClassEnrollments.map((enrollment, idx) => {
                    const studentRecords = attendanceRecords.filter(r => String(r.enrollment_id) === String(enrollment.id));
                    const score = calculateAttendanceScore(enrollment.id);

                    return (
                      <tr key={enrollment.id}>
                        <td style={{ position: "sticky", left: 0, zIndex: 1, background: "white", textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                        <td style={{ position: "sticky", left: 50, zIndex: 1, background: "white", boxShadow: "2px 0 5px rgba(0,0,0,0.05)" }}>
                          <div style={{ fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap" }}>{enrollment.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{enrollment.email}</div>
                        </td>
                        {Array.from({ length: attendanceSessionCount + 1 }, (_, i) => i).map(n => {
                          const record = studentRecords.find(r => Number(r.session_number) === n);
                          const display = getStatusDisplay(record?.status || "");
                          return (
                            <td key={n} style={{ textAlign: "center", padding: "8px 4px" }}>
                              <span
                                title={n === 0 ? `${display.title} · Buổi 0 không tính điểm` : display.title}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "white",
                                  backgroundColor: display.color,
                                  opacity: n === 0 ? 0.55 : 1,
                                }}
                              >
                                {display.label}
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "center", fontWeight: 700, background: "var(--background-secondary)" }}>
                          <span style={{ color: score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444" }}>
                            {score}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={attendanceSessionCount + 4}>Chọn lớp để xem bảng tổng hợp.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <style dangerouslySetInnerHTML={{ __html: `
        .summary-table th, .summary-table td {
          border: 1px solid var(--border);
        }
        .summary-table {
          border-collapse: collapse;
          width: 100%;
        }
      `}} />
    </section>
  );
}
