"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Student = {
  email?: string | null;
  full_name?: string | null;
  id: string;
  phone?: string | null;
};

type Course = {
  course_code?: string | null;
  course_type?: string | null;
  id: string;
  name?: string | null;
};

type Teacher = {
  full_name?: string | null;
  id: string;
};

type ClassRow = {
  class_code?: string | null;
  class_name?: string | null;
  courses?: Course | Course[] | null;
  id: string;
  schedule?: string | null;
  start_date?: string | null;
  study_time?: string | null;
  teachers?: Teacher | Teacher[] | null;
  total_sessions?: number | null;
};

type Enrollment = {
  assignment_score?: number | null;
  attendance_score?: number | null;
  classes?: ClassRow | ClassRow[] | null;
  created_at?: string | null;
  final_score?: number | null;
  id: string;
  note?: string | null;
  project_score?: number | null;
  status?: string | null;
};

type Certificate = {
  certificate_code?: string | null;
  certificate_url?: string | null;
  enrollment_id: string;
  id: string;
  issued_at?: string | null;
  status?: string | null;
};

const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";

const statusLabels: Record<string, string> = {
  active: "Đang học",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
  dropped: "Bỏ học",
  reserved: "Bảo lưu",
};

const courseTypeLabels: Record<string, string> = {
  elearning: "E-learning",
  offline: "Offline",
  online: "Online",
  self_study: "Tự học",
};

const getSingle = <T,>(value?: T | T[] | null) => (Array.isArray(value) ? value[0] : value) ?? null;

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
};

const toNumber = (value?: number | null) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

async function canAccessStudentPortal(authUser: User) {
  const metadata = authUser.user_metadata ?? {};
  const appMetadata = authUser.app_metadata ?? {};
  const role = String(metadata.role || appMetadata.role || "").trim().toLowerCase();
  if (role === "student" || metadata.student_id) {
    return true;
  }

  if (["admin", "operation", "assistant", "teacher"].includes(role)) {
    return false;
  }

  if (!role) {
    return true;
  }

  if (!authUser.email) {
    return false;
  }

  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("email", authUser.email.toLowerCase())
    .maybeSingle();

  return Boolean(data?.id);
}

