"use client";

import React from "react";

interface CertGuideModalProps {
  show: boolean;
  onClose: () => void;
}

export function CertGuideModal({ show, onClose }: CertGuideModalProps) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", padding: "0", borderRadius: "20px", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", padding: "30px", color: "white", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>Quy tắc cấp Chứng chỉ</h2>
          <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "14px" }}>Tiêu chuẩn đánh giá học viên tại Dua Edu</p>
        </div>
        
        <div style={{ padding: "30px", display: "grid", gap: "24px" }}>
          <div style={{ padding: "20px", borderRadius: "16px", background: "#f0fdf4", border: "1px solid #dcfce7" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ background: "#166534", color: "white", padding: "4px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>Hoàn thành</span>
              <strong style={{ color: "#166534", fontSize: "16px" }}>Certificate of Completion</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#166534", lineHeight: "1.8" }}>
              <li>Điểm chuyên cần: <strong>≥ 4.0</strong> (Không vắng quá 2 buổi)</li>
              <li>Bài tập về nhà: <strong>Hoàn thành 100%</strong> (Điểm &gt; 0)</li>
              <li>Đồ án cuối khóa: <strong>Đã nộp</strong> (Điểm &gt; 0)</li>
              <li>Điểm tổng kết (Final): <strong>≥ 4.0</strong></li>
            </ul>
          </div>

          <div style={{ padding: "20px", borderRadius: "16px", background: "#fefce8", border: "1px solid #fef9c3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ background: "#854d0e", color: "white", padding: "4px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>Tham gia</span>
              <strong style={{ color: "#854d0e", fontSize: "16px" }}>Certificate of Participation</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#713f12", lineHeight: "1.8" }}>
              <li>Điểm chuyên cần: <strong>≥ 2.0</strong></li>
              <li>Bài tập về nhà: <strong>Có tham gia</strong> (Điểm &gt; 0)</li>
              <li><i>(Chưa đủ điều kiện nhận chứng chỉ Hoàn thành)</i></li>
            </ul>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
            Hệ thống sẽ tự động quét và cấp chứng chỉ dựa trên các điều kiện trên khi bạn nhấn nút "Đồng bộ dữ liệu".
          </div>
        </div>

        <div style={{ padding: "20px 30px", background: "#f8fafc", textAlign: "right" }}>
          <button className="primary-button" onClick={onClose}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}
