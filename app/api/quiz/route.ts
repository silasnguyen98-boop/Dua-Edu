import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

type IncomingItem = {
  content?: string;
  options?: string[];
  correct_indices?: number[];
  explanation?: string | null;
};

export async function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("class_id");
  const sessionNumber = request.nextUrl.searchParams.get("session_number");

  if (!classId) {
    return NextResponse.json({ error: "Missing class_id" }, { status: 400 });
  }

  let query = supabase
    .from("quizzes")
    .select(
      `id, class_id, session_number, title, description,
       open_at, close_at, time_limit_minutes, pass_threshold,
       shuffle_questions, is_active, created_by, created_at, updated_at,
       quiz_items ( id, order_index, content, options, correct_indices, explanation )`
    )
    .eq("class_id", classId)
    .order("session_number", { ascending: true });

  if (sessionNumber !== null) {
    query = query.eq("session_number", Number(sessionNumber));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ quizzes: data ?? [] });
}

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    class_id,
    session_number,
    title,
    description,
    open_at,
    close_at,
    time_limit_minutes,
    pass_threshold,
    shuffle_questions,
    is_active,
    created_by,
    items,
  } = payload ?? {};

  if (!class_id || session_number == null || !title) {
    return NextResponse.json(
      { error: "class_id, session_number, title are required" },
      { status: 400 }
    );
  }

  const itemsArr: IncomingItem[] = Array.isArray(items) ? items : [];
  if (itemsArr.length === 0) {
    return NextResponse.json({ error: "Quiz cần ít nhất 1 câu hỏi" }, { status: 400 });
  }
  for (const [idx, it] of itemsArr.entries()) {
    if (!it.content?.trim()) {
      return NextResponse.json({ error: `Câu ${idx + 1}: thiếu nội dung` }, { status: 400 });
    }
    if (!Array.isArray(it.options) || it.options.length < 2) {
      return NextResponse.json({ error: `Câu ${idx + 1}: cần ít nhất 2 đáp án` }, { status: 400 });
    }
    if (!Array.isArray(it.correct_indices) || it.correct_indices.length === 0) {
      return NextResponse.json({ error: `Câu ${idx + 1}: chưa chọn đáp án đúng` }, { status: 400 });
    }
    for (const ci of it.correct_indices) {
      if (typeof ci !== "number" || ci < 0 || ci >= it.options.length) {
        return NextResponse.json({ error: `Câu ${idx + 1}: đáp án đúng không hợp lệ` }, { status: 400 });
      }
    }
  }

  const quizRow: Record<string, unknown> = {
    class_id,
    session_number: Number(session_number),
    title: String(title).trim(),
    description: description ?? null,
    open_at: open_at ?? null,
    close_at: close_at ?? null,
  };
  if (typeof time_limit_minutes === "number") quizRow.time_limit_minutes = time_limit_minutes;
  if (typeof pass_threshold === "number") quizRow.pass_threshold = pass_threshold;
  if (typeof shuffle_questions === "boolean") quizRow.shuffle_questions = shuffle_questions;
  if (typeof is_active === "boolean") quizRow.is_active = is_active;
  if (created_by) quizRow.created_by = created_by;

  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .insert(quizRow)
    .select()
    .single();

  if (quizErr) {
    return NextResponse.json({ error: quizErr.message }, { status: 400 });
  }

  const itemRows = itemsArr.map((it, idx) => ({
    quiz_id: quiz.id,
    order_index: idx,
    content: String(it.content).trim(),
    options: it.options,
    correct_indices: it.correct_indices,
    explanation: it.explanation ?? null,
  }));

  const { data: insertedItems, error: itemsErr } = await supabase
    .from("quiz_items")
    .insert(itemRows)
    .select();

  if (itemsErr) {
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 400 });
  }

  return NextResponse.json({ quiz, items: insertedItems ?? [] }, { status: 201 });
}
