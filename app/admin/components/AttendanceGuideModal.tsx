import React from "react";

interface AttendanceGuideModalProps {
  onClose: () => void;
}

export function AttendanceGuideModal({ onClose }: AttendanceGuideModalProps) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "500px",
        padding: "32px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        position: "relative"
      }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#64748b"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", color: "#0f172a" }}>
          Hướng dẫn quy đổi điểm chuyên cần
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Điểm chuyên cần được tính tự động dựa trên trạng thái điểm danh của từng buổi học. 
          Hệ thống quy đổi theo thang điểm 10 như sau:
        </p>

        <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Có mặt (V)", score: "1.0", color: "#10b981", desc: "Học viên tham gia đầy đủ buổi học." },
            { label: "Đi muộn (M)", score: "0.75", color: "#f59e0b", desc: "Học viên vào lớp sau thời gian quy định." },
            { label: "Có phép (P)", score: "0.5", color: "#3b82f6", desc: "Vắng mặt nhưng có lý do chính đáng được duyệt." },
            { label: "Vắng mặt (X)", score: "0", color: "#ef4444", desc: "Vắng mặt không thông báo hoặc không lý do." },
            { label: "Chưa điểm danh", score: "0", color: "#e2e8f0", desc: "Trạng thái mặc định khi chưa bắt đầu." },
          ].map((item, idx) => (
            <div key={idx} style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "12px", 
              borderRadius: "12px", 
              border: "1px solid #f1f5f9",
              background: "#f8fafc"
            }}>
              <div style={{ 
                width: "32px", 
                height: "32px", 
                borderRadius: "6px", 
                backgroundColor: item.color, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "12px",
                marginRight: "12px"
              }}>
                {item.label.split("(")[1]?.replace(")", "") || "-"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#334155" }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{item.desc}</div>
              </div>
              <div style={{ 
                fontWeight: 800, 
                fontSize: "16px", 
                color: item.color 
              }}>
                +{item.score}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          padding: "16px", 
          borderRadius: "12px", 
          backgroundColor: "#f0fdf4", 
          border: "1px solid #dcfce7",
          fontSize: "13px",
          color: "#166534"
        }}>
          <strong>Công thức tính:</strong><br />
          <code>(Tổng điểm các buổi / Tổng số buổi) x 10</code>
        </div>

        <button 
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "24px",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#0f172a",
            color: "white",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
