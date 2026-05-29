import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classCode: string }> }
) {
  const { classCode } = await params;
  const filePath = path.join(process.cwd(), "data", "leaderboards", `${classCode}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `Bảng xếp hạng cho lớp ${classCode} chưa được chia sẻ.` },
      { status: 404 }
    );
  }
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(fileContent));
  } catch {
    return NextResponse.json({ error: "Lỗi hệ thống khi tải dữ liệu." }, { status: 500 });
  }
}
