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

    const role = user.user_metadata?.role?.trim();
    const allowedRoles = ["admin", "operation", "assistant", "teacher"];
    
    if (!role || !allowedRoles.includes(role)) {
      throw new Error(`Bạn không có quyền thực hiện hành động này. Vai trò: ${role || "không có"}. Vui lòng đăng xuất và đăng nhập lại.`);
    }

    // 2. Perform import using admin client (service role)
    // Use upsert if the table has an email field to handle duplicates gracefully
    const hasEmail = payload.length > 0 && "email" in payload[0];
    const adminClient = getSupabaseAdmin();
    
    let query = adminClient.from(tableName);
    
    if (hasEmail) {
      // @ts-ignore - Supabase types can be tricky with dynamic table names
      const { data, error: importError } = await query
        .upsert(payload, { onConflict: "email", ignoreDuplicates: false })
        .select();
      
      if (importError) throw new Error(importError.message);
      return { ok: true, data };
    } else {
      const { data, error: importError } = await query
        .insert(payload)
        .select();
        
      if (importError) throw new Error(importError.message);
      return { ok: true, data };
    }

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
