"use client";

import React from "react";

interface ScoreViewProps {
  type: "assignment" | "project";
  visibleClassItems: any[];
  selectedClassId: string | null;
  onClassChange: (id: string | null) => void;
  selectedEnrollments: any[];
  isSaving: boolean;
  onUpdateScore: (enrollmentId: string, score: number) => void;
  onRefresh: () => void;
  error: string | null;
  selectedSession: number;
  setSelectedSession: (num: number) => void;
  sessionCount: number;
}

export function ScoreView({
  type,
  visibleClassItems,
  selectedClassId,
  onClassChange,
  selectedEnrollments,
  isSaving,
  onUpdateScore,
  onRefresh,
  error,
  selectedSession,
  setSelectedSession,
  sessionCount,
}: ScoreViewProps) {
  const label = type === "assignment" ? "bài tập" : "đồ án";

  return (
    <section className="analytics-grid" aria-label={`Giao diện chấm điểm ${label}`}>
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div className="attendance-toolbar" style={{ alignItems: "flex-end", marginBottom: "24px", gap: "16px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px", flex: 1, alignItems: "flex-end" }}>
            <label style={{ flex: "1 1 300px", maxWidth: "400px" }}>
              <span>Lớp học</span>
              <select onChange={(e) => onClassChange(e.target.value || null)} value={selectedClassId ?? ""}>
                <option value="">Chọn lớp học</option>
                {visibleClassItems.map(item => <option key={item.id} value={item.id}>{item.classCode} - {item.className}</option>)}
              </select>
            </label>
            {type === "assignment" && (
              <label style={{ width: "180px" }}>
                <span>Buổi bài tập</span>
                <select onChange={(e) => setSelectedSession(Number(e.target.value))} value={selectedSession}>
                  {Array.from({ length: sessionCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>Buổi {n}</option>)}
                </select>
              </label>
            )}
          </div>
          <button className="secondary-button" onClick={onRefresh} type="button">Làm mới</button>
        </div>

        {error && <div className="notice error">{error}</div>}

        <div className="class-table">
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Học viên</th>
                <th>Email</th>
                <th>Điểm {label} (0-10)</th>
              </tr>
            </thead>
            <tbody>
              {selectedEnrollments.length ? (
                selectedEnrollments.map((enrollment, index) => (
                  <tr key={enrollment.id}>
                    <td>{index + 1}</td>
                    <td><div style={{ fontWeight: 600 }}>{enrollment.name}</div></td>
                    <td>{enrollment.email}</td>
                    <td>
                      <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        defaultValue={type === "assignment" ? enrollment.assignmentScore : enrollment.projectScore}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) onUpdateScore(enrollment.id, val);
                        }}
                        disabled={isSaving}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", width: "100px" }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4}>Chọn lớp để thực hiện chấm điểm.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
