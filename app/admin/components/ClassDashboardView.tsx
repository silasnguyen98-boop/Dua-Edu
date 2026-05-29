"use client";

import React, { useEffect, useState } from "react";
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
  onViewChange?: (view: any) => void;
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
  onViewChange,
}: ClassDashboardViewProps) {
  const [sessionDetailStatus, setSessionDetailStatus] = useState<string | null>(null);
  const [submissionChartType, setSubmissionChartType] = useState<"assignment" | "project">("assignment");
  const [certificateDetailType, setCertificateDetailType] = useState<"participation" | "completion" | "atRisk" | null>(null);
  const [studentStatusPageSize, setStudentStatusPageSize] = useState(20);
  const [studentStatusPage, setStudentStatusPage] = useState(1);
  const [trendMetric, setTrendMetric] = useState<"present" | "absent" | "late" | "excused">("present");
  const [perfMetric, setPerfMetric] = useState<"present" | "absent" | "late" | "excused">("present");
  const [topCriteria, setTopCriteria] = useState<"attendance" | "assignment" | "project" | "overall">("overall");
  const [topOrder, setTopOrder] = useState<"desc" | "asc">("desc");

  // Nếu buổi đang chọn không có data (không nằm trong sessionRows), tự chuyển
  // sang buổi đầu tiên có data để hiển thị metric đúng (vd: lớp chỉ có buổi 0).
  useEffect(() => {
    const rows = classDashboardMetrics.sessionRows ?? [];
    if (!rows.length) return;
    const exists = rows.some((row: any) => Number(row.sessionNumber) === Number(selectedAttendanceSession));
    if (!exists) setSelectedAttendanceSession(Number(rows[0].sessionNumber));
  }, [classDashboardMetrics.sessionRows, selectedAttendanceSession, setSelectedAttendanceSession]);
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
  const submissionSummary = classDashboardMetrics.submissionSummary?.[submissionChartType] ?? { submitted: 0, missing: 0, total: 0 };
  const submissionItems = [
    {
      id: "submitted",
      label: submissionChartType === "assignment" ? "Đã nộp bài tập" : "Đã nộp đồ án",
      value: submissionSummary.submitted,
      percent: submissionSummary.total ? Math.round((submissionSummary.submitted / submissionSummary.total) * 100) : 0,
      color: "#0f766e",
    },
    {
      id: "missing",
      label: "Chưa nộp",
      value: submissionSummary.missing,
      percent: submissionSummary.total ? Math.round((submissionSummary.missing / submissionSummary.total) * 100) : 0,
      color: "#f59e0b",
    },
  ];
  const certificateSummary = classDashboardMetrics.certificateSummary ?? { participation: 0, completion: 0, none: 0 };
  const certificateItems = [
    {
      id: "completion",
      label: "Hoàn thành",
      value: certificateSummary.completion,
      percent: classDashboardMetrics.totalStudents ? Math.round((certificateSummary.completion / classDashboardMetrics.totalStudents) * 100) : 0,
      color: "#0f766e",
    },
    {
      id: "participation",
      label: "Tham gia",
      value: certificateSummary.participation,
      percent: classDashboardMetrics.totalStudents ? Math.round((certificateSummary.participation / classDashboardMetrics.totalStudents) * 100) : 0,
      color: "#f59e0b",
    },
    {
      id: "none",
      label: "Chưa đủ điều kiện",
      value: certificateSummary.none,
      percent: classDashboardMetrics.totalStudents ? Math.round((certificateSummary.none / classDashboardMetrics.totalStudents) * 100) : 0,
      color: "#cbd5e1",
    },
  ];
  const certificateDetailRows = (() => {
    if (!certificateDetailType) return [];
    if (certificateDetailType === "atRisk") return classDashboardMetrics.atRiskStudents ?? [];
    return classDashboardMetrics.eligibleCertificateStudents?.[certificateDetailType] ?? [];
  })();
  const studentStatusRows = classDashboardMetrics.studentRows ?? [];
  const studentStatusTotalPages = Math.max(Math.ceil(studentStatusRows.length / studentStatusPageSize), 1);
  const paginatedStudentStatusRows = studentStatusRows.slice(
    (studentStatusPage - 1) * studentStatusPageSize,
    studentStatusPage * studentStatusPageSize,
  );

  const topStudentsRows = [...studentStatusRows].sort((a, b) => {
    const getVal = (row: any, criteria: typeof topCriteria) => {
      switch(criteria) {
        case "attendance": return Number(row.attendanceScore || 0);
        case "assignment": return Number(row.assignmentScore || 0);
        case "project": return Number(row.projectScore || 0);
        case "overall": return Number(row.finalScore || 0);
        default: return 0;
      }
    };
    const valA = getVal(a, topCriteria);
    const valB = getVal(b, topCriteria);
    return topOrder === "desc" ? valB - valA : valA - valB;
  }).slice(0, 10);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const attendanceModeItems = [
    {
      key: "session" as const,
      title: "Theo buổi",
      subtitle: "Chấm từng session",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="4" />
          <path d="M3 10h18" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        </svg>
      ),
    },
    {
      key: "overall" as const,
      title: "Tổng hợp",
      subtitle: "Xem toàn lớp",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 19V5" />
          <path d="M9 19V10" />
          <path d="M14 19V13" />
          <path d="M19 19V7" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    setStudentStatusPage(1);
  }, [selectedAttendanceClassId, studentStatusPageSize]);

  useEffect(() => {
    setStudentStatusPage((page) => Math.min(page, studentStatusTotalPages));
  }, [studentStatusTotalPages]);

  return (
    <section className="analytics-grid" aria-label="Dashboard lớp học">
      <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>
        <div className="attendance-toolbar" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-end", 
          marginBottom: "24px", 
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", gap: "12px", flex: 1, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 300px", maxWidth: "350px" }}>
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
              <label style={{ width: "160px" }}>
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

            <button 
              onClick={() => setShowGuideModal(true)}
              style={{ 
                display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", 
                borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", 
                color: "#64748b", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                height: "42px", transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#4f46e5";
                e.currentTarget.style.borderColor = "#c7d2fe";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Hướng dẫn
            </button>
          </div>

          <div style={{ 
            display: "flex", 
            background: "#f1f5f9", 
            padding: "4px", 
            borderRadius: "12px", 
            gap: "4px" 
          }}>
            {attendanceModeItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setClassDashboardMode(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: classDashboardMode === item.key ? "white" : "transparent",
                  color: classDashboardMode === item.key ? "#4f46e5" : "#64748b",
                  boxShadow: classDashboardMode === item.key ? "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)" : "none"
                }}
                type="button"
                role="tab"
                aria-selected={classDashboardMode === item.key}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {attendanceError && <div className="notice error">{attendanceError}</div>}

        {selectedAttendanceClass ? (
          <>
            <div style={{ 
              display: "flex", 
              gap: "10px", 
              marginTop: "0px", 
              marginBottom: "28px", 
              flexWrap: "wrap",
              padding: "16px",
              background: "rgba(248, 250, 252, 0.5)",
              borderRadius: "16px",
              border: "1px solid #f1f5f9"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, color: "#1e293b", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                📖 {selectedAttendanceClass.courseName}
              </div>
              {selectedAttendanceClass.teacherName && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "#475569", border: "1px solid #e2e8f0" }}>
                  👤 {selectedAttendanceClass.teacherName}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "#475569", border: "1px solid #e2e8f0" }}>
                🕒 {selectedAttendanceClass.schedule} · {selectedAttendanceClass.studyTime}
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                background: "#e0f2fe", 
                padding: "8px 20px", 
                borderRadius: "12px", 
                fontSize: "14px", 
                fontWeight: 800, 
                color: "#0369a1", 
                border: "1px solid #bae6fd",
                boxShadow: "0 4px 6px -1px rgba(3, 105, 161, 0.1), 0 2px 4px -2px rgba(3, 105, 161, 0.1)"
              }}>
                👥 {classDashboardMetrics.totalStudents} học viên ghi danh {classDashboardMetrics.droppedCount > 0 && `(${classDashboardMetrics.droppedCount} đã bỏ)`}
              </div>
            </div>

            <div className="class-dashboard-stats">
              {(classDashboardMode === "session" ? [
                { color: "#0f766e", status: "present", type: null, label: "Tham gia", value: classDashboardMetrics.selectedSession.present, rawValue: classDashboardMetrics.selectedSession.present },
                { color: "#b91c1c", status: "absent", type: null, label: "Vắng", value: classDashboardMetrics.selectedSession.absent, rawValue: classDashboardMetrics.selectedSession.absent },
                { color: "#b45309", status: "late", type: null, label: "Đi muộn", value: classDashboardMetrics.selectedSession.late, rawValue: classDashboardMetrics.selectedSession.late },
                { color: "#0369a1", status: "excused", type: null, label: "Có phép", value: classDashboardMetrics.selectedSession.excused, rawValue: classDashboardMetrics.selectedSession.excused },
                { color: "#64748b", status: "unmarked", type: null, label: "Chưa điểm danh", value: classDashboardMetrics.selectedSession.unmarked, rawValue: classDashboardMetrics.selectedSession.unmarked },
              ] : [
                { color: "#0f766e", status: null, type: null, label: "Tỉ lệ chuyên cần (TB)", value: `${classDashboardMetrics.classAverages.rate}%`, rawValue: classDashboardMetrics.classAverages.rate },
                ...(classDashboardMetrics.totalMarkedSessions < (selectedAttendanceClass.totalSessions || 0) ? [
                  { color: "#b91c1c", status: null, type: "atRisk", label: "Học viên nguy cơ", value: `${classDashboardMetrics.atRiskStudents.length} bạn`, rawValue: classDashboardMetrics.atRiskStudents.length }
                ] : []),
                { color: "#b45309", status: null, type: null, label: "Tỉ lệ nộp bài tập", value: `${classDashboardMetrics.assignmentRate}%`, rawValue: classDashboardMetrics.assignmentRate },
                { color: "#7c3aed", status: null, type: null, label: "Tỉ lệ nộp đồ án", value: `${classDashboardMetrics.projectRate}%`, rawValue: classDashboardMetrics.projectRate },
                { color: "#0369a1", status: null, type: "certificate", label: "Đủ ĐK chứng chỉ", value: `${Math.round(((classDashboardMetrics.certificateSummary.completion + classDashboardMetrics.certificateSummary.participation) / (classDashboardMetrics.totalStudents || 1)) * 100)}%`, rawValue: (classDashboardMetrics.certificateSummary.completion + classDashboardMetrics.certificateSummary.participation) },
              ]).map((item) => (
                <article className="class-dashboard-stat" key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span>{item.label}</span>
                    {/* Session Mode Button */}
                    {classDashboardMode === "session" && item.status && item.value > 0 && (
                      <button 
                        onClick={() => setSessionDetailStatus(sessionDetailStatus === item.status ? null : item.status)}
                        style={{ 
                          border: "none", color: "#6366f1", fontSize: "11px", fontWeight: 700, 
                          cursor: "pointer", padding: "2px 6px", borderRadius: "4px", background: "#f5f3ff" 
                        }}
                      >
                        {sessionDetailStatus === item.status ? "Đóng" : "Chi tiết"}
                      </button>
                    )}
                    {/* Overall Mode Button */}
                    {classDashboardMode === "overall" && item.type && (item.rawValue || 0) > 0 && (
                      <button 
                        onClick={() => {
                          if (item.type === "atRisk") {
                            // Logic to show At-risk students
                            // We can use the existing certificateDetailType or a new one
                            setCertificateDetailType(certificateDetailType === "atRisk" ? null : "atRisk");
                          } else if (item.type === "certificate") {
                            setCertificateDetailType(certificateDetailType === "completion" ? null : "completion");
                          }
                        }}
                        style={{ 
                          border: "none", color: "#6366f1", fontSize: "11px", fontWeight: 700, 
                          cursor: "pointer", padding: "2px 6px", borderRadius: "4px", background: "#f5f3ff" 
                        }}
                      >
                        {((item.type === "atRisk" && certificateDetailType === "atRisk") || 
                          (item.type === "certificate" && (certificateDetailType === "completion" || certificateDetailType === "participation"))) 
                          ? "Đóng" : "Chi tiết"}
                      </button>
                    )}
                  </div>
                  <strong style={{ color: item.color }}>{item.value}</strong>
                  {classDashboardMode === "session" && (
                    <small>
                      {classDashboardMetrics.totalStudents
                        ? `${Math.round((Number(item.value) / classDashboardMetrics.totalStudents) * 100)}% sĩ số`
                        : "0% sĩ số"}
                    </small>
                  )}
                </article>
              ))}
            </div>

            {classDashboardMode === "session" && (
              <>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(max(450px, 48%), 1fr))", 
                  gap: "20px", 
                  marginTop: "16px" 
                }}>
                <article className="class-dashboard-panel" style={{ padding: "20px", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "-10px", right: "-10px", opacity: 0.03, pointerEvents: "none" }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
                  </div>
                  <div className="section-heading compact" style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p className="eyebrow" style={{ fontSize: "10px", color: "#6366f1", fontWeight: 700 }}>Hiệu suất</p>
                      <h3 style={{ fontSize: "16px", fontWeight: 800 }}>So sánh trung bình</h3>
                    </div>
                    <select 
                      value={perfMetric} 
                      onChange={(e) => setPerfMetric(e.target.value as any)}
                      style={{ 
                        padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", 
                        fontSize: "12px", fontWeight: 600, background: "white", cursor: "pointer",
                        outline: "none", color: "#475569", width: "100px"
                      }}
                    >
                      <option value="present">Tham gia</option>
                      <option value="absent">Vắng</option>
                      <option value="late">Đi muộn</option>
                      <option value="excused">Có phép</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "28px", marginTop: "auto", marginBottom: "auto" }}>
                    <div style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
                      {(() => {
                        const current = classDashboardMetrics.selectedSession[perfMetric] || 0;
                        const total = classDashboardMetrics.totalStudents || 1;
                        const rate = Math.round((current / total) * 100);
                        const metricColors = { 
                          present: { primary: "#6366f1", light: "#8b5cf6", shadow: "rgba(99, 102, 241, 0.4)" }, 
                          absent: { primary: "#ef4444", light: "#f87171", shadow: "rgba(239, 68, 68, 0.4)" }, 
                          late: { primary: "#f59e0b", light: "#fbbf24", shadow: "rgba(245, 158, 11, 0.4)" }, 
                          excused: { primary: "#3b82f6", light: "#60a5fa", shadow: "rgba(59, 130, 246, 0.4)" } 
                        };
                        const colors = metricColors[perfMetric];
                        
                        return (
                          <>
                            <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 4px ${colors.shadow})` }}>
                              <defs>
                                <linearGradient id={`grad-${perfMetric}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor={colors.primary} />
                                  <stop offset="100%" stopColor={colors.light} />
                                </linearGradient>
                              </defs>
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                              <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#grad-${perfMetric})`} strokeWidth="10" 
                                strokeDasharray={`${(rate / 100) * 264} 264`}
                                strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                              {rate > 0 && (
                                <circle 
                                  cx={50 + 42 * Math.cos(((rate / 100) * 360 - 90) * Math.PI / 180)}
                                  cy={50 + 42 * Math.sin(((rate / 100) * 360 - 90) * Math.PI / 180)}
                                  r="5" fill="white" stroke={colors.primary} strokeWidth="2"
                                />
                              )}
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                              <strong style={{ fontSize: "24px", color: "#1e293b", fontWeight: 900, letterSpacing: "-0.5px" }}>{current}</strong>
                              <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>bạn</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div style={{ flex: 1 }}>
                      {(() => {
                        const current = classDashboardMetrics.selectedSession[perfMetric] || 0;
                        const average = classDashboardMetrics.classAverages?.[perfMetric] || 0;
                        const diff = current - average;
                        const isPositive = diff > 0;
                        const isNeutral = diff === 0;
                        const isGood = perfMetric === "present" ? isPositive : !isPositive;
                        const statusColor = isNeutral ? "#64748b" : isGood ? "#10b981" : "#ef4444";
                        const metricName = perfMetric === "present" ? "tham gia" : perfMetric === "absent" ? "vắng" : perfMetric === "late" ? "đi muộn" : "có phép";

                        return (
                          <div style={{ 
                            background: "rgba(255,255,255,0.7)", 
                            backdropFilter: "blur(8px)",
                            padding: "16px", 
                            borderRadius: "16px", 
                            border: `1px solid ${isNeutral ? "rgba(226, 232, 240, 0.8)" : isGood ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                            position: "relative"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <div style={{ fontSize: "18px", color: statusColor, fontWeight: 900 }}>
                                {current} học viên {metricName}
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.6, fontWeight: 500 }}>
                              {isNeutral ? 
                                <>Đạt đúng mức trung bình của lớp (<strong>{average}</strong> bạn).</> : 
                                <><strong>{isGood ? "Tốt!" : "Chú ý!"}</strong> {isPositive ? "Tăng" : "Giảm"} <strong>{Math.abs(diff)}</strong> bạn so với mức trung bình (<strong>{average}</strong>).</>
                              }
                            </p>
                            <div style={{ 
                              marginTop: "8px", 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "4px", 
                              padding: "2px 8px", 
                              borderRadius: "6px", 
                              background: isNeutral ? "#f1f5f9" : isGood ? "#f0fdf4" : "#fef2f2",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: statusColor
                            }}>
                              {isNeutral ? "● ỔN ĐỊNH" : isGood ? "⭐ HIỆU QUẢ" : "⚠️ CẢNH BÁO"}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </article>

                <article className="class-dashboard-panel" style={{ padding: "20px", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}>
                  <div className="section-heading compact" style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p className="eyebrow" style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>Phân tích buổi</p>
                      <h3 style={{ fontSize: "16px", fontWeight: 800 }}>
                        {(() => {
                          const current = selectedAttendanceSession;
                          const markedAsc = (classDashboardMetrics.sessionRows ?? [])
                            .filter((s: any) => s.isMarked && s.sessionNumber <= current)
                            .map((s: any) => s.sessionNumber)
                            .sort((a: number, b: number) => a - b);
                          const range = markedAsc.slice(-3);
                          if (range.length === 0) return "Chưa có buổi nào đã điểm danh";
                          if (range.length === 1) return `Buổi ${range[0]} (mới điểm danh)`;
                          return `So sánh ${range.length} buổi gần nhất đã điểm danh (B.${range[0]} - B.${range[range.length - 1]})`;
                        })()}
                      </h3>
                    </div>
                    <select 
                      value={trendMetric} 
                      onChange={(e) => setTrendMetric(e.target.value as any)}
                      style={{ 
                        padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", 
                        fontSize: "12px", fontWeight: 600, background: "white", cursor: "pointer",
                        outline: "none", color: "#475569", width: "100px"
                      }}
                    >
                      <option value="present">Tham gia</option>
                      <option value="absent">Vắng</option>
                      <option value="late">Đi muộn</option>
                      <option value="excused">Có phép</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", height: "110px", marginTop: "auto", marginBottom: "auto", padding: "0 10px", position: "relative" }}>
                    {/* Background Grid Lines */}
                    <div style={{ position: "absolute", inset: "0 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none", opacity: 0.1 }}>
                      <div style={{ borderBottom: "1px solid #64748b", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #64748b", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #64748b", width: "100%" }}></div>
                    </div>
                    
                    {(() => {
                      const current = selectedAttendanceSession;
                      // Lấy 3 buổi đã điểm danh gần nhất (≤ current), bắt đầu từ buổi 0.
                      const markedAsc = (classDashboardMetrics.sessionRows ?? [])
                        .filter((s: any) => s.isMarked && s.sessionNumber <= current)
                        .map((s: any) => s.sessionNumber)
                        .sort((a: number, b: number) => a - b);
                      const range: number[] = markedAsc.slice(-3);

                      const metrics = [
                        { key: "present", color: "#10b981" },
                        { key: "absent", color: "#ef4444" },
                        { key: "late", color: "#f59e0b" },
                        { key: "excused", color: "#3b82f6" },
                      ];

                      return range.map((n, idx) => {
                        const r = classDashboardMetrics.sessionRows.find((sr: any) => sr.sessionNumber === n);
                        const isCurrent = n === current;
                        
                        // Calculate difference for the badge to be placed AFTER this bar (comparing n with n+1)
                        const nextN = range[idx + 1];
                        let nextDiff = null;
                        if (nextN) {
                          const nextData = classDashboardMetrics.sessionRows.find((sr: any) => sr.sessionNumber === nextN);
                          if (r && nextData) {
                            nextDiff = (nextData[trendMetric] || 0) - (r[trendMetric] || 0);
                          }
                        }

                        return (
                          <React.Fragment key={n}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", zIndex: 1 }}>
                              <div style={{ 
                                display: "flex", 
                                alignItems: "flex-end", 
                                gap: "2px", 
                                height: "80px", 
                                width: "100%",
                                justifyContent: "center",
                                background: isCurrent ? "rgba(99, 102, 241, 0.05)" : "transparent",
                                borderRadius: "8px",
                                padding: "4px",
                                position: "relative"
                              }}>
                                {metrics.map((m) => {
                                  const val = r ? r[m.key] || 0 : 0;
                                  const h = (val / (classDashboardMetrics.totalStudents || 1)) * 100;
                                  const isSelected = trendMetric === m.key;
                                  
                                  return (
                                    <div 
                                      key={m.key}
                                      style={{ 
                                        width: "18%",
                                        background: m.color,
                                        height: `${Math.max(h, 4)}%`,
                                        borderRadius: "2px 2px 0 0",
                                        opacity: isSelected ? 1 : 0.4,
                                        transition: "all 0.3s ease",
                                        position: "relative"
                                      }}
                                    >
                                      {isSelected && val > 0 && (
                                        <div style={{ 
                                          position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)",
                                          fontSize: "9px", fontWeight: 800, color: m.color, whiteSpace: "nowrap"
                                        }}>
                                          {val}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: isCurrent ? "#1e293b" : "#94a3b8" }}>B.{n}</span>
                            </div>

                            {/* Diff Badge placed in the gap */}
                            {nextDiff !== null && (
                              <div style={{ 
                                width: "0", 
                                position: "relative", 
                                height: "80px", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center" 
                              }}>
                                <div style={{ 
                                  position: "absolute",
                                  top: "20px",
                                  fontSize: "10px", 
                                  fontWeight: 800, 
                                  whiteSpace: "nowrap",
                                  color: nextDiff > 0 ? "#10b981" : nextDiff < 0 ? "#ef4444" : "#94a3b8",
                                  background: "white",
                                  padding: "1px 4px", 
                                  borderRadius: "4px",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                  zIndex: 10,
                                  border: "1px solid rgba(0,0,0,0.05)"
                                }}>
                                  {nextDiff > 0 ? "→ ↑" : nextDiff < 0 ? "→ ↓" : "→"} {Math.abs(nextDiff)}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>

                  {/* Chart Legend */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    gap: "12px", 
                    marginTop: "12px", 
                    paddingTop: "8px", 
                    borderTop: "1px solid rgba(0,0,0,0.05)" 
                  }}>
                    {[
                      { label: "Tham gia", color: "#10b981" },
                      { label: "Vắng", color: "#ef4444" },
                      { label: "Muộn", color: "#f59e0b" },
                      { label: "Phép", color: "#3b82f6" },
                    ].map((m) => (
                      <div key={m.label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 600, color: "#64748b" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: m.color }}></span>
                        {m.label}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="class-dashboard-panel" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow" style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>Thống kê</p>
                      <h3 style={{ fontSize: "15px", fontWeight: 800 }}>Tỉ lệ tham gia Buổi {selectedAttendanceSession}</h3>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", marginBottom: "auto", transform: "scale(0.9)" }}>
                    <PieChart 
                      emptyText="Chưa có" 
                      centerValue={String(selectedAttendanceSession)}
                      centerLabel={`BUỔI`}
                      items={[
                        { id: "present", label: "Tham gia", value: classDashboardMetrics.selectedSession.present, percent: Math.round((classDashboardMetrics.selectedSession.present / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#0f766e" },
                        { id: "late", label: "Đi muộn", value: classDashboardMetrics.selectedSession.late, percent: Math.round((classDashboardMetrics.selectedSession.late / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#b45309" },
                        { id: "absent", label: "Vắng", value: classDashboardMetrics.selectedSession.absent, percent: Math.round((classDashboardMetrics.selectedSession.absent / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#b91c1c" },
                        { id: "excused", label: "Có phép", value: classDashboardMetrics.selectedSession.excused, percent: Math.round((classDashboardMetrics.selectedSession.excused / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#0369a1" },
                        { id: "unmarked", label: "Chưa", value: classDashboardMetrics.selectedSession.unmarked, percent: Math.round((classDashboardMetrics.selectedSession.unmarked / (classDashboardMetrics.totalStudents || 1)) * 100), color: "#64748b" },
                      ]} 
                    />
                  </div>
                </article>

                <article className="class-dashboard-panel" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow" style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>So sánh</p>
                      <h3 style={{ fontSize: "15px", fontWeight: 800 }}>
                        {classDashboardMetrics.prevSession.sessionNumber >= 0 
                          ? `So sánh với buổi trước (Buổi ${classDashboardMetrics.prevSession.sessionNumber})` 
                          : `Số liệu Buổi ${selectedAttendanceSession}`
                        }
                      </h3>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", marginBottom: "auto", display: "flex", flexDirection: "column", gap: "8px", padding: "8px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                      <span>Tiêu chí</span>
                      <div style={{ display: "flex", gap: "20px" }}>
                        {classDashboardMetrics.prevSession.sessionNumber >= 0 && (
                          <span style={{ width: "40px", textAlign: "right" }}>B.{classDashboardMetrics.prevSession.sessionNumber}</span>
                        )}
                        <span style={{ width: "45px", textAlign: "right", color: "#10b981" }}>B.{selectedAttendanceSession}</span>
                        {classDashboardMetrics.prevSession.sessionNumber >= 0 && (
                          <span style={{ width: "35px", textAlign: "right" }}>+/-</span>
                        )}
                      </div>
                    </div>

                    {[
                      { label: "Tham gia", key: "present", color: "#10b981" },
                      { label: "Đi muộn", key: "late", color: "#f59e0b" },
                      { label: "Vắng", key: "absent", color: "#ef4444" },
                      { label: "Phép", key: "excused", color: "#3b82f6" },
                    ].map((item) => {
                      const current = classDashboardMetrics.selectedSession[item.key] || 0;
                      const prev = classDashboardMetrics.prevSession[item.key] || 0;
                      const diff = current - prev;
                      const hasPrev = classDashboardMetrics.prevSession.sessionNumber >= 0;

                      return (
                        <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.color }}></span>
                            {item.label}
                          </div>
                          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                            {hasPrev && (
                              <span style={{ width: "40px", textAlign: "right", fontWeight: 600, color: "#94a3b8", fontSize: "12px" }}>{prev}</span>
                            )}
                            <div style={{ 
                              width: "45px", 
                              textAlign: "right", 
                              fontWeight: 800, 
                              color: "#1e293b", 
                              fontSize: "13px",
                              background: "rgba(16, 185, 129, 0.05)",
                              padding: "2px 4px",
                              borderRadius: "4px"
                            }}>
                              {current}
                            </div>
                            {hasPrev && (
                              <div style={{ width: "35px", textAlign: "right" }}>
                                {diff > 0 ? (
                                  <span style={{ color: "#10b981", fontWeight: 800, fontSize: "11px" }}>+{diff}</span>
                                ) : diff < 0 ? (
                                  <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "11px" }}>{diff}</span>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>0</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </div>

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

                <article className="class-dashboard-panel wide">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Theo dõi vắng</p>
                      <h3>
                        Vắng trong {classDashboardMetrics.recentAbsenceSessionNumbers?.length || 0} buổi gần nhất
                      </h3>
                    </div>
                  </div>
                  <div className="class-table" style={{ marginTop: "16px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 50, textAlign: "center" }}>STT</th>
                          <th>Học viên</th>
                          <th>Email</th>
                          <th>Số buổi vắng</th>
                          {classDashboardMetrics.recentAbsenceSessionNumbers?.map((sessionNumber: number) => (
                            <th key={sessionNumber}>B{sessionNumber}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classDashboardMetrics.recentAbsentees?.length ? (
                          classDashboardMetrics.recentAbsentees.map((student: any, idx: number) => (
                            <tr key={student.id}>
                              <td style={{ textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                              <td>{student.name}</td>
                              <td>{student.email}</td>
                              <td>
                                <strong style={{ color: "#b91c1c" }}>{student.recentAbsentCount}</strong>
                              </td>
                              {student.recentRecords.map((record: any) => (
                                <td key={record.sessionNumber}>
                                  {record.status === "absent" ? (
                                    <span className="student-attendance-note danger">Vắng</span>
                                  ) : record.status ? (
                                    <span className="student-attendance-note muted">-</span>
                                  ) : (
                                    <span className="student-attendance-note muted">Chưa điểm danh</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4 + (classDashboardMetrics.recentAbsenceSessionNumbers?.length || 0)}>
                              Chưa có học viên vắng trong các buổi gần nhất.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <AttendanceModal
                  status={sessionDetailStatus}
                  selectedClass={selectedAttendanceClass}
                  attendanceRecords={attendanceRecords}
                  sessionNumber={selectedAttendanceSession}
                  onClose={() => setSessionDetailStatus(null)}
                />
              </>
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

                <article className="class-dashboard-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "10px" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nộp bài</p>
                      <h3 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>Tình trạng nộp</h3>
                    </div>
                    <select
                      value={submissionChartType}
                      onChange={(event) => setSubmissionChartType(event.target.value as "assignment" | "project")}
                      style={{
                        width: "150px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: "white",
                      }}
                    >
                      <option value="assignment">Bài tập</option>
                      <option value="project">Đồ án</option>
                    </select>
                  </div>
                  <PieChart
                    emptyText="Chưa có dữ liệu"
                    centerLabel={submissionChartType === "assignment" ? "lượt nộp" : "học viên"}
                    centerValue={`${submissionSummary.submitted}/${submissionSummary.total}`}
                    items={submissionItems}
                  />
                </article>

                <article className="class-dashboard-panel">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Chứng chỉ</p>
                      <h3>Điều kiện nhận chứng chỉ</h3>
                    </div>
                  </div>
                  <PieChart
                    emptyText="Chưa có dữ liệu"
                    centerLabel="đủ điều kiện"
                    centerValue={certificateSummary.participation + certificateSummary.completion}
                    items={certificateItems}
                  />
                  <div className="certificate-detail-actions">
                    <button
                      className="secondary-button compact-button"
                      onClick={() => setCertificateDetailType(certificateDetailType === "participation" ? null : "participation")}
                      type="button"
                    >
                      {certificateDetailType === "participation" ? "Ẩn tham gia" : "Chi tiết tham gia"}
                    </button>
                    <button
                      className="secondary-button compact-button"
                      onClick={() => setCertificateDetailType(certificateDetailType === "completion" ? null : "completion")}
                      type="button"
                    >
                      {certificateDetailType === "completion" ? "Ẩn hoàn thành" : "Chi tiết hoàn thành"}
                    </button>
                  </div>
                </article>

                {certificateDetailType && (
                  <div 
                    style={{ 
                      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                      background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
                      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                      padding: "20px"
                    }}
                    onClick={() => setCertificateDetailType(null)}
                  >
                    <article 
                      className="class-dashboard-panel wide" 
                      style={{ 
                        width: "100%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto", 
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        margin: 0, position: "relative", background: "white", padding: "24px",
                        borderRadius: "16px", border: "none"
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => setCertificateDetailType(null)}
                        style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "#f1f5f9", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: 800, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ✕
                      </button>
                      
                      <div className="section-heading compact">
                        <div>
                          <p className="eyebrow" style={{ color: "#10b981", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chi tiết danh sách</p>
                          <h3 style={{ fontSize: "20px", fontWeight: 800, marginTop: "4px", color: "#1e293b" }}>
                            {certificateDetailType === "atRisk" 
                              ? "Học viên có nguy cơ (Vắng/Muộn nhiều)" 
                              : `Học viên đủ ĐK chứng chỉ ${certificateDetailType === "completion" ? "Hoàn thành" : "Tham gia"}`}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="class-table" style={{ marginTop: "24px" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                          <thead>
                            <tr style={{ textAlign: "left" }}>
                              <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600, textAlign: "center", width: 50, borderBottom: "1px solid #e2e8f0" }}>STT</th>
                              <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Học viên</th>
                              <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Email</th>
                              <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>Chuyên cần</th>
                              <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>Bài tập</th>
                              <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>Đồ án</th>
                            </tr>
                          </thead>
                          <tbody>
                            {certificateDetailRows.map((row: any, idx: number) => (
                              <tr key={row.id} style={{ background: "#f8fafc" }}>
                                <td style={{ padding: "16px 12px", textAlign: "center", color: "#94a3b8", borderRadius: "8px 0 0 8px" }}>{idx + 1}</td>
                                <td style={{ padding: "16px 12px", fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{row.name}</td>
                                <td style={{ padding: "16px 12px", fontSize: "13px", color: "#64748b" }}>{row.email}</td>
                                <td style={{ padding: "16px 12px", textAlign: "center" }}>
                                  <span style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                                    {row.attendanceScore || row.attendanceRate || 0}
                                  </span>
                                </td>
                                <td style={{ padding: "16px 12px", textAlign: "center", fontSize: "13px", fontWeight: 800, color: "#0f766e" }}>{row.assignmentScore || 0}</td>
                                <td style={{ padding: "16px 12px", textAlign: "center", fontSize: "13px", fontWeight: 800, color: "#0369a1", borderRadius: "0 8px 8px 0" }}>{row.projectScore || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {certificateDetailRows.length === 0 && (
                          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
                            Chưa có học viên nào trong danh sách này.
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                )}

                <article className="class-dashboard-panel wide">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Thống kê</p>
                       <h3>Xếp hạng học viên (Top 10)</h3>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button 
                        onClick={async () => {
                          const code = selectedAttendanceClass?.classCode;
                          if (code && code !== "-") {
                            const payload = {
                              classCode: code,
                              classInfo: {
                                class_name: selectedAttendanceClass?.className,
                                class_code: code
                              },
                              isFinished: false,
                              topStudents: topStudentsRows
                                .map((s: any) => {
                                  const weighted = ((s.attendanceScore || 0) * 0.3) + ((s.assignmentScore || 0) * 0.3) + ((s.projectScore || 0) * 0.4);
                                  return {
                                    id: s.id,
                                    name: s.name,
                                    attendance: s.attendanceScore || 0,
                                    assignment: s.assignmentScore || 0,
                                    project: s.projectScore || 0,
                                    final: parseFloat(weighted.toFixed(1))
                                  };
                                })
                                .sort((a, b) => b.final - a.final)
                                .slice(0, 10)
                            };

                            try {
                              const res = await fetch('/api/leaderboard/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                              });
                              
                              if (res.ok) {
                                window.open(`/leaderboard/${code}`, '_blank');
                              } else {
                                const errData = await res.json();
                                alert(`Lỗi khi lưu BXH: ${errData.error || "Không xác định"}`);
                              }
                            } catch (err) {
                              console.error("Leaderboard Share Error:", err);
                              alert("Không thể kết nối đến máy chủ để lưu BXH.");
                            }
                          } else {
                            alert("Lớp học này chưa có mã lớp để chia sẻ.");
                          }
                        }}
                        className="secondary-button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 20px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: 700,
                          backgroundColor: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          color: "#1e293b",
                          transition: "all 0.2s",
                          whiteSpace: "nowrap",
                          cursor: "pointer"
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        Chia sẻ BXH
                      </button>

                      <div style={{ height: "24px", width: "1px", backgroundColor: "#e2e8f0" }}></div>

                      <select 
                        value={topCriteria} 
                        onChange={(e) => setTopCriteria(e.target.value as any)}
                        style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: 700, color: "#1e293b", background: "white", cursor: "pointer" }}
                      >
                        <option value="overall">Điểm tổng kết</option>
                        <option value="attendance">Điểm chuyên cần</option>
                        <option value="assignment">Điểm bài tập</option>
                        <option value="project">Điểm đồ án</option>
                      </select>
                      
                      <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "10px" }}>
                        <button 
                          onClick={() => setTopOrder("desc")}
                          style={{
                            padding: "6px 16px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 800, cursor: "pointer",
                            background: topOrder === "desc" ? "white" : "transparent",
                            color: topOrder === "desc" ? "#4f46e5" : "#64748b",
                            boxShadow: topOrder === "desc" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.2s"
                          }}
                        >
                          Cao nhất
                        </button>
                        <button 
                          onClick={() => setTopOrder("asc")}
                          style={{
                            padding: "6px 16px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 800, cursor: "pointer",
                            background: topOrder === "asc" ? "white" : "transparent",
                            color: topOrder === "asc" ? "#4f46e5" : "#64748b",
                            boxShadow: topOrder === "asc" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.2s"
                          }}
                        >
                          Thấp nhất
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="class-table" style={{ marginTop: "16px" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", width: "50px" }}>Hạng</th>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b" }}>Học viên</th>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>Chuyên cần</th>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>Bài tập</th>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>Đồ án</th>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>Tổng kết</th>
                          <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topStudentsRows.map((student: any, index) => (
                          <tr key={student.id} style={{ background: index < 3 && topOrder === "desc" ? "rgba(99, 102, 241, 0.05)" : "#f8fafc" }}>
                            <td style={{ padding: "12px" }}>
                              <span style={{ 
                                display: "inline-flex", width: "24px", height: "24px", 
                                background: index === 0 && topOrder === "desc" ? "#fbbf24" : index === 1 && topOrder === "desc" ? "#94a3b8" : index === 2 && topOrder === "desc" ? "#b45309" : "#e2e8f0",
                                color: index < 3 && topOrder === "desc" ? "white" : "#64748b",
                                borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800
                              }}>
                                {index + 1}
                              </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{student.name}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{student.email}</div>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: student.attendanceScore < 2 ? "#ef4444" : "#475569" }}>
                                {student.attendanceScore || 0}
                              </span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{student.assignmentScore || 0}</span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{student.projectScore || 0}</span>
                                {student.projectUrl && (
                                  <a 
                                    href={student.projectUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ color: "#6366f1", display: "flex" }} title="Xem đồ án"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                      <polyline points="15 3 21 3 21 9"></polyline>
                                      <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{ fontSize: "14px", fontWeight: 900, color: "#4f46e5" }}>{student.finalScore || 0}</span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{ 
                                background: student.finalScore >= 5 ? "#dcfce7" : "#fee2e2", 
                                padding: "4px 10px", borderRadius: "20px", 
                                fontSize: "10px", fontWeight: 800, 
                                color: student.finalScore >= 5 ? "#166534" : "#991b1b"
                              }}>
                                {student.finalScore >= 5 ? "ĐẠT" : "CHƯA ĐẠT"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                {classDashboardMetrics.atRiskStudents.length > 0 && (
                  <article className="class-dashboard-panel wide" style={{ borderLeft: "4px solid #ef4444" }}>
                    <div className="section-heading compact">
                      <div>
                        <p className="eyebrow" style={{ color: "#dc2626" }}>Cảnh báo</p>
                        <h3>Học viên có nguy cơ bỏ học ({classDashboardMetrics.atRiskStudents.length})</h3>
                      </div>
                    </div>
                    <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "12px", color: "#7f1d1d", lineHeight: 1.6 }}>
                      <b style={{ color: "#991b1b", marginRight: 6 }}>ⓘ Tiêu chí:</b>
                      học viên thoả <b>một</b> trong 3 điều kiện sau sẽ vào danh sách —
                      (1) vắng <b>≥ 2 buổi liên tiếp</b>;
                      (2) vắng <b>≥ 50% số buổi đã điểm danh</b>;
                      (3) vắng <b>buổi đã điểm danh gần nhất</b>.
                      Sắp xếp ưu tiên: vắng buổi gần nhất → chuỗi liên tiếp dài → tỷ lệ vắng cao → điểm chuyên cần thấp.
                    </div>
                    <div className="class-table" style={{ marginTop: "16px" }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: 50, textAlign: "center" }}>STT</th>
                            <th>Học viên</th>
                            <th>Email</th>
                            <th style={{ width: 120 }}>SĐT</th>
                            <th style={{ width: 90, textAlign: "center" }}>Điểm CC</th>
                            <th style={{ width: 100, textAlign: "center" }}>Tổng vắng</th>
                            <th style={{ width: 110, textAlign: "center" }}>Vắng liên tiếp</th>
                            <th style={{ width: 110, textAlign: "center" }}>Buổi gần nhất</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDashboardMetrics.atRiskStudents.map((s: any, idx: number) => (
                            <tr key={s.id}>
                              <td style={{ textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                              <td>{s.name}</td>
                              <td>{s.email}</td>
                              <td>{s.phone || "-"}</td>
                              <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                                <span style={{ fontWeight: 700, color: s.attendanceScore < 5 ? "#dc2626" : "inherit" }}>{Number(s.attendanceScore).toFixed(1)}</span><span style={{ color: "#94a3b8" }}>/10</span>
                              </td>
                              <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                                <span style={{ fontWeight: 700, color: s.halfOrMoreAbsent ? "#dc2626" : "inherit" }}>{s.absentCount}</span><span style={{ color: "#94a3b8" }}>/{s.totalMarkedSessions || 0}</span>
                              </td>
                              <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                                <span style={{ fontWeight: 700, color: s.consecutiveAbsenceMax >= 2 ? "#dc2626" : "inherit" }}>{s.consecutiveAbsenceMax}</span><span style={{ color: "#94a3b8" }}> buổi</span>
                              </td>
                              <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                                {s.absentInLatest ? (
                                  <span style={{ color: "#dc2626", fontWeight: 700 }}>● Vắng</span>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>—</span>
                                )}
                              </td>
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
        {showGuideModal && (
          <div 
            style={{ 
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
              background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
              padding: "20px"
            }}
            onClick={() => setShowGuideModal(false)}
          >
            <article 
              className="class-dashboard-panel" 
              style={{ 
                width: "100%", maxWidth: "600px", background: "white", padding: "32px", 
                borderRadius: "20px", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowGuideModal(false)}
                style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "#f1f5f9", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: 800, color: "#64748b" }}
              >✕</button>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "inline-flex", padding: "12px", background: "#f5f3ff", borderRadius: "16px", marginBottom: "16px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b" }}>
                  Hướng dẫn xem Dashboard {classDashboardMode === "session" ? "Theo buổi" : "Toàn khóa"}
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {classDashboardMode === "session" ? (
                  <>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "32px", height: "32px", background: "#e0f2fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0369a1", fontSize: "14px" }}>1</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Phân tích buổi học</h4>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>Theo dõi 4 chỉ số then chốt (Tham gia, Vắng, Muộn, Có phép). Bạn có thể <b>nhấn trực tiếp</b> vào từng thẻ số liệu để xem danh sách chi tiết học viên tương ứng.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "32px", height: "32px", background: "#e0f2fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0369a1", fontSize: "14px" }}>2</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Đối soát & Xu hướng</h4>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>Sử dụng bảng <b>So sánh buổi trước</b> để thấy biến động sĩ số. Biểu đồ <b>Xu hướng</b> bên dưới giúp bạn đánh giá độ "nhiệt" của lớp qua từng giai đoạn.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "32px", height: "32px", background: "#e0f2fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0369a1", fontSize: "14px" }}>3</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Ghi chú thông minh</h4>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>Học viên vắng hoặc muộn sẽ được hệ thống gắn nhãn cảnh báo (Danger/Warning) ngay trong danh sách phía dưới để trợ giảng tiện theo dõi.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "32px", height: "32px", background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#92400e", fontSize: "14px" }}>1</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Sức khỏe lớp học (Health Check)</h4>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>Theo dõi toàn diện tỉ lệ nộp Bài tập, Đồ án và Chuyên cần. Thẻ <b>Học viên nguy cơ</b> sẽ tự động ẩn đi khi lớp đã kết thúc để tối giản giao diện.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "32px", height: "32px", background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#92400e", fontSize: "14px" }}>2</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Bảng điểm hợp nhất</h4>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>Mọi đầu điểm (Chuyên cần, Bài tập, Đồ án, Tổng kết) đều hiển thị trên một hàng. Click vào <b>biểu tượng link</b> ở cột Đồ án để xem nhanh sản phẩm của học viên.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "32px", height: "32px", background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#92400e", fontSize: "14px" }}>3</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Xếp hạng & Vinh danh</h4>
                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>Sử dụng Dropdown để sắp xếp học viên theo tiêu chí mong muốn. Chế độ <b>Top 10</b> giúp nhận diện các bạn xuất sắc hoặc hỗ trợ nhóm học viên đang yếu.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={() => setShowGuideModal(false)}
                style={{ width: "100%", marginTop: "32px", padding: "14px", borderRadius: "12px", border: "none", background: "#6366f1", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}
              >
                Đã hiểu
              </button>
            </article>
          </div>
        )}
      </article>
    </section>
  );
}