export default function StudentDashboard() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const loadStudentData = useCallback(async (authUser: User) => {
    try {
      setError("");
      const metadataStudentId = String(authUser.user_metadata?.student_id || "");
      const studentQuery = supabase.from("students").select("*");
      const { data: student, error: studentError } = metadataStudentId
        ? await studentQuery.eq("id", metadataStudentId).maybeSingle()
        : await studentQuery.eq("email", authUser.email || "").maybeSingle();

      if (studentError) throw studentError;
      if (!student) {
        setError("Không tìm thấy hồ sơ học viên gắn với tài khoản này.");
        return;
      }

      setStudentInfo(student as Student);

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          attendance_score,
          assignment_score,
          project_score,
          final_score,
          note,
          created_at,
          classes (
            id,
            class_name,
            class_code,
            start_date,
            total_sessions,
            schedule,
            study_time,
            courses (
              id,
              name,
              course_code,
              course_type
            ),
            teachers (
              id,
              full_name
            )
          )
        `,
        )
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (enrollmentError) throw enrollmentError;

      const nextEnrollments = ((enrollmentData as Enrollment[] | null) ?? []).filter((item) => item.classes);
      setEnrollments(nextEnrollments);

      const enrollmentIds = nextEnrollments.map((item) => item.id);
      if (enrollmentIds.length > 0) {
        const { data: certificateData, error: certificateError } = await supabase
          .from("certificates")
          .select("id,enrollment_id,certificate_code,certificate_url,status,issued_at")
          .in("enrollment_id", enrollmentIds);

        if (!certificateError) {
          setCertificates((certificateData as Certificate[] | null) ?? []);
        }
      } else {
        setCertificates([]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu học viên.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        router.push("/login");
        return;
      }

      if (!(await canAccessStudentPortal(session.user))) {
        router.push("/admin");
        return;
      }

      setUser(session.user);
      await loadStudentData(session.user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadStudentData, router]);

  const completedEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status === "completed"),
    [enrollments],
  );
  const activeEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status !== "completed"),
    [enrollments],
  );
  const averageScore = useMemo(() => {
    const scoredEnrollments = enrollments.filter((enrollment) => typeof enrollment.final_score === "number");
    if (!scoredEnrollments.length) return 0;
    const total = scoredEnrollments.reduce((sum, enrollment) => sum + toNumber(enrollment.final_score), 0);
    return Math.round((total / scoredEnrollments.length) * 10) / 10;
  }, [enrollments]);

  const certificateByEnrollment = useMemo(() => {
    return new Map(certificates.map((certificate) => [certificate.enrollment_id, certificate]));
  }, [certificates]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="student-loading">
        <div className="loading-card">
          <div className="loader" />
          <p>Đang tải không gian học tập...</p>
        </div>
        <style jsx>{`
          .student-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f6faf8;
            color: #49635b;
            font-family: var(--font-geist-sans);
          }
          .loading-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px;
            border: 1px solid #dce8e3;
            border-radius: 16px;
            background: white;
            box-shadow: 0 18px 50px rgba(18, 44, 36, 0.1);
          }
          .loading-card p {
            margin: 0;
            font-weight: 700;
          }
          .loader {
            width: 24px;
            height: 24px;
            border: 3px solid #dce8e3;
            border-top-color: #0f766e;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="student-shell">
      <nav className="topbar">
        <div className="brand">
          <img alt="Dua-Edu" src={logoUrl} />
          <div>
            <strong>Dua Edu</strong>
            <span>Student Portal</span>
          </div>
        </div>

        <div className="account">
          <div className="avatar">{(studentInfo?.full_name || user?.email || "H").charAt(0).toUpperCase()}</div>
          <div className="account-copy">
            <strong>{studentInfo?.full_name || "Học viên"}</strong>
            <span>{studentInfo?.email || user?.email}</span>
          </div>
          <button aria-label="Đăng xuất" className="logout-button" onClick={handleLogout} title="Đăng xuất" type="button">
            <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="m16 17 5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Bảng điều khiển học viên</p>
          <h1>Xin chào, {studentInfo?.full_name?.split(" ").pop() || "bạn"}</h1>
          <p className="hero-copy">
            Theo dõi các lớp đã ghi danh, khóa học đã hoàn thành và kết quả học tập của bạn tại Dua Edu.
          </p>
        </div>
        <div className="hero-panel">
          <span>Tổng quan tiến độ</span>
          <strong>{completedEnrollments.length}/{enrollments.length}</strong>
          <p>khóa học đã hoàn thành</p>
        </div>
      </section>

      {error ? (
        <section className="notice error">
          <strong>Không thể tải dữ liệu</strong>
          <span>{error}</span>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="stat-card">
          <span>Lớp ghi danh</span>
          <strong>{enrollments.length}</strong>
          <p>{activeEnrollments.length} lớp đang theo học</p>
        </article>
        <article className="stat-card">
          <span>Đã hoàn thành</span>
          <strong>{completedEnrollments.length}</strong>
          <p>khóa học có trạng thái hoàn thành</p>
        </article>
        <article className="stat-card">
          <span>Điểm tổng kết TB</span>
          <strong>{averageScore || "--"}</strong>
          <p>dựa trên các lớp đã có điểm</p>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel enrolled-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ghi danh</p>
              <h2>Các lớp của bạn</h2>
            </div>
            <span className="pill">{enrollments.length} lớp</span>
          </div>

          <div className="class-list">
            {enrollments.length === 0 ? (
              <EmptyState title="Chưa có lớp ghi danh" text="Khi bạn được ghi danh vào lớp, thông tin sẽ hiển thị tại đây." />
            ) : (
              enrollments.map((enrollment) => {
                const classInfo = getSingle(enrollment.classes);
                const course = getSingle(classInfo?.courses);
                const teacher = getSingle(classInfo?.teachers);
                const status = enrollment.status || "active";
                const progress = status === "completed" ? 100 : Math.max(8, Math.min(95, toNumber(enrollment.final_score)));

                return (
                  <article className="class-card" key={enrollment.id}>
                    <div className="class-card-top">
                      <span className="course-chip">{course?.course_code || "DUA"}</span>
                      <span className={`status-chip ${status}`}>{statusLabels[status] || status}</span>
                    </div>
                    <h3>{classInfo?.class_name || "Lớp học"}</h3>
                    <p>{course?.name || "Khóa học chưa cập nhật"}</p>

                    <div className="meta-grid">
                      <span>
                        <b>Mã lớp</b>
                        {classInfo?.class_code || "--"}
                      </span>
                      <span>
                        <b>Lịch học</b>
                        {classInfo?.schedule || "Chưa cập nhật"}
                      </span>
                      <span>
                        <b>Giờ học</b>
                        {classInfo?.study_time || "Chưa cập nhật"}
                      </span>
                      <span>
                        <b>Giảng viên</b>
                        {teacher?.full_name || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="progress-row">
                      <div>
                        <span>Tiến độ</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <aside className="panel completed-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Thành tích</p>
              <h2>Khóa hoàn thành</h2>
            </div>
            <span className="pill success">{completedEnrollments.length}</span>
          </div>

          <div className="completed-list">
            {completedEnrollments.length === 0 ? (
              <EmptyState title="Chưa có khóa hoàn thành" text="Các khóa đã hoàn thành sẽ được tổng hợp tại đây." />
            ) : (
              completedEnrollments.map((enrollment) => {
                const classInfo = getSingle(enrollment.classes);
                const course = getSingle(classInfo?.courses);
                const certificate = certificateByEnrollment.get(enrollment.id);

                return (
                  <article className="completed-card" key={enrollment.id}>
                    <div className="completed-icon">
                      <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
                        <path
                          d="m20 6-11 11-5-5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3>{course?.name || classInfo?.class_name || "Khóa học"}</h3>
                      <p>{classInfo?.class_name || "Lớp học"} - bắt đầu {formatDate(classInfo?.start_date)}</p>
                      <div className="score-line">
                        <span>Điểm tổng kết: {enrollment.final_score ?? "--"}</span>
                        <span>{courseTypeLabels[course?.course_type || ""] || "Khóa học"}</span>
                      </div>
                      {certificate?.certificate_url ? (
                        <a className="certificate-link" href={certificate.certificate_url} rel="noreferrer" target="_blank">
                          Xem chứng chỉ {certificate.certificate_code ? `#${certificate.certificate_code}` : ""}
                        </a>
                      ) : (
                        <span className="certificate-muted">Chưa có link chứng chỉ</span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>
      </section>

      <style jsx>{`
        .student-shell {
          min-height: 100vh;
          padding: 18px;
          background:
            radial-gradient(circle at top left, rgba(34, 197, 94, 0.14), transparent 32%),
            linear-gradient(135deg, #f7fbf8 0%, #eef7f3 52%, #f8fafc 100%);
          color: #10231d;
          font-family: var(--font-geist-sans);
        }

        .topbar {
          max-width: 1220px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
        }

        .brand,
        .account {
          display: flex;
          align-items: center;
        }

        .brand {
          gap: 12px;
        }

        .brand img {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          object-fit: cover;
          background: white;
          box-shadow: 0 12px 28px rgba(16, 35, 29, 0.12);
        }

        .brand strong,
        .account strong {
          display: block;
          line-height: 1.1;
        }

        .brand span,
        .account span {
          display: block;
          margin-top: 4px;
          color: #60756e;
          font-size: 12px;
        }

        .account {
          gap: 10px;
          min-width: 0;
          padding: 8px;
          border: 1px solid rgba(178, 199, 190, 0.72);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(16px);
        }

        .account-copy {
          min-width: 0;
        }

        .account-copy strong,
        .account-copy span {
          max-width: 210px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .avatar,
        .logout-button {
          width: 36px;
          height: 36px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
        }

        .avatar {
          background: linear-gradient(135deg, #0f766e, #16a34a);
          color: white;
          font-weight: 900;
        }

        .logout-button {
          border: 0;
          background: #fff1f2;
          color: #be123c;
          cursor: pointer;
        }

        .hero,
        .stats-grid,
        .content-grid,
        .notice {
          max-width: 1220px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero {
          min-height: 260px;
          margin-top: 18px;
          padding: 42px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          align-items: end;
          gap: 28px;
          border: 1px solid rgba(178, 199, 190, 0.68);
          border-radius: 28px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(13, 94, 83, 0.94), rgba(21, 128, 61, 0.76)),
            url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80");
          background-position: center;
          background-size: cover;
          color: white;
          box-shadow: 0 30px 80px rgba(15, 35, 29, 0.15);
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #0f766e;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero .eyebrow {
          color: #bbf7d0;
        }

        .hero h1 {
          margin: 0;
          max-width: 700px;
          color: #ffffff;
          font-size: clamp(36px, 5vw, 68px);
          line-height: 0.98;
          letter-spacing: 0;
        }

        .hero-copy {
          max-width: 620px;
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.84);
          font-size: 17px;
          line-height: 1.65;
        }

        .hero-panel {
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(16px);
        }

        .hero-panel span,
        .hero-panel p {
          color: rgba(255, 255, 255, 0.78);
        }

        .hero-panel strong {
          display: block;
          margin-top: 10px;
          font-size: 44px;
          line-height: 1;
        }

        .hero-panel p {
          margin: 8px 0 0;
        }

        .notice {
          margin-top: 18px;
          padding: 16px 18px;
          border-radius: 14px;
          display: grid;
          gap: 4px;
        }

        .notice.error {
          border: 1px solid #fecdd3;
          background: #fff1f2;
          color: #9f1239;
        }

        .stats-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .stat-card,
        .panel {
          border: 1px solid rgba(178, 199, 190, 0.72);
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 18px 54px rgba(22, 52, 43, 0.08);
          backdrop-filter: blur(16px);
        }

        .stat-card {
          padding: 20px;
          border-radius: 18px;
        }

        .stat-card span {
          color: #60756e;
          font-size: 13px;
          font-weight: 800;
        }

        .stat-card strong {
          display: block;
          margin-top: 10px;
          font-size: 36px;
          line-height: 1;
        }

        .stat-card p {
          margin: 10px 0 0;
          color: #60756e;
          font-size: 13px;
        }

        .content-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
          gap: 18px;
          align-items: start;
        }

        .panel {
          border-radius: 22px;
          padding: 22px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.15;
        }

        .section-heading.compact h2 {
          font-size: 22px;
        }

        .pill {
          flex: 0 0 auto;
          padding: 7px 11px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 13px;
          font-weight: 900;
        }

        .pill.success {
          background: #dcfce7;
          color: #166534;
        }

        .class-list,
        .completed-list {
          display: grid;
          gap: 14px;
        }

        .class-card,
        .completed-card,
        .empty-state {
          border: 1px solid #dfeae5;
          border-radius: 16px;
          background: white;
        }

        .class-card {
          padding: 18px;
        }

        .class-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .course-chip,
        .status-chip {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .course-chip {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status-chip {
          background: #f1f5f9;
          color: #475569;
        }

        .status-chip.active {
          background: #ecfdf5;
          color: #047857;
        }

        .status-chip.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-chip.reserved {
          background: #fef9c3;
          color: #854d0e;
        }

        .status-chip.dropped,
        .status-chip.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .class-card h3,
        .completed-card h3 {
          margin: 0;
          color: #10231d;
          line-height: 1.2;
        }

        .class-card h3 {
          font-size: 20px;
        }

        .class-card p,
        .completed-card p {
          margin: 8px 0 0;
          color: #60756e;
          line-height: 1.5;
        }

        .meta-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .meta-grid span {
          min-width: 0;
          padding: 10px;
          border-radius: 12px;
          background: #f7faf8;
          color: #30463f;
          font-size: 13px;
          line-height: 1.35;
        }

        .meta-grid b {
          display: block;
          margin-bottom: 4px;
          color: #60756e;
          font-size: 11px;
          text-transform: uppercase;
        }

        .progress-row {
          margin-top: 16px;
        }

        .progress-row div:first-child {
          display: flex;
          justify-content: space-between;
          color: #60756e;
          font-size: 13px;
          font-weight: 800;
        }

        .progress-row strong {
          color: #0f766e;
        }

        .progress-track {
          height: 9px;
          margin-top: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: #e5eee9;
        }

        .progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0f766e, #22c55e);
        }

        .completed-card {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 12px;
          padding: 16px;
        }

        .completed-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #dcfce7;
          color: #166534;
        }

        .completed-card h3 {
          font-size: 16px;
        }

        .score-line {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .score-line span,
        .certificate-link,
        .certificate-muted {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .score-line span {
          padding: 6px 9px;
          background: #f1f5f9;
          color: #475569;
        }

        .certificate-link,
        .certificate-muted {
          margin-top: 12px;
          padding: 7px 10px;
        }

        .certificate-link {
          background: #0f766e;
          color: white;
          text-decoration: none;
        }

        .certificate-muted {
          background: #f8fafc;
          color: #94a3b8;
        }

        .empty-state {
          padding: 26px;
          text-align: center;
          background: #f8fafc;
          border-style: dashed;
        }

        .empty-state strong {
          display: block;
          color: #10231d;
        }

        .empty-state p {
          margin: 8px auto 0;
          max-width: 340px;
          color: #60756e;
          line-height: 1.5;
        }

        @media (max-width: 980px) {
          .hero,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .hero-panel {
            max-width: 320px;
          }

          .meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .student-shell {
            padding: 12px;
          }

          .topbar,
          .account {
            align-items: flex-start;
          }

          .topbar {
            flex-direction: column;
          }

          .account {
            width: 100%;
            border-radius: 18px;
          }

          .account-copy {
            flex: 1;
          }

          .account-copy strong,
          .account-copy span {
            max-width: none;
          }

          .hero {
            min-height: 360px;
            padding: 28px;
            border-radius: 22px;
          }

          .hero h1 {
            font-size: 40px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .panel {
            padding: 18px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .meta-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
