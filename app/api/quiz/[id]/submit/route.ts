import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

function arraysEqualAsSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { enrollment_id, student_id, started_at, answers } = payload ?? {};

  if (!enrollment_id || !student_id || !answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "enrollment_id, student_id, answers are required" },
      { status: 400 }
    );
  }

  const { data: existingAttempt } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", student_id)
    .maybeSingle();

  if (existingAttempt?.submitted_at) {
    return NextResponse.json(
      { error: "Bạn đã làm quiz này rồi", attempt: existingAttempt },
      { status: 409 }
    );
  }

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

  const { data: enrollment, error: enrErr } = await supabase
    .from("enrollments")
    .select("id, student_id, class_id")
    .eq("id", enrollment_id)
    .maybeSingle();

  if (enrErr) return NextResponse.json({ error: enrErr.message }, { status: 500 });
  if (!enrollment || enrollment.student_id !== student_id || enrollment.class_id !== quiz.class_id) {
    return NextResponse.json({ error: "Enrollment không hợp lệ" }, { status: 403 });
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

  const { data: attendanceRow } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("enrollment_id", enrollment_id)
    .eq("session_number", quiz.session_number)
    .maybeSingle();

  const wasAbsent = !attendanceRow || attendanceRow.status === "absent";

  let statusChanged = false;
  if (passed && wasAbsent) {
    if (attendanceRow) {
      const { error: updErr } = await supabase
        .from("attendance_records")
        .update({ status: "excused", note: "Auto-excused via quiz" })
        .eq("id", attendanceRow.id);
      if (!updErr) statusChanged = true;
    } else {
      const { error: insErr } = await supabase.from("attendance_records").insert({
        enrollment_id,
        session_number: quiz.session_number,
        status: "excused",
        note: "Auto-excused via quiz",
      });
      if (!insErr) statusChanged = true;
    }
    if (statusChanged) {
      await supabase.rpc("recalculate_attendance_score", { target_id: enrollment_id });
    }
  }

  const attemptRow = {
    quiz_id: quizId,
    enrollment_id,
    student_id,
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

  let attempt: any;
  if (existingAttempt) {
    const { data: updated, error: updErr } = await supabase
      .from("quiz_attempts")
      .update(attemptRow)
      .eq("id", existingAttempt.id)
      .select()
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
    attempt = updated;
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("quiz_attempts")
      .insert(attemptRow)
      .select()
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    attempt = inserted;
  }

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

  return NextResponse.json({ attempt, items: review });
}
