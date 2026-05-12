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
      <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="guide-header">
          <p className="guide-kicker">Hướng dẫn</p>
          <h2>Quy tắc cấp chứng chỉ</h2>
          <span>Tiêu chuẩn đánh giá học viên tại Dua Edu</span>
        </div>
        
        <div className="guide-body">
          <div className="guide-rule-card success">
            <div className="guide-rule-heading">
              <span>Hoàn thành</span>
              <strong>Certificate of Completion</strong>
            </div>
            <ul className="guide-list">
              <li>Điểm chuyên cần: <strong>≥ 4.0</strong> (Không vắng quá 2 buổi)</li>
              <li>Bài tập về nhà: <strong>Hoàn thành 100%</strong> (Điểm &gt; 0)</li>
              <li>Đồ án cuối khóa: <strong>Đã nộp</strong> (Điểm &gt; 0)</li>
              <li>Điểm tổng kết (Final): <strong>≥ 4.0</strong></li>
            </ul>
          </div>

          <div className="guide-rule-card warning">
            <div className="guide-rule-heading">
              <span>Tham gia</span>
              <strong>Certificate of Participation</strong>
            </div>
            <ul className="guide-list">
              <li>Điểm chuyên cần: <strong>≥ 2.0</strong></li>
              <li>Bài tập về nhà: <strong>Có tham gia</strong> (Điểm &gt; 0)</li>
              <li><i>(Chưa đủ điều kiện nhận chứng chỉ Hoàn thành)</i></li>
            </ul>
          </div>

          <div className="guide-note">
            Hệ thống sẽ tự động quét và cấp chứng chỉ dựa trên các điều kiện trên khi bạn nhấn nút "Đồng bộ dữ liệu".
          </div>
        </div>

        <div className="guide-footer">
          <button className="primary-action" onClick={onClose}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}
