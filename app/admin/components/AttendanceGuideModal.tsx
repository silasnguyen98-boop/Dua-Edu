import React from "react";

interface AttendanceGuideModalProps {
  onClose: () => void;
}

const attendanceRules = [
  { code: "V", label: "Có mặt", score: "1.0", tone: "success", bg: "#f0fdf4", color: "#166534", desc: "Học viên tham gia đầy đủ buổi học." },
  { code: "M", label: "Đi muộn", score: "0.75", tone: "warning", bg: "#fffbeb", color: "#92400e", desc: "Vào lớp sau thời gian quy định." },
  { code: "P", label: "Có phép", score: "0.8", tone: "info", bg: "#f0f9ff", color: "#075985", desc: "Vắng mặt có lý do chính đáng." },
  { code: "X", label: "Vắng mặt", score: "0", tone: "danger", bg: "#fef2f2", color: "#991b1b", desc: "Vắng mặt không có lý do." },
];

export function AttendanceGuideModal({ onClose }: AttendanceGuideModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="modal-content guide-modal" onClick={(event) => event.stopPropagation()} style={{ 
        maxWidth: "500px", 
        borderRadius: "24px", 
        overflow: "hidden",
        border: "none",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}>
        <div className="guide-header" style={{ 
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          padding: "32px 24px",
          color: "white",
          textAlign: "center",
          position: "relative"
        }}>
          <button onClick={onClose} style={{ 
            position: "absolute", 
            top: "16px", 
            right: "16px", 
            background: "rgba(255,255,255,0.2)", 
            border: "none", 
            borderRadius: "50%", 
            width: "32px", 
            height: "32px", 
            color: "white", 
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9 }}>Cơ chế vận hành</span>
          <h2 style={{ margin: "8px 0", fontSize: "24px", fontWeight: 800 }}>Quy đổi điểm chuyên cần</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "14px" }}>Điểm số được tính tự động dựa trên mức độ chuyên cần của học viên.</p>
        </div>

        <div className="guide-body" style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {attendanceRules.map((item) => (
              <div key={item.label} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "16px", 
                padding: "12px 16px", 
                backgroundColor: item.bg, 
                borderRadius: "16px",
                transition: "transform 0.2s"
              }}>
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "12px", 
                  backgroundColor: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: item.color,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  {item.code}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>{item.label}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.desc}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: "16px", color: item.color }}>
                  +{item.score}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            backgroundColor: "#f8fafc", 
            borderRadius: "16px", 
            padding: "16px", 
            border: "1px dashed #e2e8f0",
            marginBottom: "20px"
          }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>CÔNG THỨC TÍNH:</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", fontFamily: "monospace" }}>
              (Tổng điểm tích luỹ / Tổng số buổi) × 10
            </div>
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "16px", 
            backgroundColor: "#eff6ff", 
            borderRadius: "16px",
            border: "1px solid #dbeafe"
          }}>
            <div style={{ color: "#3b82f6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#1e40af", lineHeight: "1.5" }}>
              Lưu ý: Điểm chuyên cần chiếm <strong>30%</strong> trong trọng số điểm tổng kết của học viên.
            </p>
          </div>
        </div>

        <div className="guide-footer" style={{ padding: "0 24px 24px" }}>
          <button className="primary-action" onClick={onClose} style={{ 
            width: "100%", 
            padding: "14px", 
            borderRadius: "16px", 
            border: "none", 
            background: "#1e293b", 
            color: "white", 
            fontWeight: 700, 
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
