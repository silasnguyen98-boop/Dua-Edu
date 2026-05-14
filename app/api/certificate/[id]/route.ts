import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { promisify } from "util";

const execFilePromise = promisify(execFile);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Thử đọc từ Snapshot trước
    let cert: any = null;
    const filePath = path.join(process.cwd(), "data", "certificates", `${id}.json`);
    
    if (fs.existsSync(filePath)) {
      cert = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } else {
      // Fallback: Lấy thông tin từ Database nếu chưa có snapshot
      const { data: dbCert, error } = await supabase
        .from("certificates")
        .select(`
          id,
          certificate_code,
          certificate_type,
          issued_at,
          enrollments (
            students (full_name),
            classes (
              class_code,
              courses (name)
            )
          )
        `)
        .eq("certificate_code", id)
        .single();
      
      if (dbCert) cert = dbCert;
    }

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // @ts-ignore - Supabase types join
    const studentName = cert.enrollments?.students?.full_name || "N/A";
    // @ts-ignore
    const courseName = cert.enrollments?.classes?.courses?.name || "N/A";
    const date = new Date(cert.issued_at).toLocaleDateString("vi-VN");
    const certCode = cert.certificate_code;
    const certType = cert.certificate_type || "completion";

    // 2. Đường dẫn lưu file tạm
    const tempFileName = `cert-${certCode}.png`;
    const tempDir = path.join(os.tmpdir(), "dua-edu-certs");
    const outputPath = path.join(tempDir, tempFileName);

    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 3. Chạy Script Python để tạo ảnh
    const scriptPath = path.join(process.cwd(), "scripts", "generate_cert.py");
    await execFilePromise("python3", [
      scriptPath,
      studentName,
      courseName,
      date,
      certCode,
      outputPath,
      certType,
    ]);

    // 4. Trả về ảnh
    if (fs.existsSync(outputPath)) {
      const imageBuffer = fs.readFileSync(outputPath);
      
      // XÓA FILE NGAY SAU KHI ĐỌC (Để không lưu file rác)
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.error("Cleanup error:", e);
      }
      
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, must-revalidate", // Không cache để luôn lấy bản mới
        },
      });
    }

    return NextResponse.json({ error: "Generation failed" }, { status: 500 });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
