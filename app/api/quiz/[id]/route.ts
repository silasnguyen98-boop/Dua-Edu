import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const includeAnswers = request.nextUrl.searchParams.get("with_answers") === "1";
  const studentId = request.nextUrl.searchParams.get("student_id");

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select(
      `id, class_id, session_number, title, description,
       open_at, close_at, time_limit_minutes, pass_threshold,
       shuffle_questions, is_active, created_by, created_at, updated_at,
       quiz_items ( id, order_index, content, options, correct_indices, explanation ),
       classes ( id, class_code, class_name, courses ( name ) )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  let attempt: any = null;
  if (studentId) {
    const { data: existing } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", id)
      .eq("student_id", studentId)
      .maybeSingle();
    attempt = existing ?? null;
  }

  const hasSubmitted = Boolean(attempt?.submitted_at);
  const showAnswers = includeAnswers || hasSubmitted;

  const items = ((quiz.quiz_items as any[]) ?? [])
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((it) => ({
      id: it.id,
      order_index: it.order_index,
      content: it.content,
      options: it.options,
      explanation: showAnswers ? it.explanation : null,
      correct_indices: showAnswers ? it.correct_indices : null,
    }));

  const { quiz_items, ...quizMeta } = quiz as any;

  return NextResponse.json({ quiz: quizMeta, items, attempt });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = [
    "title",
    "description",
    "open_at",
    "close_at",
    "time_limit_minutes",
    "pass_threshold",
    "shuffle_questions",
    "is_active",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in payload) update[key] = payload[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quizzes")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ quiz: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
