"use client";

import React from "react";

interface ClassInfoModalProps {
  classItem: any;
  onClose: () => void;
  onEdit?: (row: any) => void;
  formatValue: (val: any) => string;
}

type LinkKey = "meeting_url" | "recording_url" | "slide_url" | "reference_url" | "assignment_url";

const LINK_FIELDS: { key: LinkKey; label: string }[] = [
  { key: "meeting_url", label: "Link học online" },
  { key: "recording_url", label: "Link video xem lại" },
  { key: "slide_url", label: "Link slide bài giảng" },
  { key: "reference_url", label: "Link tài liệu tham khảo" },
  { key: "assignment_url", label: "Link bài tập" },
];

export function ClassInfoModal({ classItem, onClose, onEdit, formatValue }: ClassInfoModalProps) {
  if (!classItem) return null;

  const raw = classItem.raw ?? classItem;

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: "Tên lớp", value: classItem.className || "-" },
    { label: "Mã lớp", value: classItem.classCode || "-" },
    { label: "Khoá học", value: classItem.courseName || "-" },
    { label: "Giảng viên", value: classItem.teacherName || "-" },
    { label: "Ngày bắt đầu", value: formatValue(classItem.startDate) || "-" },
    { label: "Số buổi học", value: classItem.totalSessions ?? "-" },
    { label: "Số bài tập", value: classItem.totalAssignments ?? "-" },
    { label: "Lịch học", value: classItem.schedule || "-" },
    { label: "Thời gian học", value: classItem.studyTime || "-" },
    { label: "Sĩ số", value: classItem.enrollmentCount ?? 0 },
  ];

  const linkRows = LINK_FIELDS
    .map((field) => ({ ...field, value: raw?.[field.key] ? String(raw[field.key]) : "" }))
    .filter((field) => field.value);

  const note = raw?.note ? String(raw.note) : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "640px", padding: 0, borderRadius: "20px", overflow: "hidden" }}
      >
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", padding: "28px 30px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, opacity: 0.9 }}>
                Thông tin lớp học
              </p>
              <h2 style={{ margin: "8px 0 0", fontSize: "22px", fontWeight: 800 }}>
                {classItem.className || "-"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", opacity: 0.9 }}>
                Mã lớp: <strong>{classItem.classCode || "-"}</strong>
              </p>
            </div>
            <button
              aria-label="Đóng"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              &times;
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 30px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            {infoRows.map((row) => (
              <div key={row.label}>
                <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {row.label}
                </label>
                <p style={{ marginTop: 4, fontWeight: 500, fontSize: "15px" }}>{row.value as React.ReactNode}</p>
              </div>
            ))}
          </div>

          {linkRows.length > 0 && (
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-secondary)" }}>
                Tài nguyên lớp học
              </h3>
              {linkRows.map((link) => (
                <div key={link.key}>
                  <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {link.label}
                  </label>
                  <p style={{ marginTop: 4, wordBreak: "break-all" }}>
                    <a
                      href={link.value}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                    >
                      {link.value}
                    </a>
                  </p>
                </div>
              ))}
            </div>
          )}

          {note && (
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Ghi chú
              </label>
              <p style={{ marginTop: 4, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{note}</p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: "16px 30px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          {onEdit && (
            <button className="primary-button" onClick={() => onEdit(raw)} type="button">
              Chỉnh sửa
            </button>
          )}
          <button className="secondary-button" onClick={onClose} type="button">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
