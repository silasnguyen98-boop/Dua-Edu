"use client";

import React, { useState } from "react";
import { PieChart, LineChart } from "../charts";
import { AttendanceModal } from "./AttendanceModal";
import { enrollmentStatusOptions } from "../constants";

interface ClassDashboardViewProps {
  visibleClassItems: any[];
  selectedAttendanceClassId: string | null;
  setSelectedAttendanceClassId: (id: string | null) => void;
  selectedAttendanceSession: number;
  setSelectedAttendanceSession: (num: number) => void;
  classDashboardMetrics: any;
  classDashboardMode: "session" | "overall";
  setClassDashboardMode: (mode: "session" | "overall") => void;
  attendanceSessionCount: number;
  attendanceRecords: any[];
  attendanceError: string | null;
  segmentCriteria: "attendance" | "assignment" | "project";
  setSegmentCriteria: (criteria: "attendance" | "assignment" | "project") => void;
  selectedAttendanceClass: any;
}

export function ClassDashboardView({
  visibleClassItems,
  selectedAttendanceClassId,
  setSelectedAttendanceClassId,
  selectedAttendanceSession,
  setSelectedAttendanceSession,
  classDashboardMetrics,
  classDashboardMode,
  setClassDashboardMode,
  attendanceSessionCount,
  attendanceRecords,
  attendanceError,
  segmentCriteria,
  setSegmentCriteria,
  selectedAttendanceClass,
}: ClassDashboardViewProps) {
  const [sessionDetailStatus, setSessionDetailStatus] = useState<string | null>(null);
  const segmentLabels = {
    excellent: "Xuất sắc",
    good: "Tốt",
    average: "Cần theo dõi",
    risky: "Nguy cơ",
  };
  const segmentColors = {
    excellent: "#0f766e",
    good: "#16a34a",
    average: "#f59e0b",
    risky: "#ef4444",
  };
  const segmentSource = classDashboardMetrics.attendanceSegments?.[segmentCriteria] ?? {};
  const segmentItems = Object.entries(segmentSource).map(([key, value]) => ({
    color: segmentColors[key as keyof typeof segmentColors],
    id: key,
    label: segmentLabels[key as keyof typeof segmentLabels],
    percent: classDashboardMetrics.totalStudents ? Math.round((Number(value) / classDashboardMetrics.totalStudents) * 100) : 0,
    value: Number(value),
  }));
  const getEnrollmentStatusLabel = (status: string) =>
    enrollmentStatusOptions.find((option) => option.value === status)?.label ?? status ?? "Chưa có";

  return (
    <section className="analytics-grid" aria-label="Dashboard lớp học">
      <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>
        <div className="attendance-toolbar" style={{ alignItems: "flex-end", marginBottom: "24px", gap: "16px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px", flex: 1, alignItems: "flex-end" }}>
            <label style={{ flex: "1 1 300px", maxWidth: "400px" }}>
              <span>Lớp học</span>
              <select
                onChange={(event) => {
                  setSelectedAttendanceClassId(event.target.value || null);
                  setSelectedAttendanceSession(1);
                }}
                value={selectedAttendanceClassId ?? ""}
              >
                <option value="">Chọn lớp học</option>
                {visibleClassItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.classCode} - {item.className}
                  </option>
                ))}
              </select>
            </label>

            {classDashboardMode === "session" && (
              <label style={{ width: "180px" }}>
                <span>Buổi học</span>
                <select
                  onChange={(event) => setSelectedAttendanceSession(Number(event.target.value))}
                  value={selectedAttendanceSession}
                >
                  {classDashboardMetrics.sessionRows.length > 0 ? (
                    classDashboardMetrics.sessionRows.map((row: any) => (
                      <option key={row.sessionNumber} value={row.sessionNumber}>
                        Buổi {row.sessionNumber}
                      </option>
                    ))
                  ) : (
                    <option value="">Chưa có dữ liệu</option>
                  )}
                </select>
              </label>
            )}
          </div>

          <div style={{ display: "flex", gap: "4px", background: "var(--surface-soft)", padding: "5px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
            <button
              onClick={() => setClassDashboardMode("session")}
              style={{
                padding: "10px 24px", borderRadius: "9px", border: "none", fontSize: "14px", fontWeight: 700,
                background: classDashboardMode === "session" ? "white" : "transparent",
                color: classDashboardMode === "session" ? "#4f46e5" : "var(--text-secondary)",
                boxShadow: classDashboardMode === "session" ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              Theo buổi
            </button>
            <button
              onClick={() => setClassDashboardMode("overall")}
              style={{
                padding: "10px 24px", borderRadius: "9px", border: "none", fontSize: "14px", fontWeight: 700,
                background: classDashboardMode === "overall" ? "white" : "transparent",
                color: classDashboardMode === "overall" ? "#4f46e5" : "var(--text-secondary)",
                boxShadow: classDashboardMode === "overall" ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              Toàn lớp
            </button>
          </div>
        </div>

        {attendanceError && <div className="notice error">{attendanceError}</div>}

        {selectedAttendanceClass ? (
          <>
            <p className="filter-summary">
              {selectedAttendanceClass.courseName} · {selectedAttendanceClass.teacherName} ·{" "}
              {selectedAttendanceClass.schedule} · {selectedAttendanceClass.studyTime} ·{" "}
              {classDashboardMetrics.totalStudents} học viên ghi danh
            </p>

            <div className="class-dashboard-stats">
              {(classDashboardMode === "session" ? [
                { color: "#0f766e", status: "present", label: "Có mặt", value: classDashboardMetrics.selectedSession.present },
                { color: "#b91c1c", status: "absent", label: "Vắng", value: classDashboardMetrics.selectedSession.absent },
                { color: "#b45309", status: "late", label: "Đi muộn", value: classDashboardMetrics.selectedSession.late },
                { color: "#0369a1", status: "excused", label: "Có phép", value: classDashboardMetrics.selectedSession.excused },
                { color: "#64748b", status: "unmarked", label: "Chưa điểm danh", value: classDashboardMetrics.selectedSession.unmarked },
              ] : [
                { color: "#0f766e", status: null, label: "Tổng lượt có mặt", value: classDashboardMetrics.statusCounts.present },
                { color: "#b91c1c", status: null, label: "Tổng lượt vắng", value: classDashboardMetrics.statusCounts.absent },
                { color: "#b45309", status: null, label: "Tổng lượt muộn", value: classDashboardMetrics.statusCounts.late },
                { color: "#0369a1", status: null, label: "Tổng lượt phép", value: classDashboardMetrics.statusCounts.excused },
              ]).map((item) => (
                <article className="class-dashboard-stat" key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span>{item.label}</span>
                    {classDashboardMode === "session" && item.value > 0 && (
                      <button 
                        onClick={() => setSessionDetailStatus(sessionDetailStatus === item.status ? null : item.status)}
                        style={{ 
                          background: "none", border: "none", color: "#6366f1", fontSize: "11px", fontWeight: 700, 
                          cursor: "pointer", padding: "2px 6px", borderRadius: "4px", background: "#f5f3ff" 
                        }}
                      >
                        {sessionDetailStatus === item.status ? "Đóng" : "Chi tiết"}
                      </button>
                    )}
                  </div>
                  <strong style={{ color: item.color }}>{item.value}</strong>
                  <small>
                    {classDashboardMetrics.totalStudents
                      ? `${Math.round((item.value / classDashboardMetrics.totalStudents) * 100)}% sĩ số`
                      : "0% sĩ số"}
                  </small>
                </article>
              ))}
            </div>

            {classDashboardMode === "session" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "24px" }}>
                <article className="class-dashboard-panel">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Hiệu suất</p>
                      <h3>So sánh trung bình</h3>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px" }}>
                    <div style={{ 
                      width: "80px", height: "80px", borderRadius: "50%", border: "6px solid #f1f5f9", 
                      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
                    }}>
                      <strong style={{ fontSize: "20px", color: "var(--foreground)" }}>{classDashboardMetrics.selectedSession.attendanceRate}%</strong>
                      <small style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Buổi này</small>
                    </div>
                    <div>
                      {(() => {
                        const diff = classDashboardMetrics.selectedSession.attendanceRate - classDashboardMetrics.classAverageRate;
                        const isPositive = diff >= 0;
                        return (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isPositive ? "#059669" : "#dc2626", fontWeight: 700, fontSize: "16px" }}>
                              {isPositive ? "↑" : "↓"} {Math.abs(diff)}% 
                              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>so với trung bình ({classDashboardMetrics.classAverageRate}%)</span>
                            </div>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                              {isPositive ? "Buổi học có tỉ lệ tham gia tốt hơn thường lệ." : "Tỉ lệ tham gia đang thấp hơn mức kỳ vọng."}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </article>

                <article className="class-dashboard-panel">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Xu hướng</p>
                      <h3>3 buổi gần nhất</h3>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "100px", marginTop: "16px", padding: "0 10px" }}>
                    {(() => {
                      const current = selectedAttendanceSession;
                      const range = [current - 1, current, current + 1].filter(n => 
                        n >= 1 && n <= attendanceSessionCount
                      );
                      
                      return range.map((n) => {
                        const r = classDashboardMetrics.sessionRows.find((sr: any) => sr.sessionNumber === n);
                        if (!r) return null;
                        
                        return (
                          <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <div style={{ 
                              width: "100%", 
                              background: n === current ? "#6366f1" : "#e2e8f0",
                              height: `${r.attendanceRate}%`,
                              minHeight: "4px",
                              borderRadius: "4px 4px 0 0",
                              position: "relative",
                              transition: "all 0.3s ease"
                            }}>
                              <span style={{ 
                                position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)",
                                fontSize: "10px", fontWeight: 700, color: n === current ? "#6366f1" : "var(--text-secondary)"
                              }}>
                                {r.attendanceRate}%
                              </span>
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-secondary)" }}>B.{n}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </article>

                <article className="class-dashboard-panel">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Thống kê</p>
                      <h3>Cơ cấu buổi {selectedAttendanceSession}</h3>
                    </div>
                  </div>
                  <PieChart 
                    emptyText="Chưa có dữ liệu" 
                    centerValue={selectedAttendanceSession}
                    centerLabel="Buổi"
                    items={[
                      { id: "present", label: "Có mặt", value: classDashboardMetrics.selectedSession.present, percent: Math.round((classDashboardMetrics.selectedSession.present / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#0f766e" },
                      { id: "late", label: "Đi muộn", value: classDashboardMetrics.selectedSession.late, percent: Math.round((classDashboardMetrics.selectedSession.late / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#b45309" },
                      { id: "absent", label: "Vắng", value: classDashboardMetrics.selectedSession.absent, percent: Math.round((classDashboardMetrics.selectedSession.absent / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#b91c1c" },
                      { id: "excused", label: "Có phép", value: classDashboardMetrics.selectedSession.excused, percent: Math.round((classDashboardMetrics.selectedSession.excused / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#0369a1" },
                      { id: "unmarked", label: "Chưa điểm danh", value: classDashboardMetrics.selectedSession.unmarked, percent: Math.round((classDashboardMetrics.selectedSession.unmarked / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#64748b" },
                    ]} 
                  />
                </article>

                {classDashboardMetrics.chronicAbsenteesInSession.length > 0 && (
                  <article className="class-dashboard-panel" style={{ borderLeft: "4px solid #f59e0b", background: "#fffbeb" }}>
                    <div className="section-heading compact">
                      <div>
                        <p className="eyebrow" style={{ color: "#d97706" }}>Lưu ý đặc biệt</p>
                        <h3>Học viên vắng/muộn có hệ thống</h3>
                      </div>
                    </div>
                    <div className="class-table" style={{ maxHeight: "200px", overflowY: "auto", marginTop: "12px" }}>
                      <table style={{ background: "transparent" }}>
                        <tbody>
                          {classDashboardMetrics.chronicAbsenteesInSession.map((s: any) => (
                            <tr key={s.id}>
                              <td style={{ padding: "8px 0" }}>
                                <div style={{ fontWeight: 600, fontSize: "13px" }}>{s.name}</div>
                                <div style={{ fontSize: "11px", color: "#d97706", fontWeight: 500 }}>
                                  Đã vắng/muộn {s.badCount} lần trước đó
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                )}

                <AttendanceModal
                  status={sessionDetailStatus}
                  selectedClass={selectedAttendanceClass}
                  attendanceRecords={attendanceRecords}
                  sessionNumber={selectedAttendanceSession}
                  onClose={() => setSessionDetailStatus(null)}
                />
              </div>
            )}

            {classDashboardMode === "overall" && (
              <div className="class-dashboard-grid">
                <article className="class-dashboard-panel">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Xu hướng</p>
                      <h3>Tỉ lệ tham gia theo buổi</h3>
                    </div>
                  </div>
                  <div className="session-growth-chart">
                    <LineChart items={classDashboardMetrics.sessionRows.map((r: any) => ({ label: `B${r.sessionNumber}`, value: r.attendanceRate }))} />
                  </div>
                </article>

                <article className="class-dashboard-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "10px" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>Phân tích</p>
                      <h3 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Phân loại học viên</h3>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <select 
                        value={segmentCriteria} 
                        onChange={(e) => setSegmentCriteria(e.target.value as any)}
                        style={{ 
                          padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", 
                          fontSize: "13px", fontWeight: 600, background: "white", cursor: "pointer",
                          outline: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", width: "160px"
                        }}
                      >
                        <option value="attendance">Theo chuyên cần</option>
                        <option value="assignment">Theo bài tập</option>
                        <option value="project">Theo đồ án</option>
                      </select>
                    </div>
                  </div>
                  <PieChart emptyText="Chưa có dữ liệu" items={segmentItems} />
                </article>

                <article className="class-dashboard-panel wide">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Theo dõi</p>
                      <h3>Tình trạng học viên</h3>
                    </div>
                  </div>
                  <div className="class-table" style={{ marginTop: "16px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Học viên</th>
                          <th>Email</th>
                          <th>Trạng thái</th>
                          <th>Chuyên cần</th>
                          <th>Tham gia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classDashboardMetrics.studentRows.length ? (
                          classDashboardMetrics.studentRows.map((student: any) => (
                            <tr key={student.id}>
                              <td>{student.name}</td>
                              <td>{student.email}</td>
                              <td>
                                <span className="student-status-badge">
                                  {getEnrollmentStatusLabel(student.status)}
                                </span>
                              </td>
                              <td>
                                <span className={`student-attendance-note ${student.noteTone}`}>
                                  {student.note}
                                </span>
                              </td>
                              <td>{student.attendedCount}/{Math.max(classDashboardMetrics.sessionRows.filter((row: any) => row.isMarked).length, 1)} buổi</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5}>Chưa có học viên trong lớp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                {classDashboardMetrics.atRiskStudents.length > 0 && (
                  <article className="class-dashboard-panel wide" style={{ borderLeft: "4px solid #ef4444" }}>
                    <div className="section-heading compact">
                      <div>
                        <p className="eyebrow" style={{ color: "#dc2626" }}>Cảnh báo</p>
                        <h3>Học viên có nguy cơ không đạt ({classDashboardMetrics.atRiskStudents.length})</h3>
                      </div>
                    </div>
                    <div className="class-table" style={{ marginTop: "16px" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Học viên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Tỉ lệ CC</th>
                            <th>Vắng/Muộn</th>
                            <th>Điểm BT</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDashboardMetrics.atRiskStudents.map((s: any) => (
                            <tr key={s.id}>
                              <td>{s.name}</td>
                              <td>{s.email}</td>
                              <td>{s.phone}</td>
                              <td><strong style={{ color: s.attendanceRate < 50 ? "#dc2626" : "inherit" }}>{s.attendanceRate}%</strong></td>
                              <td>{s.absentCount}v / {s.lateCount}m</td>
                              <td>{s.assignmentScore}</td>
                              <td><span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{s.reason}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="notice info">Chọn một lớp học để xem dashboard chi tiết.</div>
        )}
      </article>
    </section>
  );
}
