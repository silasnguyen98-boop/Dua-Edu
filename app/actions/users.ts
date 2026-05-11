"use server";

import { createClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "operation" | "assistant" | "teacher" | "student";
type AdminUser = {
  id: string;
  email?: string;
  username: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
};

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY. Hãy thêm biến này trong Vercel Project Settings > Environment Variables.",
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

const verifyAdmin = async (token: string) => {
  const adminClient = getSupabaseAdmin();
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  return adminClient;
};

export async function getUsers(token: string) {
  const adminClient = await verifyAdmin(token);
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  return data.users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.user_metadata?.username ?? "",
    role: u.user_metadata?.role ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));
}

export async function getUsersSafe(token: string): Promise<
  | { ok: true; users: AdminUser[] }
  | { ok: false; users: AdminUser[]; error: string }
> {
  try {
    return { ok: true, users: await getUsers(token) };
  } catch (error) {
    return {
      ok: false,
      users: [],
      error: error instanceof Error ? error.message : "Không tải được danh sách người dùng.",
    };
  }
}

export async function createUser(
  token: string,
  email: string,
  password: string,
  username: string,
  role: UserRole,
) {
  const adminClient = await verifyAdmin(token);
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role },
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function updateUser(
  token: string,
  id: string,
  updates: { email?: string; password?: string; username?: string; role?: UserRole },
) {
  const adminClient = await verifyAdmin(token);
  const payload: any = {};
  if (updates.email) payload.email = updates.email;
  if (updates.password) payload.password = updates.password;
  if (updates.username !== undefined || updates.role !== undefined) {
    payload.user_metadata = {};
    if (updates.username !== undefined) payload.user_metadata.username = updates.username;
    if (updates.role !== undefined) payload.user_metadata.role = updates.role;
  }
  const { data, error } = await adminClient.auth.admin.updateUserById(id, payload);
  if (error) throw new Error(error.message);
  return data.user;
}

export async function deleteUser(token: string, id: string) {
  const adminClient = await verifyAdmin(token);
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  return true;
}
