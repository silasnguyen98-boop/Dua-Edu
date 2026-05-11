"use server";

import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Vui lòng cấu hình SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

const verifyAdmin = async (token: string) => {
  const adminClient = getSupabaseAdmin();
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) throw new Error("Phiên đăng nhập không hợp lệ.");
  return adminClient;
};

/** List all assistants assigned to a class */
export async function getClassAssistants(token: string, classId: string) {
  const adminClient = await verifyAdmin(token);
  const { data, error } = await adminClient
    .from("class_assistants")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** List all class assignments for a specific user */
export async function getAssistantClasses(token: string, userId: string) {
  const adminClient = await verifyAdmin(token);
  const { data, error } = await adminClient
    .from("class_assistants")
    .select("class_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { class_id: string }) => r.class_id);
}

/** Assign an assistant to a class */
export async function assignAssistant(
  token: string,
  classId: string,
  userId: string,
  userEmail: string,
  userName: string,
) {
  const adminClient = await verifyAdmin(token);
  const { error } = await adminClient
    .from("class_assistants")
    .upsert({ class_id: classId, user_id: userId, user_email: userEmail, user_name: userName }, { onConflict: "class_id,user_id" });
  if (error) throw new Error(error.message);
  return true;
}

/** Remove an assistant from a class */
export async function removeAssistant(token: string, classId: string, userId: string) {
  const adminClient = await verifyAdmin(token);
  const { error } = await adminClient
    .from("class_assistants")
    .delete()
    .eq("class_id", classId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return true;
}

/** Get all class IDs assigned to the currently logged-in user */
export async function getMyAssignedClassIds(token: string) {
  const adminClient = await verifyAdmin(token);
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return [];
  const { data, error } = await adminClient
    .from("class_assistants")
    .select("class_id")
    .eq("user_id", user.id);
  if (error) return [];
  return (data ?? []).map((r: { class_id: string }) => r.class_id);
}
