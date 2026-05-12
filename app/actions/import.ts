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

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

const formatDuplicateEmails = (emails: string[]) => {
  const uniqueEmails = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)));
  if (!uniqueEmails.length) {
    return "chưa xác định email cụ thể";
  }

  const preview = uniqueEmails.slice(0, 10).join(", ");
  return uniqueEmails.length > 10 ? `${preview}, ... (+${uniqueEmails.length - 10} email khác)` : preview;
};

const findExistingEmails = async (
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  emails: string[],
) => {
  const normalizedEmails = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)));
  if (!normalizedEmails.length) return [];

  const { data, error } = await adminClient
    .from(tableName)
    .select("email")
    .in("email", normalizedEmails);

  if (error) return [];

  return (data ?? []).map((row) => normalizeEmail(row.email)).filter(Boolean);
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
    
    const duplicatedEmails: string[] = [];
    const seenEmails = new Set<string>();
    const cleanPayload = payload.filter((item) => {
      const email = normalizeEmail(item.email);
      if (!email) return true;

      if (seenEmails.has(email)) {
        duplicatedEmails.push(email);
        return false;
      }

      seenEmails.add(email);
      return true;
    });

    const hasEmailField = cleanPayload.length > 0 && "email" in cleanPayload[0];
    
    if (hasEmailField) {
      const emailsInPayload = cleanPayload
        .map(p => normalizeEmail(p.email))
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

        const existingEmailsSet = new Set((existingRows ?? []).map(r => normalizeEmail(r.email)));
        
        const cleanPayloadInternal: any[] = [];
        const seenInThisPayload = new Set<string>();

        // We check for duplicates against DB and WITHIN the current batch
        for (const item of cleanPayload) {
          const email = normalizeEmail(item.email);
          if (email && (existingEmailsSet.has(email) || seenInThisPayload.has(email))) {
            duplicatedEmails.push(email);
          } else {
            if (email) seenInThisPayload.add(email);
            cleanPayloadInternal.push(item);
          }
        }
        
        if (cleanPayloadInternal.length === 0) {
          return { ok: true, data: [], skipped: payload.length, duplicatedEmails };
        }
        
        // Insert the clean payload
        const { data, error: importError } = await adminClient
          .from(tableName)
          .insert(cleanPayloadInternal)
          .select();
          
        if (importError) {
          const existingAfterFailure = await findExistingEmails(adminClient, tableName, emailsInPayload);
          const duplicateDetails = formatDuplicateEmails([...duplicatedEmails, ...existingAfterFailure]);
          throw new Error(
            `Không import được vì email bị trùng: ${duplicateDetails}. ` +
            `Hãy xoá các dòng này khỏi file hoặc cập nhật học viên đã có. Chi tiết kỹ thuật: ${importError.message}`,
          );
        }
        
        return { 
          ok: true, 
          data, 
          skipped: payload.length - cleanPayloadInternal.length,
          duplicatedEmails,
        };
      }
    }

    // Default insert for tables without email or simple cases
    const { data, error: importError } = await adminClient
      .from(tableName)
      .insert(cleanPayload)
      .select();
      
    if (importError) {
      if (importError.message.includes("duplicate key") || importError.message.includes("unique constraint")) {
        const emails = cleanPayload.map((item) => normalizeEmail(item.email)).filter(Boolean);
        const existingAfterFailure = await findExistingEmails(adminClient, tableName, emails);
        throw new Error(
          `Không import được vì email bị trùng: ${formatDuplicateEmails([...duplicatedEmails, ...existingAfterFailure])}. ` +
          `Hãy xoá các dòng này khỏi file hoặc cập nhật bản ghi đã có. Chi tiết kỹ thuật: ${importError.message}`,
        );
      }
      throw new Error(importError.message);
    }
    return { ok: true, data, skipped: payload.length - cleanPayload.length, duplicatedEmails };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
