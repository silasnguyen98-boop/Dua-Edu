import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Che email để bảo mật thông tin (PII) khi lưu trữ công khai
 */
function maskEmail(email: string) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const maskedName = name.length > 2 
    ? name.substring(0, 2) + "***"
    : name[0] + "***";
  return `${maskedName}@${domain}`;
}

export async function POST(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const certDir = path.join(dataDir, "certificates");
    const studentDir = path.join(dataDir, "students");

    // Đảm bảo thư mục tồn tại
    [certDir, studentDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const { data: allCerts, error: certError } = await supabase
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
            class_name,
            courses (
              name
            )
          )
        )
      `);

    console.log("SYNC DEBUG: Total certs found:", allCerts?.length);
    if (certError) console.error("SYNC DEBUG: Cert Error:", certError);
    
    const certMapByEnrollmentId = new Map();
    if (allCerts) {
      allCerts.forEach(cert => {
        const filePath = path.join(certDir, `${cert.certificate_code}.json`);
        
        // Bảo mật: Che email trong dữ liệu chứng chỉ (Thêm kiểm tra an toàn)
        const certData = JSON.parse(JSON.stringify(cert));
        const studentEmail = certData.enrollments?.students?.email;
        
        if (studentEmail) {
          certData.enrollments.students.email = maskEmail(studentEmail);
        }
        
        fs.writeFileSync(filePath, JSON.stringify(certData, null, 2), "utf-8");
        certMapByEnrollmentId.set(cert.enrollment_id, cert);
      });
    }

    // 2. Đồng bộ Học viên (Tra cứu điểm & lịch học)
    const { data: students } = await supabase
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
            courses (name),
            class_sessions (*)
          )
        )
      `);

    if (students) {
      students.forEach(student => {
        if (!student.email) return;

        // Khớp chứng chỉ vào từng enrollment của học viên
        const enrichedEnrollments = student.enrollments?.map((en: any) => {
          const cert = certMapByEnrollmentId.get(en.id);
          return {
            ...en,
            certificates: cert ? [{ certificate_code: cert.certificate_code }] : []
          };
        });

        const studentPayload = {
          ...student,
          email: maskEmail(student.email), 
          enrollments: enrichedEnrollments
        };

        // Sử dụng SHA-256 thay vì MD5 (Thêm kiểm tra an toàn cho trim())
        const cleanEmail = student.email.trim().toLowerCase();
        const emailHash = crypto.createHash("sha256").update(cleanEmail + "DUA_EDU_SECURE_2026").digest("hex");
        const filePath = path.join(studentDir, `${emailHash}.json`);
        fs.writeFileSync(filePath, JSON.stringify(studentPayload, null, 2), "utf-8");
      });
    }

    return NextResponse.json({ 
      success: true, 
      stats: {
        certificates: allCerts?.length || 0,
        students: students?.length || 0
      }
    });
  } catch (err: any) {
    console.error("Public Sync Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
