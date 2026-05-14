import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Thiếu email tra cứu" }, { status: 400 });
    }

    const emailHash = crypto.createHash("md5").update(email.trim().toLowerCase() + "DUA_EDU_SECURE_2026").digest("hex");
    const filePath = path.join(process.cwd(), "data", "students", `${emailHash}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Không tìm thấy học viên với email này. Dữ liệu có thể chưa được đồng bộ." }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const studentData = JSON.parse(fileContent);

    return NextResponse.json(studentData);
  } catch (err: any) {
    console.error("Student Lookup Error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tra cứu dữ liệu." }, { status: 500 });
  }
}
