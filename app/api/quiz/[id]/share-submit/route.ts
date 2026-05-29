import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

function arraysEqualAsSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await handlePost(request, await params);
  } catch (err: any) {
    console.error("[share-submit] Unhandled error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

async function handlePost(
  request: NextRequest,
  params: { id: string }
) {
  const { id: quizId } = params;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email: rawEmail, started_at, answers, display_name } = payload ?? {};
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers is required" }, { status: 400 });
  }

  const email = rawEmail ? normalizeEmail(String(rawEmail)) : "";

  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .select(
      `id, class_id, session_number, pass_threshold, open_at, close_at, is_active,
       quiz_items ( id, content, options, correct_indices, explanation, order_index )`
    )
    .eq("id", quizId)
    .maybeSingle();

  if (quizErr) return NextResponse.json({ error: quizErr.message }, { status: 500 });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (!quiz.is_active) return NextResponse.json({ error: "Quiz đã bị tạm dừng" }, { status: 403 });

  const now = new Date();
  if (quiz.open_at && new Date(quiz.open_at) > now) {
    return NextResponse.json({ error: "Quiz chưa mở" }, { status: 403 });
  }
  if (quiz.close_at && new Date(quiz.close_at) < now) {
    return NextResponse.json({ error: "Quiz đã đóng" }, { status: 403 });
  }

  const items = ((quiz.quiz_items as any[]) ?? []).slice();
  const totalCount = items.length;
  let correctCount = 0;
  const gradedAnswers: Record<string, { chosen: number[]; correct: boolean }> = {};

  for (const it of items) {
    const chosenRaw = answers[it.id];
    const chosen = Array.isArray(chosenRaw)
      ? chosenRaw.filter((x: any) => typeof x === "number")
      : [];
    const correctIndices: number[] = Array.isArray(it.correct_indices) ? it.correct_indices : [];
    const isCorrect = arraysEqualAsSets(chosen, correctIndices);
    if (isCorrect) correctCount++;
    gradedAnswers[it.id] = { chosen, correct: isCorrect };
  }

  const score = totalCount > 0 ? Number((correctCount / totalCount).toFixed(3)) : 0;
  const passed = score >= Number(quiz.pass_threshold);

  const review = items
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((it) => ({
      id: it.id,
      content: it.content,
      options: it.options,
      correct_indices: it.correct_indices,
      explanation: it.explanation,
      chosen: gradedAnswers[it.id]?.chosen ?? [],
      is_correct: gradedAnswers[it.id]?.correct ?? false,
    }));

  const logSubmission = async (opts: {
    matchedStudentId: string | null;
    matchedEnrollmentId: string | null;
    statusChanged: boolean;
    matchReason: string;
  }) => {
    const { error: logErr } = await supabase.from("quiz_share_submissions").insert({
      quiz_id: quizId,
      email: email || "",
      matched_student_id: opts.matchedStudentId,
      matched_enrollment_id: opts.matchedEnrollmentId,
      correct_count: correctCount,
      total_count: totalCount,
      score,
      passed,
      status_changed: opts.statusChanged,
      match_reason: opts.matchReason,
      answers: gradedAnswers,
      started_at: started_at ?? null,
    });
    if (logErr) {
      console.error("[share-submit] Failed to log submission:", logErr.message, {
        quizId, email, matchReason: opts.matchReason,
      });
    }
  };

  // Không nhập email → vẫn lưu anonymous (email rỗng)
  if (!email) {
    await logSubmission({ matchedStudentId: null, matchedEnrollmentId: null, statusChanged: false, matchReason: "no_email" });
    return NextResponse.json({
      attempt: { score, correct_count: correctCount, total_count: totalCount, passed },
      items: review,
      matched: false,
      reason: "no_email",
    });
  }

  // Tìm học viên theo email trong lớp này
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email")
    .ilike("email", email)
    .maybeSingle();

  if (!student) {
    await logSubmission({ matchedStudentId: null, matchedEnrollmentId: null, statusChanged: false, matchReason: "email_not_found" });
    return NextResponse.json({
      attempt: { score, correct_count: correctCount, total_count: totalCount, passed },
      items: review,
      matched: false,
      reason: "email_not_found",
    });
  }

  // Check enrollment in this class
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, student_id, class_id")
    .eq("student_id", student.id)
    .eq("class_id", quiz.class_id)
    .maybeSingle();

  if (!enrollment) {
    await logSubmission({ matchedStudentId: student.id, matchedEnrollmentId: null, statusChanged: false, matchReason: "not_in_class" });
    return NextResponse.json({
      attempt: { score, correct_count: correctCount, total_count: totalCount, passed },
      items: review,
      matched: false,
      reason: "not_in_class",
      student_name: student.full_name,
    });
  }

  // Kiểm tra đã có attempt chưa
  const { data: existingAttempt } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", student.id)
    .maybeSingle();

  if (existingAttempt?.submitted_at) {
    await logSubmission({ matchedStudentId: student.id, matchedEnrollmentId: enrollment.id, statusChanged: false, matchReason: "already_submitted" });
    return NextResponse.json({
      attempt: existingAttempt,
      items: review,
      matched: true,
      reason: "already_submitted",
      student_name: student.full_name,
    });
  }

  // Check trạng thái vắng cho buổi này
  const { data: attendanceRow } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("enrollment_id", enrollment.id)
    .eq("session_number", quiz.session_number)
    .maybeSingle();

  const wasAbsent = !attendanceRow || attendanceRow.status === "absent";

  let statusChanged = false;
  if (passed && wasAbsent) {
    if (attendanceRow) {
      const { error: updErr } = await supabase
        .from("attendance_records")
        .update({ status: "excused", note: "Auto-excused via share quiz" })
        .eq("id", attendanceRow.id);
      if (!updErr) statusChanged = true;
    } else {
      const { error: insErr } = await supabase.from("attendance_records").insert({
        enrollment_id: enrollment.id,
        session_number: quiz.session_number,
        status: "excused",
        note: "Auto-excused via share quiz",
      });
      if (!insErr) statusChanged = true;
    }
    if (statusChanged) {
      await supabase.rpc("recalculate_attendance_score", { target_id: enrollment.id });
    }
  }

  const attemptRow = {
    quiz_id: quizId,
    enrollment_id: enrollment.id,
    student_id: student.id,
    answers: gradedAnswers,
    correct_count: correctCount,
    total_count: totalCount,
    score,
    passed,
    was_absent: wasAbsent,
    status_changed: statusChanged,
    started_at: started_at ?? null,
    submitted_at: now.toISOString(),
  };

  const { data: inserted, error: insErr } = await supabase
    .from("quiz_attempts")
    .insert(attemptRow)
    .select()
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  await logSubmission({ matchedStudentId: student.id, matchedEnrollmentId: enrollment.id, statusChanged, matchReason: "ok" });

  return NextResponse.json({
    attempt: inserted,
    items: review,
    matched: true,
    reason: "ok",
    student_name: student.full_name,
  });
}
