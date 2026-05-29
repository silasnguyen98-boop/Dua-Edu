import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

function maskEmail(email: string) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const maskedName = name.length > 2
    ? name.substring(0, 2) + "***"
    : name[0] + "***";
  return `${maskedName}@${domain}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    if (!emailParam) {
      return NextResponse.json({ error: "Thiếu email tra cứu" }, { status: 400 });
    }

    const cleanEmail = emailParam.trim().toLowerCase();

    const { data: student, error } = await supabase
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
          certificates ( certificate_code ),
          classes (
            id,
            class_code,
            class_name,
            meeting_url,
            recording_url,
            slide_url,
            reference_url,
            assignment_url,
            courses ( name ),
            class_sessions (
              id,
              session_number,
              session_title,
              session_date,
              start_time,
              end_time
            )
          )
        )
      `)
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("Student Lookup Error:", error);
      return NextResponse.json({ error: "Lỗi hệ thống khi tra cứu dữ liệu." }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json(
        { error: "Không tìm thấy học viên với email này. Vui lòng kiểm tra lại hoặc liên hệ quản trị viên." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...student,
      email: maskEmail(student.email),
    });
  } catch (err: any) {
    console.error("Student Lookup Error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tra cứu dữ liệu." }, { status: 500 });
  }
}
