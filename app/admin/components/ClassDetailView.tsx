"use client";

import React, { useState, useMemo } from "react";
import { enrollmentStatusOptions } from "../constants";

interface ClassDetailViewProps {
  selectedClass: any;
  selectedClassEnrollments: any[];
  isLoading: boolean;
  isSaving: boolean;
  updatingEnrollmentId: string | null;
  onSyncCertificates: (id: string, type: string) => void;
  onExportExcel: () => void;
  onBack: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  formatValue: (val: any) => string;
  classStatusFilter: string;
  setClassStatusFilter: (status: string) => void;
}

export function ClassDetailView({
  selectedClass,
  selectedClassEnrollments,
  isLoading,
  isSaving,
  updatingEnrollmentId,
  onSyncCertificates,
  onExportExcel,
  onBack,
  onUpdateStatus,
  formatValue,
  classStatusFilter,
  setClassStatusFilter,
}: ClassDetailViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const getEnrollmentStatusClass = (status: string) => {
    switch (status) {
      case "active": return "status-active";
      case "completed": return "status-completed";
      case "dropped": return "status-dropped";
      case "reserved": return "status-reserved";
      case "cancelled": return "status-cancelled";
      default: return "";
    }
  };

  const sortedEnrollments = useMemo(() => {
    let items = [...selectedClassEnrollments];
    
    if (sortConfig) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    return items;
  }, [selectedClassEnrollments, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  if (isLoading) {
    return (
      <article className="analytics-card detail-card wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chi tiết lớp</p>
            <h3>Đang tải danh sách ghi danh...</h3>
          </div>
        </div>
      </article>
    );
  }

  if (!selectedClass) {
    return (
      <article className="analytics-card detail-card wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chi tiết lớp</p>
            <h3>Không tìm thấy lớp</h3>
          </div>
          <button className="text-button" onClick={onBack}>Quay lại</button>
        </div>
      </article>
    );
  }

  return (
    <section className="analytics-grid" aria-label="Chi tiết lớp">
      <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div className="class-detail-actions">
            <label>
              <span>Lọc trạng thái</span>
              <select onChange={(e) => setClassStatusFilter(e.target.value)} value={classStatusFilter}>
                <option value="all">Tất cả trạng thái</option>
                {enrollmentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <button className="primary-button" onClick={() => onSyncCertificates(selectedClass.id, "class")} disabled={isSaving} style={{ background: "#059669" }}>
              {isSaving ? "Đang đồng bộ..." : "Đồng bộ chứng chỉ"}
            </button>
            <button className="primary-button" onClick={onExportExcel}>Xuất Excel</button>
            <button className="text-button" onClick={onBack}>Quay lại</button>
          </div>
        </div>
        <p className="filter-summary">
          {selectedClass.courseName} · {selectedClass.teacherName} · Lịch học {selectedClass.schedule} · Thời gian {selectedClass.studyTime} · Đang hiển thị {sortedEnrollments.length}/{selectedClass.enrollmentCount} ghi danh
        </p>
        <div className="class-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>Học viên</th>
                <th onClick={() => handleSort("email")} style={{ cursor: "pointer" }}>Email</th>
                <th onClick={() => handleSort("attendanceScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Chuyên cần</th>
                <th onClick={() => handleSort("assignmentScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Bài tập</th>
                <th onClick={() => handleSort("projectScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Đồ án</th>
                <th onClick={() => handleSort("finalScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px", color: "var(--accent)" }}>Tổng kết</th>
                <th style={{ textAlign: "center" }}>Chứng chỉ</th>
                <th style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {sortedEnrollments.length ? (
                sortedEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.name}</td>
                    <td>{enrollment.email}</td>
                    <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>{formatValue(enrollment.attendanceScore)}</td>
                    <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>{formatValue(enrollment.assignmentScore)}</td>
                    <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>{formatValue(enrollment.projectScore)}</td>
                    <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px", color: "var(--accent)" }}><strong>{formatValue(enrollment.finalScore)}</strong></td>
                    <td style={{ textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                      {enrollment.certificate === "completion" ? <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700 }}>Hoàn thành</span>
                      : enrollment.certificate === "participation" ? <span style={{ background: "#fef9c3", color: "#854d0e", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700 }}>Tham gia</span>
                      : <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>}
                    </td>
                    <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>
                      <select className={`status-select ${getEnrollmentStatusClass(enrollment.status)}`} disabled={updatingEnrollmentId === enrollment.id} onChange={(e) => onUpdateStatus(enrollment.id, e.target.value)} value={enrollment.status}>
                        <option value="">Chưa có</option>
                        {enrollmentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8}>Không có ghi danh phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
