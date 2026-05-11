"use server";

import { createClient } from "@supabase/supabase-js";

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

const verifyUser = async (token: string) => {
  const userClient = getSupabaseUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất rồi đăng nhập lại.");
  }
  return { user, userClient };
};

/** List all assistants assigned to a class */
export async function getClassAssistants(token: string, classId: string) {
  const { userClient } = await verifyUser(token);
  const { data, error } = await userClient
    .from("class_assistants")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** List all class assignments for a specific user */
export async function getAssistantClasses(token: string, userId: string) {
  const { userClient } = await verifyUser(token);
  const { data, error } = await userClient
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
  const { userClient } = await verifyUser(token);
  const { error } = await userClient
    .from("class_assistants")
    .upsert({ class_id: classId, user_id: userId, user_email: userEmail, user_name: userName }, { onConflict: "class_id,user_id" });
  if (error) throw new Error(error.message);
  return true;
}

/** Remove an assistant from a class */
export async function removeAssistant(token: string, classId: string, userId: string) {
  const { userClient } = await verifyUser(token);
  const { error } = await userClient
    .from("class_assistants")
    .delete()
    .eq("class_id", classId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return true;
}

/** Get all class IDs assigned to the currently logged-in user */
export async function getMyAssignedClassIds(token: string) {
  const { user, userClient } = await verifyUser(token);
  const { data, error } = await userClient
    .from("class_assistants")
    .select("class_id")
    .eq("user_id", user.id);
  if (error) return [];
  return (data ?? []).map((r: { class_id: string }) => r.class_id);
}
