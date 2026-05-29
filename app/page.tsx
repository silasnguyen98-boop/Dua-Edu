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
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f7faf8",
        color: "#10231d",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          border: "1px solid #dbe7e1",
          borderRadius: 16,
          background: "white",
          boxShadow: "0 18px 50px rgba(15, 35, 29, 0.1)",
        }}
      >
        <img
          alt="Dua Edu"
          src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png"
          width={42}
          height={42}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
        <span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid #dbe7e1",
            borderTopColor: "#10231d",
            animation: "dua-spin 0.8s linear infinite",
            flexShrink: 0,
          }}
        />
        <p style={{ margin: 0, color: "#49635b", fontWeight: 700 }}>
          Đang chuyển hướng...
        </p>
      </div>

      <style>{`@keyframes dua-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
