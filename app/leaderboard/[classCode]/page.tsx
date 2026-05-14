import { notFound } from "next/navigation";
import React from "react";
import fs from "fs";
import path from "path";

export const revalidate = 60; 

async function getLeaderboardData(classCode: string) {
  try {
    const filePath = path.join(process.cwd(), "data", "leaderboards", `${classCode}.json`);
    if (!fs.existsSync(filePath)) {
      return { error: `Bảng xếp hạng cho lớp ${classCode} chưa được chia sẻ.` };
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (err: any) {
    return { error: "Lỗi hệ thống khi tải dữ liệu." };
  }
}

export default async function LeaderboardPage({ params }: { params: Promise<{ classCode: string }> }) {
  const { classCode } = await params;
  const data = await getLeaderboardData(classCode);

  if (data.error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: "#1e293b", padding: "20px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "400px", padding: "40px", background: "white", borderRadius: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🌱</div>
          <h2 style={{ fontSize: "24px", marginBottom: "12px", fontWeight: 800 }}>Thông báo</h2>
          <p style={{ color: "#64748b", marginBottom: "32px" }}>{data.error}</p>
          <a href="/" style={{ display: "inline-block", padding: "12px 32px", background: "#10b981", color: "white", borderRadius: "12px", textDecoration: "none", fontWeight: 700 }}>Quay lại</a>
        </div>
      </div>
    );
  }

  const { classInfo, topStudents, isFinished, updatedAt } = data;
  const top3 = topStudents.slice(0, 3);
  const theRest = topStudents.slice(3);

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#fdfdfd",
      backgroundImage: "radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent), radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.05), transparent)",
      padding: "60px 20px",
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      color: "#1e293b"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div style={{ 
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "8px 20px", background: "rgba(16, 185, 129, 0.1)", color: "#059669",
            borderRadius: "100px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "24px",
            border: "1px solid rgba(16, 185, 129, 0.2)"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            Bảng vàng học tập
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 800, margin: "0 0 12px 0", color: "#064e3b" }}>
            Top 10 Học viên Xuất sắc
          </h1>
          <p style={{ color: "#64748b", fontSize: "18px" }}>
            Lớp: <span style={{ color: "#10b981", fontWeight: 700 }}>{classInfo.class_name}</span> • Mã: <span style={{ color: "#1e293b", fontWeight: 600 }}>{classInfo.class_code}</span>
          </p>
        </div>

        {/* Top 3 Podium - Light Mode */}
        <div style={{ 
          display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "15px", marginBottom: "60px", padding: "0 10px"
        }}>
          {/* Rank 2 */}
          {top3[1] && (
            <div style={{ textAlign: "center", flex: 1, maxWidth: "160px" }}>
              <div style={{ position: "relative", marginBottom: "15px" }}>
                <div style={{ width: "80px", height: "80px", margin: "0 auto", borderRadius: "50%", border: "4px solid #94a3b8", padding: "4px", background: "white", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "#94a3b8" }}>
                    {top3[1].name.charAt(0)}
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", background: "#94a3b8", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>2</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", color: "#475569" }}>{top3[1].name}</div>
              <div style={{ color: "#64748b", fontSize: "18px", fontWeight: 800 }}>{top3[1].final}</div>
              <div style={{ height: "60px", background: "linear-gradient(to top, #f1f5f9, white)", borderRadius: "12px 12px 0 0", marginTop: "15px", border: "1px solid #e2e8f0", borderBottom: "none" }}></div>
            </div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <div style={{ textAlign: "center", flex: 1, maxWidth: "200px", transform: "translateY(-20px)" }}>
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <div style={{ position: "absolute", top: "-35px", left: "50%", transform: "translateX(-50%)", fontSize: "42px" }}>👑</div>
                <div style={{ width: "110px", height: "110px", margin: "0 auto", borderRadius: "50%", border: "5px solid #10b981", padding: "5px", background: "white", boxShadow: "0 15px 30px rgba(16, 185, 129, 0.15)" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: 800, color: "white" }}>
                    {top3[0].name.charAt(0)}
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "white", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, border: "3px solid white" }}>1</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "18px", marginBottom: "4px", color: "#064e3b" }}>{top3[0].name}</div>
              <div style={{ color: "#10b981", fontSize: "32px", fontWeight: 800 }}>{top3[0].final}</div>
              <div style={{ height: "100px", background: "linear-gradient(to top, rgba(16, 185, 129, 0.1), white)", borderRadius: "16px 16px 0 0", marginTop: "15px", border: "1px solid rgba(16, 185, 129, 0.2)", borderBottom: "none" }}></div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div style={{ textAlign: "center", flex: 1, maxWidth: "160px" }}>
              <div style={{ position: "relative", marginBottom: "15px" }}>
                <div style={{ width: "80px", height: "80px", margin: "0 auto", borderRadius: "50%", border: "4px solid #d97706", padding: "4px", background: "white", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "#d97706" }}>
                    {top3[2].name.charAt(0)}
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", background: "#d97706", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>3</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", color: "#475569" }}>{top3[2].name}</div>
              <div style={{ color: "#b45309", fontSize: "18px", fontWeight: 800 }}>{top3[2].final}</div>
              <div style={{ height: "40px", background: "linear-gradient(to top, #fff7ed, white)", borderRadius: "12px 12px 0 0", marginTop: "15px", border: "1px solid #ffedd5", borderBottom: "none" }}></div>
            </div>
          )}
        </div>

        {/* Ranking List - Light Theme */}
        <div style={{ 
          background: "white", 
          borderRadius: "32px", 
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "20px 24px", textAlign: "left", fontSize: "13px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Hạng</th>
                <th style={{ padding: "20px 24px", textAlign: "left", fontSize: "13px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Học viên</th>
                <th style={{ padding: "20px 24px", textAlign: "center", fontSize: "13px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Chỉ số</th>
                <th style={{ padding: "20px 24px", textAlign: "right", fontSize: "13px", color: "#10b981", fontWeight: 800, textTransform: "uppercase" }}>
                  {isFinished ? "Tổng điểm" : "Tích luỹ"}
                </th>
              </tr>
            </thead>
            <tbody>
              {theRest.map((student: any, idx: number) => {
                const rank = idx + 4;
                const isSpecialRank = rank === 4 || rank === 5;
                const rankColor = rank === 4 ? "#3b82f6" : rank === 5 ? "#6366f1" : "#94a3b8";
                
                return (
                  <tr key={student.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px" }}>
                      {isSpecialRank ? (
                        <div style={{ 
                          width: "28px", height: "28px", borderRadius: "50%", 
                          backgroundColor: rankColor, color: "white", 
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 800, boxShadow: `0 3px 6px ${rankColor}33`
                        }}>
                          {rank}
                        </div>
                      ) : (
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#cbd5e1", paddingLeft: "8px" }}>{rank}</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: isSpecialRank ? "#1e293b" : "#475569" }}>{student.name}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                        <div style={{ padding: "6px 10px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", textAlign: "center", minWidth: "60px" }}>
                          <div style={{ fontSize: "9px", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>Chuyên cần</div>
                          <div style={{ fontWeight: 800, color: "#065f46", fontSize: "12px" }}>{student.attendance}</div>
                        </div>
                        <div style={{ padding: "6px 10px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "8px", textAlign: "center", minWidth: "60px" }}>
                          <div style={{ fontSize: "9px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>Bài tập</div>
                          <div style={{ fontWeight: 800, color: "#3730a3", fontSize: "12px" }}>{student.assignment}</div>
                        </div>
                        <div style={{ padding: "6px 10px", background: "rgba(245, 158, 11, 0.05)", borderRadius: "8px", textAlign: "center", minWidth: "60px" }}>
                          <div style={{ fontSize: "9px", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>Đồ án</div>
                          <div style={{ fontWeight: 800, color: "#92400e", fontSize: "12px" }}>{student.project}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>{student.final}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
            Cập nhật lúc: <strong style={{ color: "#64748b" }}>{updatedAt}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <img 
              src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" 
              alt="Dua Edu" 
              style={{ height: "32px", opacity: 0.6 }}
            />
            <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }}></div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
              Data Upgrade Ability
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        body { margin: 0; background: #fdfdfd; }
        * { box-sizing: border-box; }
        tr:hover { background: #fcfcfd; }
      `}} />
    </div>
  );
}
