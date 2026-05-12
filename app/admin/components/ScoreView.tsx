"use client";

import React from "react";

interface ScoreViewProps {
  type: "assignment" | "project";
  visibleClassItems: any[];
  selectedClassId: string | null;
  onClassChange: (id: string | null) => void;
  selectedEnrollments: any[];
  isSaving: boolean;
  onUpdateScore: (enrollmentId: string, assignmentNumber: number, score: number) => void;
  onRefresh: () => void;
  error: string | null;
  selectedSession: number;
  setSelectedSession: (num: number) => void;
  sessionCount: number;
  assignmentRecordsByEnrollment?: Map<string, Record<number, any>>;
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
  assignmentRecordsByEnrollment,
}: ScoreViewProps) {
  const [showGuide, setShowGuide] = React.useState(false);
  const isAssignment = type === "assignment";
  const label = isAssignment ? "bài tập" : "đồ án";

  return (
    <section className="analytics-grid" aria-label={`Giao diện chấm điểm ${label}`}>
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)" }}>Chấm điểm {label}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--foreground-muted)", fontSize: "0.9rem" }}>
              Cập nhật kết quả làm {label} của học viên.
            </p>
          </div>
          <div style={{ position: "relative" }}>
            <button 
              className="secondary-button" 
              onClick={() => setShowGuide(!showGuide)}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span>ℹ️ Hướng dẫn</span>
            </button>
            {showGuide && (
              <div style={{ 
                position: "absolute", 
                top: "100%", 
                right: 0, 
                width: "300px", 
                backgroundColor: "var(--background)", 
                border: "1px solid var(--border)", 
                borderRadius: "12px", 
                padding: "16px", 
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                zIndex: 100,
                marginTop: "8px"
              }}>
                <h4 style={{ margin: "0 0 8px", fontSize: "1rem" }}>Cách tính điểm:</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", lineHeight: "1.6", color: "var(--foreground-muted)" }}>
                  <li>Nhập điểm trực tiếp vào từng ô BT (0-10).</li>
                  <li>Hệ thống <strong>tự động lưu</strong> khi bạn chuyển ô.</li>
                  <li>Điểm trung bình (Assignment Score) sẽ được <strong>tự động tính toán</strong> lại ngay sau khi lưu.</li>
                  <li>Nếu để trống, hệ thống sẽ coi như chưa có điểm.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="attendance-toolbar" style={{ alignItems: "flex-end", marginBottom: "24px", gap: "16px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px", flex: 1, alignItems: "flex-end" }}>
            <label style={{ flex: "1 1 300px", maxWidth: "400px" }}>
              <span>Lớp học</span>
              <select onChange={(e) => onClassChange(e.target.value || null)} value={selectedClassId ?? ""}>
                <option value="">Chọn lớp học</option>
                {visibleClassItems.map(item => <option key={item.id} value={item.id}>{item.classCode} - {item.className}</option>)}
              </select>
            </label>
            {!isAssignment && (
              <label style={{ width: "180px" }}>
                <span>Đồ án</span>
                <select onChange={(e) => setSelectedSession(Number(e.target.value))} value={selectedSession}>
                  <option value={1}>Đồ án cuối khóa</option>
                </select>
              </label>
            )}
          </div>
          <button className="secondary-button" onClick={onRefresh} type="button">Làm mới</button>
        </div>

        {error && <div className="notice error">{error}</div>}

        <div className="class-table" style={{ overflowX: "auto" }}>
          <table style={{ minWidth: isAssignment ? "800px" : "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>STT</th>
                <th>Học viên</th>
                <th style={{ width: "200px" }}>Email</th>
                {isAssignment ? (
                  <>
                    {Array.from({ length: sessionCount }, (_, i) => i + 1).map(n => (
                      <th key={n} style={{ width: "80px", textAlign: "center" }}>BT {n}</th>
                    ))}
                    <th style={{ width: "80px", textAlign: "center", backgroundColor: "var(--background-soft)", color: "var(--primary)", fontWeight: 700 }}>ĐTB</th>
                  </>
                ) : (
                  <th style={{ width: "120px", textAlign: "center" }}>Điểm đồ án</th>
                )}
              </tr>
            </thead>
            <tbody>
              {selectedEnrollments.length ? (
                selectedEnrollments.map((enrollment, index) => {
                  const scoresMap = assignmentRecordsByEnrollment?.get(String(enrollment.id)) || {};
                  
                  return (
                    <tr key={enrollment.id}>
                      <td>{index + 1}</td>
                      <td><div style={{ fontWeight: 600 }}>{enrollment.name}</div></td>
                      <td>{enrollment.email}</td>
                      {isAssignment ? (
                        <>
                          {Array.from({ length: sessionCount }, (_, i) => i + 1).map(n => (
                            <td key={n} style={{ textAlign: "center" }}>
                              <input 
                                type="number" 
                                min="0" 
                                max="10" 
                                step="0.1"
                                defaultValue={scoresMap[n]?.score ?? ""}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) onUpdateScore(enrollment.id, n, val);
                                }}
                                disabled={isSaving}
                                style={{ 
                                  padding: "6px 8px", 
                                  borderRadius: "6px", 
                                  border: "1px solid var(--border)", 
                                  width: "60px",
                                  textAlign: "center",
                                  fontSize: "13px"
                                }}
                              />
                            </td>
                          ))}
                          <td style={{ textAlign: "center", backgroundColor: "var(--background-soft)", fontWeight: 700, color: "var(--primary)" }}>
                            {enrollment.assignmentScore != null ? Number(enrollment.assignmentScore).toFixed(1) : "-"}
                          </td>
                        </>
                      ) : (
                        <td style={{ textAlign: "center" }}>
                          <input 
                            type="number" 
                            min="0" 
                            max="10" 
                            step="0.1"
                            defaultValue={enrollment.projectScore ?? ""}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) onUpdateScore(enrollment.id, 1, val);
                            }}
                            disabled={isSaving}
                            style={{ 
                              padding: "8px 12px", 
                              borderRadius: "8px", 
                              border: "1px solid var(--border)", 
                              width: "100px",
                              textAlign: "center"
                            }}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={isAssignment ? 3 + sessionCount : 4}>Chọn lớp để thực hiện chấm điểm.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
