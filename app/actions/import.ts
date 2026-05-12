"use server";

import { createClient } from "@supabase/supabase-js";

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

/**
 * Server action to perform bulk import using service role key to bypass RLS.
 * This is restricted to users with valid roles (admin, operation, assistant).
 */
export async function bulkImportAction(
  token: string,
  tableName: string,
  payload: any[],
) {
  try {
    // 1. Verify user is authorized
    const userClient = getSupabaseUserClient(token);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    }

    const role = user.user_metadata?.role;
    const allowedRoles = ["admin", "operation", "assistant"];
    
    if (!allowedRoles.includes(role)) {
      throw new Error("Bạn không có quyền thực hiện hành động này.");
    }

    // 2. Perform import using admin client (service role)
    const adminClient = getSupabaseAdmin();
    const { data, error: importError } = await adminClient
      .from(tableName)
      .insert(payload)
      .select();

    if (importError) {
      throw new Error(importError.message);
    }

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
