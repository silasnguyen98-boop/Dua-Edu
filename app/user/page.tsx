"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Premium SVG Icons
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  ),
  Courses: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
  ),
  Certificate: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-2 5L9 9l11 4-5 2zm0 0l4 8 3-1" /></svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  ),
  Trending: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  )
};

const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";
const certTemplateUrl = "https://i.ibb.co/C3y0T27X/media-1778613363361.png"; // Fallback URL or use local path

const getSingle = <T,>(value?: T | T[] | null) => (Array.isArray(value) ? value[0] : value) ?? null;

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

const toNumber = (value?: number | null) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export default function StudentDashboard() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const loadStudentData = useCallback(async (authUser: User) => {
    try {
      const metadataStudentId = String(authUser.user_metadata?.student_id || "");
      const { data: student } = metadataStudentId
        ? await supabase.from("students").select("*").eq("id", metadataStudentId).maybeSingle()
        : await supabase.from("students").select("*").eq("email", authUser.email || "").maybeSingle();

      if (!student) return;
      setStudentInfo(student);

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select(`
          id, status, attendance_score, assignment_score, project_score, final_score, note, created_at,
          classes (
            id, class_name, class_code, start_date, total_sessions, schedule, study_time,
            courses ( id, name, course_code, course_type ),
            teachers ( id, full_name )
          )
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      const nextEnrollments = ((enrollmentData as any[] | null) ?? []).filter((item) => item.classes);
      setEnrollments(nextEnrollments);

      const enrollmentIds = nextEnrollments.map((item) => item.id);
      if (enrollmentIds.length > 0) {
        const { data: certificateData } = await supabase
          .from("certificates")
          .select("*, enrollments(classes(class_code, courses(name)))")
          .in("enrollment_id", enrollmentIds);
        setCertificates(certificateData ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        router.push("/login");
        return;
      }
      await loadStudentData(session.user);
    };
    checkUser();
    return () => { active = false; };
  }, [loadStudentData, router]);

  const activeEnrollments = useMemo(() => enrollments.filter((e) => e.status !== "completed"), [enrollments]);
  const completedEnrollments = useMemo(() => enrollments.filter((e) => e.status === "completed"), [enrollments]);
  
  const learningXp = useMemo(() => {
    return enrollments.reduce((sum, e) => {
      const bonus = (toNumber(e.attendance_score) + toNumber(e.assignment_score) + toNumber(e.project_score)) * 10;
      return sum + (e.status === "completed" ? 500 : 100) + bonus;
    }, 0);
  }, [enrollments]);

  const level = Math.floor(learningXp / 1000) + 1;
  const progress = (learningXp % 1000) / 10;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="dua-logo-anim">DUA</div>
        <style jsx>{`
          .loading-container { height: 100vh; display: grid; place-items: center; background: #f8fafc; }
          .dua-logo-anim { font-size: 48px; font-weight: 900; color: #10b981; animation: pulse 1.5s infinite; letter-spacing: -2px; }
          @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.5; transform: scale(0.95); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Background Decor */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <img src={logoUrl} alt="DUA" />
        </div>
        <nav className="menu">
          <button className={activeNav === "dashboard" ? "active" : ""} onClick={() => setActiveNav("dashboard")}>
            <Icons.Dashboard /> <span>Bảng điều khiển</span>
          </button>
          <button className={activeNav === "courses" ? "active" : ""} onClick={() => setActiveNav("courses")}>
            <Icons.Courses /> <span>Khóa học của tôi</span>
          </button>
          <button className={activeNav === "certs" ? "active" : ""} onClick={() => setActiveNav("certs")}>
            <Icons.Certificate /> <span>Chứng nhận của tôi</span>
          </button>
          <button className={activeNav === "wishlist" ? "active" : ""} onClick={() => setActiveNav("wishlist")}>
            <Icons.User /> <span>Danh sách yêu thích</span>
          </button>
        </nav>
        <button className="logout" onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}>
          <Icons.Logout /> <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main">
        <header className="header">
          <div className="greeting">
            <h1>Chào {studentInfo?.full_name?.split(" ").pop() || "bạn"}! 👋</h1>
            <p>Hôm nay bạn đã sẵn sàng cho những kiến thức mới chưa?</p>
          </div>
          <div className="top-user-info">
            <div className="level-box">
              <span className="lv-label">Cấp độ</span>
              <span className="lv-val">{level}</span>
            </div>
            <div className="avatar-circle">
              {studentInfo?.full_name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <div className="scroll-content">
          {activeNav === "dashboard" && (
            <>
              {/* Quick Widgets */}
              <div className="widgets-row">
                <div className="widget-card xp">
                  <div className="widget-icon"><Icons.Trending /></div>
                  <div className="widget-data">
                    <span className="w-label">Tích lũy học tập</span>
                    <span className="w-val">{Math.round(learningXp)} XP</span>
                  </div>
                </div>
                <div className="widget-card done">
                  <div className="widget-icon"><Icons.Check /></div>
                  <div className="widget-data">
                    <span className="w-label">Đã hoàn thành</span>
                    <span className="w-val">{completedEnrollments.length} khóa</span>
                  </div>
                </div>
                <div className="widget-card learning">
                  <div className="widget-icon"><Icons.Clock /></div>
                  <div className="widget-data">
                    <span className="w-label">Đang theo học</span>
                    <span className="w-val">{activeEnrollments.length} lớp</span>
                  </div>
                </div>
              </div>

              <div className="layout-grid">
                {/* Courses Section */}
                <div className="course-section">
                  <div className="section-head">
                    <h2>Lớp học của tôi</h2>
                    <button className="btn-link">Tất cả bài học</button>
                  </div>
                  <div className="course-cards-stack">
                    {activeEnrollments.length > 0 ? activeEnrollments.map(e => {
                      const classInfo = getSingle(e.classes);
                      const course = getSingle(classInfo?.courses);
                      const score = toNumber(e.final_score);
                      return (
                        <div className="course-card-premium" key={e.id}>
                          <div className="course-image">
                            <div className="course-code-badge">{course?.course_code}</div>
                          </div>
                          <div className="course-body">
                            <h3>{course?.name}</h3>
                            <p className="teacher-name">GV: {getSingle(classInfo?.teachers)?.full_name || "DUA Team"}</p>
                            <div className="progress-group">
                              <div className="prog-label">
                                <span>Tiến độ học tập</span>
                                <span>{score}%</span>
                              </div>
                              <div className="prog-track">
                                <div className="prog-fill" style={{ width: `${Math.max(5, score)}%` }}></div>
                              </div>
                            </div>
                            <div className="course-tags-row">
                              <span className="c-tag">#{classInfo?.class_code}</span>
                              <span className="c-tag schedule">{classInfo?.schedule}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="empty-box">Bạn chưa có khóa học nào đang diễn ra.</div>
                    )}
                  </div>
                </div>

                {/* Sidebar widgets */}
                <div className="side-widgets">
                  <div className="side-card level-widget">
                    <h3>Tiến độ cấp độ</h3>
                    <div className="progress-circle-container">
                      <svg viewBox="0 0 36 36" className="circular-chart-premium">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="circle-inner-text">
                        <span className="big-num">{level}</span>
                        <span className="small-label">Cấp</span>
                      </div>
                    </div>
                    <p className="xp-remaining">Còn {(1000 - (learningXp % 1000)).toFixed(0)} XP để lên cấp kế tiếp</p>
                  </div>

                  <div className="side-card cert-widget-premium">
                    <div className="widget-head">
                      <h3>Chứng nhận</h3>
                      <Icons.Certificate />
                    </div>
                    {certificates.length > 0 ? (
                      <div className="cert-row">
                        <div className="cert-lead-icon">🏆</div>
                        <div className="cert-meta">
                          <strong>{certificates[0].certificate_code}</strong>
                          <span>Ngày cấp: {formatDate(certificates[0].issued_at)}</span>
                        </div>
                        <button className="btn-dl" onClick={() => setSelectedCert(certificates[0])}>
                          <Icons.Eye />
                        </button>
                      </div>
                    ) : (
                      <div className="cert-empty">Chưa có chứng nhận mới.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeNav === "certs" && (
            <div className="certs-page">
              <div className="certs-header">
                <h2>CHỨNG NHẬN CỦA TÔI ({certificates.length})</h2>
              </div>
              <div className="certs-grid">
                {certificates.length > 0 ? certificates.map(cert => {
                  const enrollment = getSingle(cert.enrollments);
                  const classInfo = getSingle(enrollment?.classes);
                  const course = getSingle(classInfo?.courses);
                  return (
                    <div className="cert-card-view" key={cert.id} onClick={() => setSelectedCert(cert)}>
                      <div className="cert-preview">
                        <div className="cert-placeholder">
                          <Icons.Certificate />
                          <span>Xem chi tiết chứng nhận</span>
                        </div>
                      </div>
                      <div className="cert-card-body">
                        <h3>{course?.name || "Chứng nhận hoàn thành"}</h3>
                        <div className="cert-sub-info">
                          <span className="class-tag">Lớp: {classInfo?.class_code || "N/A"}</span>
                          <span className="date-tag">Ngày cấp: {formatDate(cert.issued_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="empty-box">Bạn chưa có chứng nhận nào.</div>
                )}
              </div>
            </div>
          )}

          {(activeNav === "courses" || activeNav === "wishlist") && (
            <div className="empty-state-full">
              <div className="icon">📂</div>
              <h3>Tính năng đang phát triển</h3>
              <p>Phần này sẽ sớm được cập nhật trong thời gian tới. Cảm ơn bạn đã kiên nhẫn!</p>
              <button className="btn-primary" onClick={() => setActiveNav("dashboard")}>Quay lại Dashboard</button>
            </div>
          )}
        </div>
      </main>

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCert(null)}>×</button>
            <div className="cert-viewer-container">
              {/* Dynamic Certificate Layout */}
              <div className="cert-canvas">
                <img src="/cert-template.png" alt="Template" className="cert-bg" />
                <div className="cert-overlay">
                  <div className="student-name">{studentInfo?.full_name?.toUpperCase()}</div>
                  <div className="course-name-display">
                    {getSingle(getSingle(selectedCert.enrollments)?.classes)?.courses?.name}
                  </div>
                  <div className="issue-date-display">{formatDate(selectedCert.issued_at)}</div>
                  <div className="cert-id-display">{selectedCert.certificate_code}</div>
                </div>
              </div>
              <div className="viewer-actions">
                <button className="btn-primary" onClick={() => window.print()}>Tải xuống PDF</button>
                <p>Chứng nhận này được cấp bởi DUA Edu sau khi học viên hoàn thành khóa học.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .app-shell {
          display: flex;
          height: 100vh;
          background: #fdfdfd;
          overflow: hidden;
          position: relative;
          color: #2d3748;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
        }

        /* Background Graphics */
        .blob { position: absolute; filter: blur(100px); opacity: 0.25; z-index: 0; border-radius: 50%; }
        .blob-1 { width: 500px; height: 500px; background: #10b981; top: -150px; right: -100px; }
        .blob-2 { width: 400px; height: 400px; background: #34d399; bottom: -100px; left: -100px; }

        /* Sidebar */
        .sidebar {
          width: 250px;
          background: #ffffff;
          border-right: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          padding: 32px 20px;
          z-index: 10;
        }
        .brand { margin-bottom: 50px; }
        .brand img { height: 42px; }
        .menu { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .menu button, .logout {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border: none; background: none;
          color: #718096; font-weight: 600; font-size: 14px;
          border-radius: 14px; cursor: pointer; transition: 0.2s all ease;
        }
        .menu button:hover { background: #f7fafc; color: #10b981; }
        .menu button.active { 
          background: #ffffff; 
          color: #10b981; 
          border: 1.5px solid #10b981; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); 
        }
        .logout {
          position: fixed;
          left: 24px;
          bottom: 24px;
          z-index: 50;
          margin-top: 0;
          background: #ffffff;
          border: 1px solid #fed7d7;
          color: #e53e3e;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.12);
        }
        .logout:hover { background: #fff5f5; }

        /* Main Area */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; z-index: 5; position: relative; }
        .header { padding: 40px 50px 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .greeting h1 { font-size: 30px; font-weight: 800; margin: 0; color: #1a202c; letter-spacing: -0.5px; }
        .greeting p { color: #718096; margin: 6px 0 0; font-size: 15px; }
        
        .top-user-info { display: flex; align-items: center; gap: 20px; }
        .level-box { text-align: right; }
        .lv-label { display: block; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #a0aec0; letter-spacing: 1px; }
        .lv-val { font-size: 22px; font-weight: 900; color: #10b981; line-height: 1; }
        .avatar-circle { width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; display: grid; place-items: center; border-radius: 16px; font-weight: 800; font-size: 22px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2); }

        .scroll-content { flex: 1; overflow-y: auto; padding: 0 50px 50px; }

        /* Widgets */
        .widgets-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
        .widget-card { background: #ffffff; border-radius: 24px; padding: 26px; border: 1px solid #edf2f7; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: 0.3s; }
        .widget-card:hover { transform: translateY(-4px); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.08); }
        
        .widget-icon { width: 60px; height: 60px; border-radius: 18px; display: grid; place-items: center; }
        .xp .widget-icon { background: #f0fdf4; color: #10b981; }
        .done .widget-icon { background: #ecfdf5; color: #059669; }
        .learning .widget-icon { background: #fffbeb; color: #d97706; }

        .w-label { display: block; font-size: 13px; color: #718096; font-weight: 600; margin-bottom: 2px; }
        .w-val { font-size: 24px; font-weight: 800; color: #1a202c; }

        /* Grid Layout */
        .layout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
        .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-head h2 { font-size: 20px; font-weight: 800; margin: 0; color: #1a202c; }
        .btn-link { background: none; border: none; color: #10b981; font-weight: 700; cursor: pointer; font-size: 14px; }

        /* Course Cards */
        .course-cards-stack { display: grid; gap: 20px; }
        .course-card-premium { 
          background: #ffffff; 
          border: 1px solid #edf2f7; 
          border-radius: 24px; 
          padding: 20px; 
          display: flex; 
          gap: 20px; 
          transition: 0.3s; 
          cursor: pointer;
          align-items: center;
        }
        .course-card-premium:hover { border-color: #10b981; box-shadow: 0 12px 24px rgba(0,0,0,0.04); }
        
        .course-image { 
          width: 100px; 
          height: 100px; 
          border-radius: 20px; 
          background: linear-gradient(135deg, #10b981, #34d399); 
          position: relative; 
          flex-shrink: 0;
          overflow: hidden;
        }
        .course-code-badge { 
          position: absolute; 
          bottom: 8px; 
          left: 8px; 
          right: 8px;
          background: rgba(0,0,0,0.4); 
          color: #fff; 
          font-size: 9px; 
          font-weight: 800; 
          padding: 4px; 
          border-radius: 6px; 
          backdrop-filter: blur(8px); 
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .course-body { flex: 1; min-width: 0; }
        .course-body h3 { margin: 0 0 4px; font-size: 18px; color: #1a202c; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .teacher-name { margin: 0 0 16px; color: #718096; font-size: 13px; font-weight: 500; }
        
        .progress-group { margin-bottom: 12px; max-width: 400px; }
        .prog-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #4a5568; margin-bottom: 8px; }
        .prog-track { height: 6px; background: #f7fafc; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; }
        .prog-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 20px; }

        .course-tags-row { display: flex; gap: 8px; }
        .c-tag { font-size: 11px; font-weight: 700; color: #718096; background: #f7fafc; padding: 4px 10px; border-radius: 8px; }
        .c-tag:empty { display: none; }
        .c-tag.schedule { border: 1px solid #edf2f7; background: transparent; }

        /* Side Widgets */
        .side-widgets { display: flex; flex-direction: column; gap: 32px; }
        .side-card { background: #ffffff; border-radius: 24px; padding: 24px; border: 1px solid #edf2f7; box-shadow: 0 4px 12px rgba(0,0,0,0.01); }
        
        .level-widget { text-align: center; }
        .level-widget h3 { font-size: 16px; margin: 0 0 20px; color: #1a202c; }
        .progress-circle-container { width: 120px; height: 120px; margin: 0 auto 16px; position: relative; }
        .circular-chart-premium { width: 100%; height: 100%; }
        .circle-bg { fill: none; stroke: #f7fafc; stroke-width: 2.5; }
        .circle { fill: none; stroke: #10b981; stroke-width: 2.5; stroke-linecap: round; transition: 0.6s all ease; }
        .circle-inner-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; }
        .big-num { font-size: 32px; font-weight: 900; color: #1a202c; line-height: 1; }
        .small-label { font-size: 10px; text-transform: uppercase; font-weight: 800; color: #a0aec0; margin-top: 2px; }
        .xp-remaining { font-size: 12px; color: #718096; margin: 0; font-weight: 500; }

        .cert-widget-premium .widget-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cert-widget-premium h3 { font-size: 16px; margin: 0; color: #1a202c; font-weight: 800; }
        .cert-row { display: flex; align-items: center; gap: 14px; background: #f8fafc; padding: 14px 16px; border-radius: 20px; border: 1px solid #f1f5f9; }
        .cert-lead-icon { font-size: 24px; }
        .cert-meta { flex: 1; }
        .cert-meta strong { display: block; font-size: 14px; color: #1a202c; font-weight: 800; }
        .cert-meta span { font-size: 12px; color: #a0aec0; font-weight: 500; }
        .btn-dl { width: 36px; height: 36px; border-radius: 50%; background: #ffffff; display: grid; place-items: center; color: #10b981; border: 1px solid #edf2f7; transition: 0.2s; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .btn-dl:hover { transform: scale(1.1); box-shadow: 0 6px 12px rgba(16, 185, 129, 0.1); }

        /* Certs Page */
        .certs-header { border-left: 4px solid #10b981; padding-left: 16px; margin-bottom: 30px; }
        .certs-header h2 { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; }
        .certs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 30px; }
        .cert-card-view { background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: 0.3s; cursor: pointer; }
        .cert-card-view:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
        .cert-preview { width: 100%; aspect-ratio: 1.414 / 1; background: #f1f5f9; position: relative; border-bottom: 1px solid #edf2f7; padding: 16px; display: flex; justify-content: center; }
        .cert-placeholder { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #a0aec0; font-weight: 700; }
        .cert-card-body { padding: 24px; }
        .cert-card-body h3 { font-size: 20px; font-weight: 800; color: #10b981; margin: 0 0 12px; line-height: 1.3; }
        .cert-sub-info { display: flex; flex-wrap: wrap; gap: 12px; }
        .class-tag, .date-tag { font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 8px; }
        .class-tag { background: #f0fdf4; color: #10b981; }
        .date-tag { background: #f7fafc; color: #718096; }

        /* Modal Viewer */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 100; display: grid; place-items: center; padding: 40px; }
        .modal-content { background: white; border-radius: 32px; width: 100%; max-width: 1000px; position: relative; overflow: hidden; animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .close-btn { position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; border: none; font-size: 24px; cursor: pointer; z-index: 110; transition: 0.2s; }
        .close-btn:hover { background: #e2e8f0; transform: rotate(90deg); }
        
        .cert-viewer-container { padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 30px; }
        .cert-canvas { position: relative; width: 100%; aspect-ratio: 1.414 / 1; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .cert-bg { width: 100%; height: 100%; object-fit: contain; }
        
        .cert-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; text-align: left; }
        .student-name { position: absolute; top: 38%; left: 50%; transform: translateX(-50%); font-size: 34px; font-weight: 800; color: #064e3b; letter-spacing: 1px; width: 80%; text-align: center; }
        .course-name-display { position: absolute; top: 58.5%; left: 50%; transform: translateX(-50%); font-size: 26px; font-weight: 800; font-style: italic; color: #1a202c; width: 70%; text-align: center; }
        .issue-date-display { position: absolute; top: 79.3%; left: 21%; font-size: 18px; font-weight: 600; color: #4a5568; text-align: left; }
        .cert-id-display { position: absolute; top: 92.3%; left: 55%; font-size: 15px; font-weight: 700; color: #4a5568; letter-spacing: 0.5px; text-align: left; }

        .viewer-actions { text-align: center; }
        .viewer-actions p { font-size: 14px; color: #718096; margin-top: 16px; }

        /* Empty State Full */
        .empty-state-full { text-align: center; padding: 80px 20px; }
        .empty-state-full .icon { font-size: 60px; margin-bottom: 24px; }
        .empty-state-full h3 { font-size: 24px; font-weight: 800; margin: 0 0 12px; }
        .empty-state-full p { color: #718096; margin-bottom: 32px; }
        .btn-primary { background: #10b981; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-primary:hover { background: #059669; }

        .empty-box, .cert-empty { text-align: center; color: #a0aec0; font-size: 14px; padding: 30px 20px; border: 2px dashed #edf2f7; border-radius: 20px; }
      `}</style>
    </div>
  );
}
