import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import fs from "fs";
import path from "path";

function normalizeCertificateCode(value: string | null) {
  if (!value) return "";

  try {
    return decodeURIComponent(value).trim().toUpperCase();
  } catch {
    return value.trim().toUpperCase();
  }
}

export async function GET(request: NextRequest) {
  const id = normalizeCertificateCode(request.nextUrl.searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "Missing certificate id" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "data", "certificates", `${id}.json`);

    if (fs.existsSync(filePath)) {
      const cert = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(cert);
    }

    const { data: cert, error } = await supabase
      .from("certificates")
      .select(`
        *,
        enrollments (
          id,
          student_id,
          class_id,
          students (
            full_name,
            email
          ),
          classes (
            class_code,
            class_name,
            courses (
              name
            )
          )
        )
      `)
      .eq("certificate_code", id)
      .maybeSingle();

    if (error) {
      console.error("Certificate data lookup error:", error);
      return NextResponse.json({ error: "Certificate lookup failed" }, { status: 500 });
    }

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(cert);
  } catch (err) {
    console.error("Certificate data API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
