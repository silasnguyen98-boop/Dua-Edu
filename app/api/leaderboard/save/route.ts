import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { classCode, topStudents, classInfo, isFinished } = await request.json();

    if (!classCode) {
      return NextResponse.json({ error: "Missing classCode" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "data", "leaderboards");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${classCode}.json`);
    const leaderboardData = {
      classInfo,
      topStudents,
      isFinished,
      updatedAt: new Date().toLocaleString("vi-VN"),
    };

    fs.writeFileSync(filePath, JSON.stringify(leaderboardData, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Save Leaderboard Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
