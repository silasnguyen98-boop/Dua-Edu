"use client";

import React from "react";

interface SessionDetailModalProps {
  session: any;
  onClose: () => void;
  onEdit: (session: any) => void;
}

export function SessionDetailModal({
  session,
  onClose,
  onEdit,
}: SessionDetailModalProps) {
  if (!session) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", padding: "0", borderRadius: "20px", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", padding: "30px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, opacity: 0.9 }}>Chi tiết buổi học</p>
              <h2 style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 800 }}>Buổi {String(session.session_number)}</h2>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>&times;</button>
          </div>
        </div>
        
        <div style={{ padding: "30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ngày học</label>
              <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{session.session_date ? new Date(session.session_date).toLocaleDateString("vi-VN") : "-"}</p>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Giờ bắt đầu</label>
                <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{String(session.start_time || "-")}</p>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Giờ kết thúc</label>
                <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{String(session.end_time || "-")}</p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {session.note && (
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ghi chú</label>
                <p style={{ marginTop: 4, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{String(session.note)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
          <button className="primary-button" onClick={() => onEdit(session)}>Chỉnh sửa</button>
        </div>
      </div>
    </div>
  );
}
