import React from "react";

interface AttendanceGuideModalProps {
  onClose: () => void;
}

const attendanceRules = [
  { code: "V", label: "Có mặt", score: "1.0", tone: "success", desc: "Học viên tham gia đầy đủ buổi học." },
  { code: "M", label: "Đi muộn", score: "0.75", tone: "warning", desc: "Học viên vào lớp sau thời gian quy định." },
  { code: "P", label: "Có phép", score: "0.5", tone: "info", desc: "Vắng mặt nhưng có lý do chính đáng được duyệt." },
  { code: "X", label: "Vắng mặt", score: "0", tone: "danger", desc: "Vắng mặt không thông báo hoặc không lý do." },
  { code: "-", label: "Chưa điểm danh", score: "0", tone: "muted", desc: "Trạng thái mặc định khi chưa bắt đầu." },
];

export function AttendanceGuideModal({ onClose }: AttendanceGuideModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content guide-modal" onClick={(event) => event.stopPropagation()}>
        <button className="guide-close-button" onClick={onClose} type="button" aria-label="Đóng hướng dẫn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="guide-header">
          <p className="guide-kicker">Hướng dẫn</p>
          <h2>Quy đổi điểm chuyên cần</h2>
          <span>Điểm chuyên cần được tính tự động từ trạng thái điểm danh từng buổi.</span>
        </div>

        <div className="guide-body">
          <div className="guide-rule-list">
            {attendanceRules.map((item) => (
              <div className={`guide-score-row ${item.tone}`} key={item.label}>
                <strong>{item.code}</strong>
                <div>
                  <span>{item.label}</span>
                  <small>{item.desc}</small>
                </div>
                <b>+{item.score}</b>
              </div>
            ))}
          </div>

          <div className="guide-formula">
            <span>Công thức tính</span>
            <code>(Tổng điểm các buổi / Tổng số buổi) x 10</code>
          </div>
        </div>

        <div className="guide-footer">
          <button className="primary-action" onClick={onClose} type="button">Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}
