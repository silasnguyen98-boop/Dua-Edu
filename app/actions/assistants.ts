"use server";

import { createClient } from "@supabase/supabase-js";

type AssistantAssignment = Record<string, unknown>;
type ActionResult<T> =
  | ({ ok: true; error?: never } & T)
  | ({ ok: false; error: string } & Partial<T>);
type EmptyActionResult = { ok: true } | { ok: false; error: string };

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Không thực hiện được thao tác phân công trợ giảng.";

const getSupabaseUserClient = (token: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  if (!url || !key) {
    throw new Error("Thiếu cấu hình Supabase public URL hoặc publishable key.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY. Hãy thêm biến này trong Vercel Project Settings > Environment Variables.",
    );
  }

  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

const verifyUser = async (token: string) => {
  const userClient = getSupabaseUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất rồi đăng nhập lại.");
  }
  return { user, adminClient: getSupabaseAdmin() };
};

const ensurePublicUserProfile = async (adminClient: ReturnType<typeof getSupabaseAdmin>, authUser: any) => {
  const email = authUser.email ?? "";
  const username = authUser.user_metadata?.username ?? email;
  const role = authUser.user_metadata?.role ?? "student";
  const filters = [`auth_user_id.eq.${authUser.id}`];
  if (email) filters.push(`email.eq.${email}`);

  const { data: existing, error: selectError } = await adminClient
    .from("users")
    .select("id,auth_user_id,email,full_name,role,status")
    .or(filters.join(","))
    .limit(1)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing) {
    const updates: Record<string, string> = {};
    if (!existing.auth_user_id) updates.auth_user_id = authUser.id;
    if (email && existing.email !== email) updates.email = email;
    if (username && existing.full_name !== username) updates.full_name = username;
    if (role && existing.role !== role) updates.role = role;
    if (!existing.status) updates.status = "active";

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await adminClient
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateError) throw new Error(updateError.message);
    }

    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("users")
    .insert({
      auth_user_id: authUser.id,
      email,
      full_name: username,
      role,
      status: "active",
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);
  return inserted.id as string;
};

const resolvePublicUserId = async (
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
) => {
  const { data: publicUser, error: publicUserError } = await adminClient
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (publicUserError) throw new Error(publicUserError.message);
  if (publicUser?.id) return publicUser.id as string;

  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error("Không tìm thấy người dùng tương ứng trong bảng users.");
  }

  return ensurePublicUserProfile(adminClient, data.user);
};

/** List all assistants assigned to a class */
export async function getClassAssistants(token: string, classId: string) {
  const { adminClient } = await verifyUser(token);
  const { data, error } = await adminClient
    .from("class_assistants")
    .select("*")
    .eq("class_id", classId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClassAssistantsSafe(
  token: string,
  classId: string,
): Promise<ActionResult<{ assistants: AssistantAssignment[] }>> {
  try {
    return { ok: true, assistants: await getClassAssistants(token, classId) };
  } catch (error) {
    return { ok: false, assistants: [], error: getErrorMessage(error) };
  }
}

/** List all class assignments for a specific user */
export async function getAssistantClasses(token: string, userId: string) {
  const { adminClient } = await verifyUser(token);
  const { data, error } = await adminClient
    .from("class_assistants")
    .select("class_id")
    .eq("assistant_id", userId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { class_id: string }) => r.class_id);
}

/** Assign an assistant to a class */
export async function assignAssistant(
  token: string,
  classId: string,
  userId: string,
) {
  const { user, adminClient } = await verifyUser(token);
  const assistantProfileId = await resolvePublicUserId(adminClient, userId);
  const assignedByProfileId = await ensurePublicUserProfile(adminClient, user);
  const { error } = await adminClient
    .from("class_assistants")
    .upsert(
      {
        assistant_id: assistantProfileId,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedByProfileId,
        class_id: classId,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "class_id,assistant_id" },
    );
  if (error) throw new Error(error.message);
  return true;
}

export async function assignAssistantSafe(
  token: string,
  classId: string,
  userId: string,
): Promise<EmptyActionResult> {
  try {
    await assignAssistant(token, classId, userId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/** Remove an assistant from a class */
export async function removeAssistant(token: string, classId: string, userId: string) {
  const { adminClient } = await verifyUser(token);
  const { error } = await adminClient
    .from("class_assistants")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("class_id", classId)
    .eq("assistant_id", userId);
  if (error) throw new Error(error.message);
  return true;
}

export async function removeAssistantSafe(
  token: string,
  assignmentId: string,
): Promise<EmptyActionResult> {
  try {
    const { adminClient } = await verifyUser(token);
    const { error } = await adminClient
      .from("class_assistants")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", assignmentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/** Get all class IDs assigned to the currently logged-in user */
export async function getMyAssignedClassIds(token: string) {
  try {
    const { user, adminClient } = await verifyUser(token);
    const profileId = await ensurePublicUserProfile(adminClient, user);
    const { data, error } = await adminClient
      .from("class_assistants")
      .select("class_id")
      .eq("assistant_id", profileId)
      .eq("status", "active");
    if (error) return [];
    return (data ?? []).map((r: { class_id: string }) => r.class_id);
  } catch {
    return [];
  }
}
