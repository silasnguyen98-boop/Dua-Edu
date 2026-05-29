import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: roadmap, error: roadmapError } = await supabase
    .from("course_roadmaps")
    .select(
      `
      id,
      course_id,
      title,
      description,
      version,
      is_active,
      created_at,
      updated_at,
      courses (id, course_code, name)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (roadmapError) {
    return NextResponse.json({ error: roadmapError.message }, { status: 500 });
  }
  if (!roadmap) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const { data: steps, error: stepsError } = await supabase
    .from("roadmap_steps")
    .select("*")
    .eq("roadmap_id", id)
    .order("order_index", { ascending: true });

  if (stepsError) {
    return NextResponse.json({ error: stepsError.message }, { status: 500 });
  }

  return NextResponse.json({ roadmap, steps: steps ?? [] });
}

const PATCHABLE_FIELDS = new Set([
  "title",
  "description",
  "version",
  "is_active",
]);

export async function PATCH(
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
    .from("course_roadmaps")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ roadmap: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabase
    .from("course_roadmaps")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
