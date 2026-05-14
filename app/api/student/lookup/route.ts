import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Che email để bảo mật thông tin cá nhân (PII)
 * Ví dụ: silasnguyen@gmail.com -> si***@gmail.com
 */
function maskEmail(email: string) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  
  // Hiển thị 2 ký tự đầu, còn lại thay bằng dấu *
  const maskedName = name.length > 2 
    ? name.substring(0, 2) + "***"
    : name[0] + "***";
  
  return `${maskedName}@${domain}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Thiếu email tra cứu" }, { status: 400 });
    }

    // Sử dụng SHA-256 để khớp với cơ chế đồng bộ mới (Thêm kiểm tra an toàn)
    const cleanEmail = (email || "").trim().toLowerCase();
    const emailHash = crypto.createHash("sha256").update(cleanEmail + "DUA_EDU_SECURE_2026").digest("hex");
    const filePath = path.join(process.cwd(), "data", "students", `${emailHash}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Không tìm thấy học viên với email này. Dữ liệu có thể chưa được đồng bộ." }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const studentData = JSON.parse(fileContent);

    // Bảo mật: Che email trước khi trả về phía client
    if (studentData.email) {
      studentData.email = maskEmail(studentData.email);
    }

    return NextResponse.json(studentData);
  } catch (err: any) {
    console.error("Student Lookup Error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tra cứu dữ liệu." }, { status: 500 });
  }
}
