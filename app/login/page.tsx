"use client";

import { FormEvent, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";

async function isStudentSession(session: Session | null) {
  if (!session) return false;

  const metadata = session.user.user_metadata ?? {};
  const appMetadata = session.user.app_metadata ?? {};
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

  if (!session.user.email) {
    return false;
  }

  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("email", session.user.email.toLowerCase())
    .maybeSingle();

  return Boolean(data?.id);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        if (await isStudentSession(session)) {
          router.replace("/user");
        } else {
          router.replace("/admin");
        }
      }
    });
  }, [router]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email hoặc mật khẩu không chính xác.");
      setLoading(false);
    } else {
      const session = data.session;
      if (await isStudentSession(session)) {
        router.replace("/user");
      } else {
        router.replace("/admin");
      }
    }
  }

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-top">
          <img alt="Dua-Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" />
          <span>Dua Edu</span>
        </div>
        <div className="brand-copy">
          <p className="eyebrow">Learning Operations</p>
          <h1>Nâng cấp kỹ năng làm chủ dữ liệu</h1>
          <p>
            Theo dõi lớp học, điểm danh, bài tập và tiến độ học viên trong một không gian quản trị gọn gàng.
          </p>
        </div>
        <div className="brand-panel">
          <div>
            <strong>294</strong>
            <span>Học viên</span>
          </div>
          <div>
            <strong>22</strong>
            <span>Lớp học</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Dữ liệu tập trung</span>
          </div>
        </div>
      </section>

      <section className="login-side">
        <div className="login-card">
          <div className="mobile-logo">
            <img alt="Dua-Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" />
          </div>
          <p className="eyebrow">Đăng nhập hệ thống</p>
          <h2>Chào mừng trở lại</h2>
          <p className="login-note">Nhập email và mật khẩu để tiếp tục quản lý dữ liệu học viên.</p>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              <span>Email</span>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dua-edu.com" 
              required
            />
            </label>
            <label>
              <span>Mật khẩu</span>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
            />
            </label>
          
            {error && <div className="login-error">{error}</div>}
          
            <button className="login-button" type="submit" disabled={loading}>
              <span>{loading ? "Đang xử lý..." : "Đăng nhập"}</span>
            </button>
          </form>

          <Link href="/tracuu" className="lookup-link">
            Quay lại Cổng tra cứu học viên
          </Link>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
          background: #f7faf8;
          color: #10231d;
          font-family: var(--font-geist-sans);
        }
        .login-brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 56px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(3, 105, 82, 0.92), rgba(15, 118, 110, 0.78)),
            url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80");
          background-size: cover;
          background-position: center;
          color: white;
        }
        .login-brand::after {
          content: "";
          position: absolute;
          inset: auto -12% -18% 18%;
          height: 280px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          transform: rotate(-8deg);
        }
        .brand-top, .brand-copy, .brand-panel {
          position: relative;
          z-index: 1;
        }
        .brand-top {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 18px;
        }
        .brand-top img, .mobile-logo img {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          object-fit: cover;
          background: white;
        }
        .eyebrow {
          margin: 0 0 12px;
          color: #0f766e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .brand-copy {
          max-width: 620px;
          margin: 96px 0;
        }
        .brand-copy .eyebrow {
          color: #bbf7d0;
        }
        .brand-copy h1 {
          margin: 0;
          max-width: 680px;
          font-size: clamp(42px, 6vw, 76px);
          line-height: 0.96;
          letter-spacing: 0;
        }
        .brand-copy p {
          max-width: 540px;
          margin: 24px 0 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 18px;
          line-height: 1.65;
        }
        .brand-panel {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          max-width: 620px;
        }
        .brand-panel div {
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
        }
        .brand-panel strong {
          display: block;
          font-size: 28px;
          line-height: 1;
        }
        .brand-panel span {
          display: block;
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
        }
        .login-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 28px;
        }
        .login-card {
          width: 100%;
          max-width: 430px;
          padding: 42px;
          border: 1px solid #dbe7e1;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 28px 70px rgba(15, 35, 29, 0.12);
        }
        .mobile-logo {
          display: none;
          margin-bottom: 22px;
        }
        .login-card h2 {
          margin: 0;
          color: #10231d;
          font-size: 32px;
          line-height: 1.1;
        }
        .login-note {
          margin: 12px 0 30px;
          color: #60756e;
          line-height: 1.6;
        }
        .login-form {
          display: grid;
          gap: 16px;
        }
        .login-form label {
          display: grid;
          gap: 8px;
          color: #263d35;
          font-size: 14px;
          font-weight: 700;
        }
        .login-form input {
          width: 100%;
          min-height: 48px;
          box-sizing: border-box;
          padding: 12px 14px;
          border: 1px solid #d7e4de;
          border-radius: 12px;
          background: #fbfefd;
          color: #10231d;
          font-size: 15px;
          outline: none;
        }
        .login-form input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.14);
        }
        .login-error {
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fff1f2;
          color: #be123c;
          font-size: 14px;
          font-weight: 600;
        }
        .login-button {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 52px;
          margin-top: 6px;
          padding: 14px 18px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #10b981, #047857) !important;
          color: #ffffff !important;
          box-shadow: 0 16px 34px rgba(4, 120, 87, 0.28);
          cursor: pointer;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0;
          opacity: ${loading ? 0.7 : 1};
        }
        .login-button:hover:not(:disabled) {
          filter: brightness(1.04);
          transform: translateY(-1px);
        }
        .login-button:disabled {
          cursor: not-allowed;
        }
        .lookup-link {
          display: inline-flex;
          margin-top: 24px;
          color: #60756e;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }
        .lookup-link:hover {
          color: #047857;
        }
        @media (max-width: 900px) {
          .login-shell {
            grid-template-columns: 1fr;
          }
          .login-brand {
            display: none;
          }
          .login-side {
            min-height: 100vh;
          }
          .mobile-logo {
            display: block;
          }
        }
        @media (max-width: 520px) {
          .login-side {
            padding: 22px;
          }
          .login-card {
            padding: 28px;
            border-radius: 22px;
          }
          .login-card h2 {
            font-size: 28px;
          }
        }
      `}} />
    </main>
  );
}
