import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("course_id");
  const courseCode = request.nextUrl.searchParams.get("course_code");
  const activeOnly = request.nextUrl.searchParams.get("active") === "1";

  let query = supabase
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
    .order("course_id", { ascending: true })
    .order("version", { ascending: false });

  if (courseId) query = query.eq("course_id", courseId);
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = data ?? [];
  if (courseCode) {
    const code = courseCode.trim().toLowerCase();
    rows = rows.filter(
      // @ts-ignore — supabase join type
      (r) => String(r.courses?.course_code ?? "").toLowerCase() === code,
    );
  }

  return NextResponse.json({ roadmaps: rows });
}

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { course_id, title, description, version, is_active } = payload ?? {};

  if (!course_id || !title) {
    return NextResponse.json(
      { error: "course_id and title are required" },
      { status: 400 },
    );
  }

  const insertRow: Record<string, unknown> = {
    course_id,
    title,
    description: description ?? null,
  };
  if (typeof version === "number") insertRow.version = version;
  if (typeof is_active === "boolean") insertRow.is_active = is_active;

  const { data, error } = await supabase
    .from("course_roadmaps")
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ roadmap: data }, { status: 201 });
}
