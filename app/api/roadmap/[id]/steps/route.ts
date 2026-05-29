import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const STEP_FIELDS = [
  "parent_step_id",
  "order_index",
  "step_type",
  "title",
  "description",
  "prerequisites",
  "resource_url",
  "assignment_id",
  "estimated_hours",
  "duration_days",
  "due_offset_days",
  "is_required",
] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const row: Record<string, unknown> = { roadmap_id: id };
  for (const key of STEP_FIELDS) {
    if (payload[key] !== undefined) row[key] = payload[key];
  }

  const { data, error } = await supabase
    .from("roadmap_steps")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ step: data }, { status: 201 });
}
