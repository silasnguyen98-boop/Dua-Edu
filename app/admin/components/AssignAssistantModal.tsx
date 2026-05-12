"use client";

import React from "react";

interface AssignAssistantModalProps {
  show: boolean;
  onClose: () => void;
  selectedClassId: string | null;
  adminUsers: any[];
  classAssistants: any[];
  onAssign: (assistantId: string) => void;
  onRemove: (assignmentId: string) => void;
  isSaving: boolean;
}

export function AssignAssistantModal({
  show,
  onClose,
  selectedClassId,
  adminUsers,
  classAssistants,
  onAssign,
  onRemove,
  isSaving,
}: AssignAssistantModalProps) {
  if (!show || !selectedClassId) return null;

  const availableAssistants = adminUsers.filter(u => 
    u.role === "assistant" && 
    !classAssistants.some((a: any) => String(a.assistant_id) === String(u.profile_id ?? u.id))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assign-modal-header">
          <div>
            <p className="eyebrow">Lớp học</p>
            <h3>Phân công trợ giảng</h3>
          </div>
          <button className="assign-modal-close" onClick={onClose} type="button" aria-label="Đóng modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="assign-modal-body">
          <section className="assign-section">
            <p>Danh sách trợ giảng đang phụ trách</p>
            {classAssistants.length ? (
              <div className="assign-list">
                {classAssistants.map((assignment) => {
                  const assistant = adminUsers.find(u => String(u.profile_id ?? u.id) === String(assignment.assistant_id));
                  return (
                    <div className="assign-row" key={assignment.id}>
                      <span>{assistant?.username || assistant?.email || assignment.assistant_id}</span>
                      <button 
                        className="text-button" 
                        onClick={() => onRemove(assignment.id)}
                        disabled={isSaving}
                        type="button"
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="assign-empty">Chưa có trợ giảng nào được phân công.</div>
            )}
          </section>

          <section className="assign-section">
            <p>Thêm trợ giảng mới</p>
            {availableAssistants.length ? (
              <div className="assign-list">
                {availableAssistants.map((assistant) => (
                  <button 
                    key={assistant.id}
                    className="assign-option"
                    onClick={() => onAssign(String(assistant.profile_id ?? assistant.id))}
                    disabled={isSaving}
                    type="button"
                  >
                    <span>+</span>
                    <strong>{assistant.username || assistant.email}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="assign-empty">Không còn trợ giảng nào khả dụng để thêm.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
