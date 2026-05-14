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
  onUpdateProjectLink?: (enrollmentId: string, url: string) => void;
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
  onUpdateProjectLink,
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
  const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-15.5 6.36" />
      <path d="M3 12a9 9 0 0 1 15.5-6.36" />
      <path d="M17 3v3h-3" />
      <path d="M7 21v-3h3" />
    </svg>
  );
  const InfoIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v5" />
      <path d="M12 7h.01" />
    </svg>
  );

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
          <div className="attendance-toolbar-actions" style={{ display: "flex", gap: "10px" }}>
            <button
              className={`attendance-icon-button guide-trigger ${showGuide ? "active" : ""}`}
              onClick={() => setShowGuide(!showGuide)}
              type="button"
              aria-label="Hướng dẫn"
              title="Hướng dẫn"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: showGuide ? "var(--primary-soft)" : "transparent",
                color: showGuide ? "var(--primary)" : "inherit"
              }}
            >
              <InfoIcon />
              <span className="sr-only">Hướng dẫn</span>
            </button>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          {showGuide && (
            <div 
              className="guide-popover guide-popover-inline" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
              position: "absolute",
              top: "0",
              right: "0",
              zIndex: 100,
              width: "320px",
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid var(--border)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              animation: "fadeIn 0.2s ease-out"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ padding: "6px", backgroundColor: "var(--primary-soft)", color: "var(--primary)", borderRadius: "6px" }}>
                  <InfoIcon />
                </div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Hướng dẫn chấm điểm</h4>
              </div>
              <ul className="guide-list" style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--foreground-muted)", lineHeight: "1.6" }}>
                <li style={{ marginBottom: "6px" }}>Nhập điểm trực tiếp vào từng ô (thang điểm 10).</li>
                <li style={{ marginBottom: "6px" }}>Hệ thống <strong>tự động lưu</strong> và <strong>tính toán ĐTB</strong> ngay khi bạn nhấn ra ngoài.</li>
                <li>Điểm {label} chiếm {isAssignment ? "30%" : "40%"} trong điểm tổng kết của học viên.</li>
              </ul>
              <button 
                onClick={() => setShowGuide(false)}
                style={{ 
                  marginTop: "16px", 
                  width: "100%", 
                  padding: "8px", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: "var(--primary)", 
                  color: "white", 
                  fontWeight: 600, 
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Đã hiểu
              </button>
            </div>
          )}
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
                  <>
                    <th style={{ width: "120px", textAlign: "center" }}>Điểm đồ án</th>
                    <th>Link Đồ án</th>
                  </>
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
                        <>
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
                                width: "80px",
                                textAlign: "center"
                              }}
                            />
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input 
                                type="text" 
                                placeholder="https://..." 
                                defaultValue={enrollment.projectUrl || ""}
                                onBlur={(e) => {
                                  if (e.target.value !== (enrollment.projectUrl || "")) {
                                    onUpdateProjectLink?.(enrollment.id, e.target.value);
                                  }
                                }}
                                disabled={isSaving}
                                style={{ 
                                  padding: "8px 12px", 
                                  borderRadius: "8px", 
                                  border: "1px solid var(--border)", 
                                  flex: 1,
                                  fontSize: "13px"
                                }}
                              />
                              {enrollment.projectUrl && (
                                <a 
                                  href={enrollment.projectUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    width: "36px",
                                    height: "36px",
                                    background: "#e0f2fe",
                                    color: "#0369a1",
                                    borderRadius: "8px",
                                    transition: "all 0.2s"
                                  }}
                                  title="Xem đồ án"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                </a>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={isAssignment ? 3 + sessionCount : 5}>Chọn lớp để thực hiện chấm điểm.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
