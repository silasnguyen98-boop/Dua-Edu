"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type EnrollmentData = {
  id: string;
  status: string | null;
  attendance_score: number | null;
  assignment_score: number | null;
  project_score: number | null;
  final_score: number | null;
  classes: {
    id: string;
    class_code: string;
    class_name: string;
    courses: {
      name: string;
    } | null;
  } | null;
};

type StudentData = {
  id: string;
  full_name: string;
  email: string;
  enrollments: EnrollmentData[];
};

export default function TraCuuPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setStudentData(null);
    setSearched(true);

    try {
      const { data, error: searchError } = await supabase
        .from("students")
        .select(`
          id,
          full_name,
          email,
          enrollments (
            id,
            status,
            attendance_score,
            assignment_score,
            project_score,
            final_score,
            classes (
              id,
              class_code,
              class_name,
              courses (
                name
              )
            )
          )
        `)
        .eq("email", email.trim().toLowerCase())
        .single();

      if (searchError) {
        if (searchError.code === "PGRST116") {
          setError("Không tìm thấy học viên với email này. Vui lòng kiểm tra lại.");
        } else {
          setError("Có lỗi xảy ra: " + searchError.message);
        }
      } else {
        setStudentData(data as unknown as StudentData);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Đã xảy ra sự cố: " + err.message);
      } else {
        setError("Đã xảy ra sự cố không xác định.");
      }
    } finally {
      setLoading(false);
    }
  }

  const renderStatus = (status: string | null) => {
    switch (status) {
      case "active":
        return <span className="status-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>Đang học</span>;
      case "completed":
        return <span className="status-badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" }}>Hoàn thành</span>;
      case "dropped":
        return <span className="status-badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444" }}>Bỏ học</span>;
      case "reserved":
        return <span className="status-badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" }}>Bảo lưu</span>;
      case "cancelled":
        return <span className="status-badge" style={{ background: "rgba(107, 114, 128, 0.15)", color: "#6B7280" }}>Đã huỷ</span>;
      default:
        return <span className="status-badge" style={{ background: "var(--border)", color: "var(--foreground)" }}>Chưa rõ</span>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-geist-sans)" }}>
      {/* Header */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img alt="Dua-Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" style={{ height: "32px", borderRadius: "8px" }} />
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--foreground)" }}>Cổng tra cứu kết quả học tập</h1>
        </div>
        <Link href="/" style={{ color: "var(--text-secondary)", fontSize: "14px", textDecoration: "none" }}>
          Đăng nhập Quản trị
        </Link>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Search Box */}
        <div style={{ background: "var(--surface)", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", border: "1px solid var(--border)", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", textAlign: "center" }}>Tra cứu điểm & trạng thái</h2>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "24px" }}>Vui lòng nhập địa chỉ Email bạn đã đăng ký để xem kết quả học tập.</p>
          
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", maxWidth: "500px", margin: "0 auto" }}>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ví dụ: student@gmail.com" 
              required
              style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "16px", outline: "none" }}
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontSize: "16px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }}
            >
              {loading ? "Đang tìm..." : "Tra cứu"}
            </button>
          </form>
          {error && <div style={{ color: "#EF4444", textAlign: "center", marginTop: "16px", fontSize: "14px", padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>{error}</div>}
        </div>

        {/* Results */}
        {!loading && searched && studentData && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600 }}>Kết quả tra cứu</h3>
              <p style={{ color: "var(--text-secondary)" }}>Học viên: <strong style={{ color: "var(--foreground)" }}>{studentData.full_name}</strong> ({studentData.email})</p>
            </div>

            {studentData.enrollments && studentData.enrollments.length > 0 ? (
              <div style={{ display: "grid", gap: "24px" }}>
                {studentData.enrollments.map((enrollment) => (
                  <div key={enrollment.id} style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          {enrollment.classes?.courses?.name ?? "Khoá học"}
                        </div>
                        <h4 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                          {enrollment.classes?.class_name ?? "Lớp học chưa rõ"}
                        </h4>
                        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Mã lớp: {enrollment.classes?.class_code ?? "-"}
                        </div>
                      </div>
                      <div>
                        {renderStatus(enrollment.status)}
                      </div>
                    </div>

                    <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px", background: "rgba(0,0,0,0.2)" }}>
                      <div style={{ textAlign: "center", padding: "16px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", fontWeight: 500 }}>Chuyên cần</div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>{enrollment.attendance_score ?? "-"}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "16px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", fontWeight: 500 }}>Bài tập</div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>{enrollment.assignment_score ?? "-"}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "16px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", fontWeight: 500 }}>Đồ án</div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>{enrollment.project_score ?? "-"}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "16px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        <div style={{ fontSize: "12px", color: "#10B981", marginBottom: "8px", textTransform: "uppercase", fontWeight: 600 }}>Tổng kết</div>
                        <div style={{ fontSize: "28px", fontWeight: 800, color: "#10B981" }}>{enrollment.final_score ?? "-"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <p style={{ color: "var(--text-secondary)" }}>Học viên này chưa ghi danh vào lớp nào.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
        }
        input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        button:hover:not(:disabled) {
          background: var(--primary-hover) !important;
          transform: translateY(-1px);
        }
      `}} />
    </div>
  );
}
