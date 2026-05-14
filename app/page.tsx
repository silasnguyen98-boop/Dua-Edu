"use client";

import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const redirectBySession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session) {
          router.replace("/login");
          return;
        }

        router.replace((await isStudentSession(session)) ? "/user" : "/admin");
      } catch {
        if (active) router.replace("/login");
      }
    };

    void redirectBySession();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="redirect-page">
      <div className="redirect-card">
        <img alt="Dua Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" />
        <p>Đang chuyển hướng...</p>
      </div>

      <style jsx>{`
        .redirect-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #f7faf8;
          color: #10231d;
          font-family: var(--font-geist-sans);
        }

        .redirect-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border: 1px solid #dbe7e1;
          border-radius: 16px;
          background: white;
          box-shadow: 0 18px 50px rgba(15, 35, 29, 0.1);
        }

        .redirect-card img {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          object-fit: cover;
        }

        .redirect-card p {
          margin: 0;
          color: #49635b;
          font-weight: 700;
        }
      `}</style>
    </main>
  );
}
