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
  onUpdateAttendance: (enrollmentId: string, status: string) => void;
  onRefresh: () => void;
  attendanceSessionCount: number;
  attendanceError: string | null;
  attendanceMode: "session" | "summary";
  setAttendanceMode: (mode: "session" | "summary") => void;
  attendanceRecords: any[];
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

  // Calculate score: (Present=1, Excused=1, Late=0.5, Absent=0)
  const calculateAttendanceScore = (enrollmentId: string) => {
    const studentRecords = attendanceRecords.filter(r => String(r.enrollment_id) === String(enrollmentId));
    if (attendanceSessionCount === 0) return 0;
    
    let totalPoints = 0;
    studentRecords.forEach(r => {
      if (r.status === "present" || r.status === "excused") totalPoints += 1;
      else if (r.status === "late") totalPoints += 0.5;
    });
    
    return Number(((totalPoints / attendanceSessionCount) * 10).toFixed(1));
  };

  return (
    <section className="analytics-grid" aria-label="Giao diện điểm danh">
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div className="attendance-toolbar" style={{ marginBottom: "24px", gap: "16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "16px", flex: "1", minWidth: "300px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ flex: "1 1 240px", maxWidth: "350px" }}>
              <span>Lớp học</span>
              <select onChange={(e) => { setSelectedAttendanceClassId(e.target.value || null); setSelectedAttendanceSession(1); }} value={selectedAttendanceClassId ?? ""}>
                <option value="">Chọn lớp học</option>
                {visibleClassItems.map(item => <option key={item.id} value={item.id}>{item.classCode} - {item.className}</option>)}
              </select>
            </label>

            <div style={{ display: "flex", gap: "12px", background: "var(--background-secondary)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "4px" }}>
              <button 
                onClick={() => setAttendanceMode("session")}
                style={{ 
                  padding: "6px 16px", 
                  borderRadius: "7px", 
                  border: "none", 
                  fontSize: "13px",
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
                  padding: "6px 16px", 
                  borderRadius: "7px", 
                  border: "none", 
                  fontSize: "13px",
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

            {attendanceMode === "session" && (
              <label style={{ width: "140px" }}>
                <span>Buổi học</span>
                <select onChange={(e) => setSelectedAttendanceSession(Number(e.target.value))} value={selectedAttendanceSession}>
                  {Array.from({ length: attendanceSessionCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>Buổi {n}</option>)}
                </select>
              </label>
            )}
          </div>
          <button className="secondary-button" onClick={onRefresh} type="button">Làm mới dữ liệu</button>
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
                            onChange={(e) => onUpdateAttendance(enrollment.id, e.target.value)}
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
                            type="text" 
                            placeholder="Ghi chú..." 
                            defaultValue={record?.note || ""} 
                            onBlur={(e) => { if (e.target.value !== (record?.note || "")) onUpdateAttendance(enrollment.id, record?.status || ""); }}
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
                  <th style={{ position: "sticky", left: 0, zIndex: 2, background: "white" }}>Học viên</th>
                  {Array.from({ length: attendanceSessionCount }, (_, i) => i + 1).map(n => (
                    <th key={n} style={{ textAlign: "center", minWidth: "40px", padding: "8px 4px" }}>B{n}</th>
                  ))}
                  <th style={{ textAlign: "center", fontWeight: 700, background: "var(--background-secondary)" }}>Điểm CC</th>
                </tr>
              </thead>
              <tbody>
                {selectedClassEnrollments.length ? (
                  selectedClassEnrollments.map((enrollment) => {
                    const studentRecords = attendanceRecords.filter(r => String(r.enrollment_id) === String(enrollment.id));
                    const score = calculateAttendanceScore(enrollment.id);
                    
                    return (
                      <tr key={enrollment.id}>
                        <td style={{ position: "sticky", left: 0, zIndex: 1, background: "white", boxShadow: "2px 0 5px rgba(0,0,0,0.05)" }}>
                          <div style={{ fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap" }}>{enrollment.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{enrollment.email}</div>
                        </td>
                        {Array.from({ length: attendanceSessionCount }, (_, i) => i + 1).map(n => {
                          const record = studentRecords.find(r => Number(r.session_number) === n);
                          const display = getStatusDisplay(record?.status || "");
                          return (
                            <td key={n} style={{ textAlign: "center", padding: "8px 4px" }}>
                              <span 
                                title={display.title}
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
                                  backgroundColor: display.color
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
                  <tr><td colSpan={attendanceSessionCount + 2}>Chọn lớp để xem bảng tổng hợp.</td></tr>
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
