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
        </div>
        <div className="brand-copy">
          <p className="eyebrow">Học cùng DUA</p>
          <h1>Nâng cấp năng lực bằng dữ liệu</h1>
        </div>
      </section>

      <section className="login-side">
        <div className="login-side-header">
          <span>dua.edu.vn</span>
          <Link href="/tracuu">Tra cứu học viên</Link>
        </div>
        <div className="login-card">
          <div className="mobile-logo">
            <img alt="Dua-Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" />
          </div>
          <div className="login-card-heading">
            <p className="eyebrow">Đăng nhập hệ thống</p>
            <h2>Chào mừng trở lại</h2>
            <p className="login-note">Nhập email và mật khẩu để tiếp tục.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              <span>Email</span>
              <div className="login-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dua-edu.com"
                  required
                />
              </div>
            </label>
            <label>
              <span>Mật khẩu</span>
              <div className="login-input-wrap">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
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
        <p className="login-footer-note">Bảo mật bởi Dua Edu Learning Operations.</p>
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
          background: #f8fafd;
          color: #202124;
          font-family: 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .login-brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 56px;
          overflow: hidden;
          background: linear-gradient(180deg, #ffffff 0%, #eef8f1 100%);
          color: #202124;
          border-right: 1px solid #dadce0;
        }
        .login-brand::before {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          right: -180px;
          top: -140px;
          border-radius: 50%;
          background: rgba(15, 157, 88, 0.1);
        }
        .login-brand::after {
          content: "";
          position: absolute;
          width: 240px;
          height: 240px;
          left: -120px;
          bottom: 8%;
          border-radius: 50%;
          background: rgba(15, 157, 88, 0.08);
        }
        .brand-top, .brand-copy {
          position: relative;
          z-index: 1;
        }
        .brand-top {
          display: flex;
          align-items: center;
          margin-bottom: 56px;
        }
        .brand-top img, .mobile-logo img {
          width: 168px;
          height: auto;
          border-radius: 0;
          object-fit: contain;
          background: transparent;
          box-shadow: none;
        }
        .eyebrow {
          margin: 0 0 12px;
          color: #0f9d58;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .brand-copy {
          max-width: 560px;
          margin: 0;
        }
        .brand-copy .eyebrow {
          color: #0b8043;
        }
        .brand-copy h1 {
          margin: 0;
          max-width: 600px;
          color: #202124;
          font-size: clamp(40px, 5vw, 64px);
          line-height: 1;
          letter-spacing: 0;
        }
        .brand-copy p {
          max-width: 500px;
          margin: 20px 0 0;
          color: #5f6368;
          font-size: 17px;
          line-height: 1.65;
        }
        .login-side {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 72px 28px 56px;
          background:
            radial-gradient(circle at 78% 18%, rgba(15, 157, 88, 0.08), transparent 30%),
            #ffffff;
        }
        .login-side-header {
          position: absolute;
          top: 24px;
          left: 28px;
          right: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: #5f6368;
          font-size: 13px;
          font-weight: 700;
        }
        .login-side-header a {
          color: #0b8043;
          text-decoration: none;
        }
        .login-card {
          width: 100%;
          max-width: 450px;
          padding: 46px;
          border: 1px solid #e8eaed;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(60, 64, 67, 0.12);
        }
        .mobile-logo {
          display: none;
          margin-bottom: 22px;
        }
        .login-card-heading {
          margin-bottom: 30px;
        }
        .login-card h2 {
          margin: 0;
          color: #202124;
          font-size: 34px;
          font-weight: 800;
          line-height: 1.1;
        }
        .login-note {
          margin: 12px 0 0;
          color: #5f6368;
          line-height: 1.6;
        }
        .login-form {
          display: grid;
          gap: 18px;
        }
        .login-form label {
          display: grid;
          gap: 9px;
          color: #202124;
          font-size: 14px;
          font-weight: 750;
        }
        .login-input-wrap {
          position: relative;
        }
        .login-form input {
          width: 100%;
          min-height: 54px;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid #dadce0;
          border-radius: 12px;
          background: #f8fafd;
          color: #202124;
          font-size: 15px;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .login-form input:focus {
          border-color: #0f9d58;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(15, 157, 88, 0.14);
        }
        .login-error {
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 8px;
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
          min-height: 54px;
          margin-top: 8px;
          padding: 14px 18px;
          border: 0;
          border-radius: 12px;
          background: #0f9d58 !important;
          color: #ffffff !important;
          box-shadow: 0 12px 26px rgba(15, 157, 88, 0.2);
          cursor: pointer;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0;
          opacity: ${loading ? 0.7 : 1};
        }
        .login-button:hover:not(:disabled) {
          filter: brightness(0.96);
          transform: translateY(-1px);
        }
        .login-button:disabled {
          cursor: not-allowed;
        }
        .lookup-link {
          display: flex;
          justify-content: center;
          margin-top: 22px;
          color: #5f6368;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }
        .lookup-link:hover {
          color: #0b8043;
        }
        .login-footer-note {
          position: absolute;
          bottom: 22px;
          left: 28px;
          right: 28px;
          margin: 0;
          color: #9aa0a6;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
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
            padding-top: 44px;
          }
          .login-side-header { display: none; }
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
            border-radius: 16px;
          }
          .login-card h2 {
            font-size: 28px;
          }
        }
      `}} />
    </main>
  );
}
