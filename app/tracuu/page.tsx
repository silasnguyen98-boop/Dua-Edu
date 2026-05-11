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
    class_sessions?: {
      session_number: number;
      session_title: string;
      session_date: string | null;
      start_time: string | null;
      end_time: string | null;
      meeting_url: string | null;
      recording_url: string | null;
      slide_url: string | null;
      reference_url: string | null;
      assignment_url: string | null;
    }[];
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
              ),
              class_sessions (
                session_number,
                session_title,
                session_date,
                start_time,
                end_time,
                meeting_url,
                recording_url,
                slide_url,
                reference_url,
                assignment_url
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
        return <span className="status-badge active-badge">Đang học</span>;
      case "completed":
        return <span className="status-badge completed-badge">Hoàn thành</span>;
      case "dropped":
        return <span className="status-badge dropped-badge">Bỏ học</span>;
      case "reserved":
        return <span className="status-badge reserved-badge">Bảo lưu</span>;
      case "cancelled":
        return <span className="status-badge cancelled-badge">Đã huỷ</span>;
      default:
        return <span className="status-badge default-badge">Chưa rõ</span>;
    }
  };

  return (
    <div className="tracuu-container">
      {/* Dynamic Background */}
      <div className="bg-shape bg-shape-1"></div>
      <div className="bg-shape bg-shape-2"></div>

      {/* Header */}
      <header className="tracuu-header">
        <div className="header-content">
          <div className="logo-section">
            <img alt="Dua-Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" className="logo-img" />
            <h1 className="logo-text">Cổng Học Viên</h1>
          </div>
          <Link href="/login" className="login-link">
            Đăng nhập Quản trị
          </Link>
        </div>
      </header>

      <main className="tracuu-main">
        {/* Search Hero Box */}
        <div className={`search-card ${searched && !loading ? 'search-card-compact' : ''}`}>
          <h2 className="search-title">Tra cứu Điểm & Lịch học</h2>
          <p className="search-subtitle">Nhập địa chỉ Email bạn đã đăng ký để xem tiến trình học tập.</p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="input-group">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ví dụ: student@gmail.com" 
                required
                className="search-input"
              />
            </div>
            <button type="submit" disabled={loading} className={`search-btn ${loading ? 'loading' : ''}`}>
              {loading ? "Đang tìm..." : "Tra cứu ngay"}
            </button>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results */}
        {!loading && searched && studentData && (
          <div className="results-container">
            <div className="student-profile">
              <div className="profile-avatar">
                {studentData.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="profile-name">{studentData.full_name}</h3>
                <p className="profile-email">{studentData.email}</p>
              </div>
            </div>

            {studentData.enrollments && studentData.enrollments.length > 0 ? (
              <div className="classes-grid">
                {studentData.enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="class-card animate-fade-in">
                    <div className="class-card-header">
                      <div>
                        <div className="course-name">
                          {enrollment.classes?.courses?.name ?? "Khoá học"}
                        </div>
                        <h4 className="class-name">
                          {enrollment.classes?.class_name ?? "Lớp học chưa rõ"}
                        </h4>
                        <div className="class-code">
                          Mã lớp: {enrollment.classes?.class_code ?? "-"}
                        </div>
                      </div>
                      <div className="class-status">
                        {renderStatus(enrollment.status)}
                      </div>
                    </div>

                    <div className="scores-grid">
                      <div className="score-item">
                        <div className="score-label">Chuyên cần</div>
                        <div className="score-value">{enrollment.attendance_score ?? "-"}</div>
                      </div>
                      <div className="score-item">
                        <div className="score-label">Bài tập</div>
                        <div className="score-value">{enrollment.assignment_score ?? "-"}</div>
                      </div>
                      <div className="score-item">
                        <div className="score-label">Đồ án</div>
                        <div className="score-value">{enrollment.project_score ?? "-"}</div>
                      </div>
                      <div className="score-item score-final">
                        <div className="score-label">Tổng kết</div>
                        <div className="score-value">{enrollment.final_score ?? "-"}</div>
                      </div>
                    </div>

                    {enrollment.status === "active" && enrollment.classes?.class_sessions && enrollment.classes.class_sessions.length > 0 && (
                      <div className="sessions-section">
                        <h5 className="sessions-title">Lịch học & Tài nguyên</h5>
                        <div className="sessions-list">
                          {enrollment.classes.class_sessions
                            .sort((a, b) => a.session_number - b.session_number)
                            .map((session) => (
                            <div key={session.session_number} className="session-item">
                              <div className="session-info">
                                <div className="session-name">Buổi {session.session_number}: {session.session_title}</div>
                                <div className="session-time">
                                  {session.session_date ? new Intl.DateTimeFormat("vi-VN").format(new Date(session.session_date)) : "Chưa có ngày"} • {session.start_time ? session.start_time.slice(0,5) : "-"} đến {session.end_time ? session.end_time.slice(0,5) : "-"}
                                </div>
                              </div>
                              <div className="session-links">
                                {session.meeting_url && (
                                  <a href={session.meeting_url} target="_blank" rel="noreferrer" className="link-btn link-meeting">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                    Link học
                                  </a>
                                )}
                                {session.slide_url && (
                                  <a href={session.slide_url} target="_blank" rel="noreferrer" className="link-btn link-slide">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                    Slide
                                  </a>
                                )}
                                {session.reference_url && (
                                  <a href={session.reference_url} target="_blank" rel="noreferrer" className="link-btn link-doc">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    Tài liệu
                                  </a>
                                )}
                                {session.assignment_url && (
                                  <a href={session.assignment_url} target="_blank" rel="noreferrer" className="link-btn link-assignment">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Bài tập
                                  </a>
                                )}
                                {session.recording_url && (
                                  <a href={session.recording_url} target="_blank" rel="noreferrer" className="link-btn link-record">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                                    Record
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <p>Học viên này chưa ghi danh vào lớp nào.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .tracuu-container {
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-geist-sans);
          color: #0f172a;
          position: relative;
          overflow: hidden;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 0;
          opacity: 0.4;
        }

        .bg-shape-1 {
          top: -10%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          background: rgba(99, 102, 241, 0.4);
        }

        .bg-shape-2 {
          bottom: -20%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: rgba(16, 185, 129, 0.3);
        }

        .tracuu-header {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 16px 24px;
          position: sticky;
          top: 0;
        }

        .header-content {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-img {
          height: 36px;
          border-radius: 8px;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(to right, #0f172a, #475569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-link {
          color: #64748b;
          font-size: 14px;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .login-link:hover {
          color: #0f172a;
          background: rgba(0, 0, 0, 0.05);
        }

        .tracuu-main {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .search-card {
          width: 100%;
          max-width: 600px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          padding: 48px;
          border: 1px solid rgba(255, 255, 255, 1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-card-compact {
          padding: 32px;
          margin-bottom: 40px;
        }

        .search-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
          text-align: center;
          background: linear-gradient(to right, #4f46e5, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-card-compact .search-title {
          font-size: 24px;
        }

        .search-subtitle {
          color: #475569;
          text-align: center;
          margin-bottom: 32px;
          font-size: 16px;
        }

        .search-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 500px;
          margin: 0 auto;
        }

        @media (min-width: 600px) {
          .search-form {
            flex-direction: row;
          }
        }

        .input-group {
          position: relative;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #0f172a;
          font-size: 16px;
          text-align: left;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .search-btn {
          width: 100%;
          padding: 16px 32px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .search-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .search-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        @media (min-width: 600px) {
          .search-btn {
            width: auto;
            white-space: nowrap;
          }
        }

        .search-btn.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          color: #ef4444;
          text-align: center;
          margin-top: 16px;
          font-size: 14px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
        }

        .results-container {
          width: 100%;
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .student-profile {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d399, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .profile-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #0f172a;
        }

        .profile-email {
          color: #475569;
          margin: 0;
          font-size: 15px;
        }

        .classes-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .class-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 1);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .class-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }

        .class-card-header {
          padding: 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .course-name {
          font-size: 12px;
          color: #4f46e5;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .class-name {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: #0f172a;
        }

        .class-code {
          font-size: 14px;
          color: #64748b;
          margin-top: 6px;
        }

        .scores-grid {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 16px;
          background: #f8fafc;
        }

        .score-item {
          text-align: center;
          padding: 20px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: transform 0.2s;
        }

        .score-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.04);
        }

        .score-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 10px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .score-value {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
        }

        .score-final {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .score-final .score-label {
          color: #059669;
        }

        .score-final .score-value {
          color: #10b981;
          text-shadow: none;
        }

        .sessions-section {
          padding: 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .sessions-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-item {
          padding: 20px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: background 0.2s, border-color 0.2s;
        }

        .session-item:hover {
          background: #f8fafc;
          border-color: rgba(0, 0, 0, 0.1);
        }

        .session-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .session-name {
          font-weight: 600;
          font-size: 16px;
          color: #0f172a;
        }

        .session-time {
          font-size: 14px;
          color: #64748b;
        }

        .session-links {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }

        .link-btn svg {
          width: 14px;
          height: 14px;
        }

        .link-meeting {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        .link-meeting:hover { background: rgba(59, 130, 246, 0.2); color: #1d4ed8; }

        .link-slide {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .link-slide:hover { background: #e2e8f0; color: #0f172a; }

        .link-doc {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .link-doc:hover { background: #e2e8f0; color: #0f172a; }

        .link-assignment {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }
        .link-assignment:hover { background: rgba(245, 158, 11, 0.2); color: #b45309; }

        .link-record {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        .link-record:hover { background: rgba(239, 68, 68, 0.2); color: #b91c1c; }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .active-badge { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
        .completed-badge { background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2); }
        .dropped-badge { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2); }
        .reserved-badge { background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2); }
        .cancelled-badge { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .default-badge { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          color: #94a3b8;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: slideUp 0.5s ease forwards;
        }
      `}} />
    </div>
  );
}
