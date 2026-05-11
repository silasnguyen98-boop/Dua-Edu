"use client";

import { FormEvent, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/");
      }
    });
  }, [router]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email hoặc mật khẩu không chính xác.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", fontFamily: "var(--font-geist-sans)" }}>
      <div style={{ background: "var(--surface)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <img alt="Dua-Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" style={{ height: "48px", borderRadius: "12px" }} />
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", marginBottom: "8px", color: "var(--foreground)" }}>Đăng nhập Quản trị</h1>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "32px", fontSize: "14px" }}>Vui lòng đăng nhập để truy cập hệ thống.</p>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--foreground)" }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dua-edu.com" 
              required
              style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--foreground)" }}>Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          {error && <div style={{ color: "#EF4444", fontSize: "14px", padding: "10px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", textAlign: "center" }}>{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: "8px", padding: "14px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontSize: "16px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <Link href="/tracuu" style={{ color: "var(--text-secondary)", fontSize: "14px", textDecoration: "none" }}>
            ← Quay lại Cổng tra cứu học viên
          </Link>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        button:hover:not(:disabled) {
          background: var(--primary-hover) !important;
        }
      `}} />
    </div>
  );
}
