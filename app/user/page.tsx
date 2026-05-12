"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Course {
  id: string;
  name: string;
  course_code: string;
}

interface Class {
  id: string;
  class_name: string;
  class_code: string;
  start_date: string;
  courses: Course;
}

interface Enrollment {
  id: string;
  status: string;
  classes: Class;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      if (session.user.user_metadata?.role !== "student") {
        router.push("/");
        return;
      }

      setUser(session.user);
      await loadStudentData(session.user);
    };

    checkUser();
  }, [router]);

  const loadStudentData = async (user: any) => {
    try {
      const studentId = user.user_metadata?.student_id;
      if (!studentId) return;

      // Fetch student record
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();
      setStudentInfo(student);

      // Fetch enrollments with classes and courses
      const { data: enrollData, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          classes (
            id,
            class_name,
            class_code,
            start_date,
            courses (
              id,
              name,
              course_code
            )
          )
        `)
        .eq("student_id", studentId);

      if (error) throw error;
      setEnrollments((enrollData as any[]) || []);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Đang tải dữ liệu của bạn...</p>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");

  return (
    <div className="student-layout">
      {/* Sidebar / Nav */}
      <nav className="student-nav">
        <div className="nav-brand">
          <img src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" alt="Logo" className="nav-logo" />
          <span>Học Viên Portal</span>
        </div>
        <div className="nav-user">
          <div className="user-avatar">
            {(studentInfo?.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name">{studentInfo?.full_name || "Học viên"}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="logout-icon-button" title="Đăng xuất">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </nav>

      <main className="student-main">
        <header className="main-header">
          <h1>Chào mừng trở lại, {studentInfo?.full_name?.split(" ").pop() || "bạn"}! 👋</h1>
          <p>Dưới đây là tiến độ học tập của bạn tại Dua-Edu.</p>
        </header>

        <div className="dashboard-grid">
          {/* Active Classes */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="icon-box blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <h2>Lớp học đang ghi danh</h2>
              <span className="count-badge">{activeEnrollments.length}</span>
            </div>

            <div className="course-list">
              {activeEnrollments.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn hiện không có lớp học nào đang diễn ra.</p>
                </div>
              ) : (
                activeEnrollments.map(enroll => (
                  <div key={enroll.id} className="course-card">
                    <div className="card-content">
                      <p className="course-type">{enroll.classes.courses?.course_code || "KH"}</p>
                      <h3>{enroll.classes.class_name}</h3>
                      <p className="class-meta">Mã lớp: {enroll.classes.class_code}</p>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar" style={{ width: "45%" }}></div>
                      </div>
                      <div className="card-footer">
                        <span>Bắt đầu: {new Date(enroll.classes.start_date).toLocaleDateString("vi-VN")}</span>
                        <button className="enter-button">Vào lớp</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Completed Courses */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="icon-box green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2>Khóa học đã hoàn thành</h2>
              <span className="count-badge">{completedEnrollments.length}</span>
            </div>

            <div className="course-list horizontal">
              {completedEnrollments.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn chưa có khóa học nào hoàn thành.</p>
                </div>
              ) : (
                completedEnrollments.map(enroll => (
                  <div key={enroll.id} className="course-card completed">
                    <div className="card-content">
                      <div className="completed-badge">✓ Hoàn thành</div>
                      <h3>{enroll.classes.courses?.name}</h3>
                      <p className="class-meta">{enroll.classes.class_name}</p>
                      <button className="certificate-button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9l-3 3H2v12h20V7z"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>
                        Xem chứng chỉ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .student-layout {
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .student-nav {
          background: #ffffff;
          padding: 12px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 18px;
          color: #0f172a;
        }

        .nav-logo {
          height: 32px;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 99px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .user-details {
          line-height: 1.2;
        }

        .user-name {
          font-size: 13px;
          font-weight: 700;
          margin: 0;
        }

        .user-email {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }

        .logout-icon-button {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: transform 0.2s;
        }

        .logout-icon-button:hover {
          transform: scale(1.1);
        }

        .student-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .main-header {
          margin-bottom: 40px;
        }

        .main-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 8px;
          color: #0f172a;
        }

        .main-header p {
          color: #64748b;
          font-size: 16px;
        }

        .dashboard-grid {
          display: grid;
          gap: 40px;
        }

        .dashboard-section {
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box.blue { background: #eff6ff; color: #2563eb; }
        .icon-box.green { background: #f0fdf4; color: #16a34a; }

        .section-header h2 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          flex: 1;
        }

        .count-badge {
          background: #f1f5f9;
          padding: 2px 12px;
          border-radius: 99px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .course-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .course-list.horizontal {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }

        .course-card {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .course-card:hover {
          border-color: #6366f1;
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }

        .course-type {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .course-card h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .class-meta {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 20px;
        }

        .progress-bar-wrap {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          margin-bottom: 20px;
        }

        .progress-bar {
          height: 100%;
          background: #6366f1;
          border-radius: 3px;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
        }

        .enter-button {
          background: #0f172a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .completed-badge {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .course-card.completed {
          background: #fcfdfd;
        }

        .certificate-button {
          width: 100%;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          margin-top: 10px;
        }

        .empty-state {
          grid-column: 1 / -1;
          padding: 40px;
          text-align: center;
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          color: #94a3b8;
        }

        .loading-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: #64748b;
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
