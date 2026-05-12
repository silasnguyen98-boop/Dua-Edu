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
    const adminClient = getSupabaseAdmin();
    
    // Normalize and de-duplicate payload internally first
    const cleanPayload = payload.filter((item, index) => {
      if (!item.email) return true;
      const email = String(item.email).trim().toLowerCase();
      return payload.findIndex(p => String(p.email || "").trim().toLowerCase() === email) === index;
    });

    const hasEmailField = cleanPayload.length > 0 && "email" in cleanPayload[0];
    
    if (hasEmailField) {
      const emailsInPayload = cleanPayload
        .map(p => String(p.email || "").trim().toLowerCase())
        .filter(Boolean);
        
      if (emailsInPayload.length > 0) {
        // Fetch existing emails from DB
        const { data: existingRows, error: fetchError } = await adminClient
          .from(tableName)
          .select("email")
          .in("email", emailsInPayload);
          
        if (fetchError) {
          console.error("Fetch existing emails error:", fetchError);
          // If we can't check, we should probably fail or try upsert
          // Let's try upsert as a secondary fallback if it's a student table
          if (tableName === "students") {
            const { data, error: upsertError } = await adminClient
              .from(tableName)
              .upsert(cleanPayload, { onConflict: "email" })
              .select();
            if (upsertError) throw new Error(upsertError.message);
            return { ok: true, data };
          }
        }

        const existingEmails = new Set(
          (existingRows ?? []).map(r => String(r.email || "").trim().toLowerCase())
        );
        
        // Filter payload to exclude existing emails
        const filteredPayload = cleanPayload.filter(p => {
          const email = String(p.email || "").trim().toLowerCase();
          return !email || !existingEmails.has(email);
        });
        
        if (filteredPayload.length === 0) {
          return { ok: true, data: [], skipped: payload.length };
        }
        
        // Insert the clean payload
        const { data, error: importError } = await adminClient
          .from(tableName)
          .insert(filteredPayload)
          .select();
          
        if (importError) {
          // If insert still fails, it might be a race condition or other constraint
          throw new Error(importError.message);
        }
        
        return { ok: true, data, skipped: payload.length - filteredPayload.length };
      }
    }

    // Default insert for tables without email or simple cases
    const { data, error: importError } = await adminClient
      .from(tableName)
      .insert(cleanPayload)
      .select();
      
    if (importError) throw new Error(importError.message);
    return { ok: true, data, skipped: payload.length - cleanPayload.length };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
