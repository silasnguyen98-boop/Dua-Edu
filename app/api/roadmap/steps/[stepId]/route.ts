import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const PATCHABLE_FIELDS = new Set([
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
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await params;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of Object.keys(payload ?? {})) {
    if (PATCHABLE_FIELDS.has(key)) updates[key] = payload[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No editable fields provided" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("roadmap_steps")
    .update(updates)
    .eq("id", stepId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ step: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await params;

  const { error } = await supabase
    .from("roadmap_steps")
    .delete()
    .eq("id", stepId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
