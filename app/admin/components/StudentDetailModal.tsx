"use client";

import React from "react";
import type { Row, DataState } from "../types";

interface StudentDetailModalProps {
  student: Row | null;
  onClose: () => void;
  data: DataState;
  onEdit: (student: Row) => void;
}

export function StudentDetailModal({ student, onClose, data, onEdit }: StudentDetailModalProps) {
  if (!student) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", padding: "0", borderRadius: "24px", overflow: "hidden" }}>
        <div style={{ padding: "40px", background: "white" }}>
          <div style={{ display: "flex", gap: "24px", marginBottom: "30px", alignItems: "flex-start" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "white", flexShrink: 0, boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)" }}>
              {String(student.full_name || "?").charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--foreground)" }}>{String(student.full_name || "N/A")}</h2>
                  <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>Học viên #{String(student.id).slice(0, 8)}</p>
                </div>
                <button 
                  onClick={onClose}
                  style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}
                >
                  &times;
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>📧</span>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{String(student.email || "-")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>📞</span>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{String(student.phone || "-")}</span>
                </div>
                {student.note && (
                  <div style={{ gridColumn: "1 / -1", marginTop: "10px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "#64748b" }}>GHI CHÚ</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", fontStyle: "italic" }}>{String(student.note)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Lớp học đã ghi danh</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(() => {
                const studentId = String(student.id);
                const enrollmentRows = data.enrollments.filter(e => String(e.student_id) === studentId);
                
                if (enrollmentRows.length === 0) return <p style={{ fontSize: "13px", color: "var(--muted)" }}>Chưa ghi danh lớp nào.</p>;
                
                return enrollmentRows.map(enrollment => {
                  const classRow = data.classes.find(c => String(c.id) === String(enrollment.class_id));
                  return (
                    <div key={String(enrollment.id)} style={{ padding: "12px", borderRadius: "10px", background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "14px", color: "var(--foreground)" }}>{String(classRow?.class_name || "Lớp đã xóa")}</strong>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>{String(classRow?.class_code || "-")}</span>
                      </div>
                      <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-secondary)" }}>
                        <span>CC: <strong>{enrollment.attendance_score ?? "-"}</strong></span>
                        <span>BT: <strong>{enrollment.assignment_score ?? "-"}</strong></span>
                        <span>ĐA: <strong>{enrollment.project_score ?? "-"}</strong></span>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>Final: {enrollment.final_score ?? "-"}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
        
        <div style={{ padding: "20px 40px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
          <button className="primary-button" onClick={() => onEdit(student)}>Chỉnh sửa hồ sơ</button>
        </div>
      </div>
    </div>
  );
}
