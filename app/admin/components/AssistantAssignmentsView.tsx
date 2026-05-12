"use client";

import React, { useState } from "react";

interface AssistantAssignmentsViewProps {
  assignedAssistantTotal: number;
  visibleClassItems: any[];
  assistantAssignmentClassItems: any[];
  assistantAssignmentsByClass: Record<string, any[]>;
  assistantUserByProfileId: Map<string, any>;
  onRefresh: () => void;
  onOpenAssignModal: (id: string) => void;
}

export function AssistantAssignmentsView({
  assignedAssistantTotal,
  visibleClassItems,
  assistantAssignmentClassItems,
  assistantAssignmentsByClass,
  assistantUserByProfileId,
  onRefresh,
  onOpenAssignModal,
}: AssistantAssignmentsViewProps) {
  const [search, setSearch] = useState("");

  const filteredItems = search
    ? assistantAssignmentClassItems.filter((item) =>
        item.className.toLowerCase().includes(search.toLowerCase()) ||
        item.classCode.toLowerCase().includes(search.toLowerCase()) ||
        item.courseName.toLowerCase().includes(search.toLowerCase())
      )
    : assistantAssignmentClassItems;

  return (
    <section className="analytics-grid" aria-label="Phân công trợ giảng">
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div className="section-heading" style={{ alignItems: "flex-end", gap: "16px" }}>
          <div>
            <p className="eyebrow">Trợ giảng</p>
            <h3>{assignedAssistantTotal} lượt phân công</h3>
            <p style={{ margin: "6px 0 0", color: "var(--text-secondary)" }}>
              Theo dõi {visibleClassItems.length} lớp và cập nhật trợ giảng phụ trách.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <input
              type="text"
              placeholder="Tìm lớp, mã lớp, khoá học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                width: "280px",
                maxWidth: "100%",
              }}
            />
            <button
              className="secondary-button compact-button"
              onClick={onRefresh}
              type="button"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="class-table">
          <table>
            <thead>
              <tr>
                <th>Lớp</th>
                <th>Mã lớp</th>
                <th>Khoá học</th>
                <th>Giảng viên</th>
                <th>Sĩ số</th>
                <th>Trợ giảng hiện tại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((item) => {
                  const assignments = assistantAssignmentsByClass[item.id] ?? [];

                  return (
                    <tr key={item.id}>
                      <td>{item.className}</td>
                      <td>{item.classCode}</td>
                      <td>{item.courseName}</td>
                      <td>{item.teacherName}</td>
                      <td>
                        <strong>{item.enrollmentCount}</strong>
                      </td>
                      <td>
                        {assignments.length ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {assignments.map((assignment) => {
                              const assistant = assistantUserByProfileId.get(String(assignment.assistant_id));
                              return (
                                <span key={assignment.id ?? assignment.assistant_id}>
                                  {assistant?.username || assistant?.email || assignment.assistant_id}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>Chưa phân công</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="secondary-button compact-button"
                          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none" }}
                          onClick={() => onOpenAssignModal(item.id)}
                          type="button"
                        >
                          Phân công
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>Không có lớp phù hợp để phân công trợ giảng.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
