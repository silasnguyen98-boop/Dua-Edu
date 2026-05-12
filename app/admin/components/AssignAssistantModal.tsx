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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h3>Phân công trợ giảng</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Danh sách trợ giảng đang phụ trách:</p>
            {classAssistants.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {classAssistants.map((assignment) => {
                  const assistant = adminUsers.find(u => String(u.profile_id ?? u.id) === String(assignment.assistant_id));
                  return (
                    <div key={assignment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{assistant?.username || assistant?.email || assignment.assistant_id}</span>
                      <button 
                        className="text-button" 
                        style={{ color: "#ef4444", fontSize: "12px" }}
                        onClick={() => onRemove(assignment.id)}
                        disabled={isSaving}
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>Chưa có trợ giảng nào được phân công.</p>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Thêm trợ giảng mới:</p>
            {availableAssistants.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {availableAssistants.map((assistant) => (
                  <button 
                    key={assistant.id}
                    className="secondary-button"
                    style={{ justifyContent: "flex-start", textAlign: "left", padding: "12px" }}
                    onClick={() => onAssign(String(assistant.profile_id ?? assistant.id))}
                    disabled={isSaving}
                  >
                    + {assistant.username || assistant.email}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>Không còn trợ giảng nào khả dụng để thêm.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
