"use server";

import { createClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "operation" | "assistant" | "teacher" | "student";
type AdminUser = {
  id: string;
  profile_id?: string;
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

const getSupabaseUserClient = (token: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

const verifyAdmin = async (token: string) => {
  const userClient = getSupabaseUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại.");
  }

  const adminClient = getSupabaseAdmin();
  return adminClient;
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

  if (selectError) {
    throw new Error(selectError.message);
  }

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

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted.id as string;
};

export async function getUsers(token: string) {
  const adminClient = await verifyAdmin(token);
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  return Promise.all(data.users.map(async (u) => ({
    id: u.id,
    profile_id: await ensurePublicUserProfile(adminClient, u),
    email: u.email,
    username: u.user_metadata?.username ?? "",
    role: u.user_metadata?.role ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  })));
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
