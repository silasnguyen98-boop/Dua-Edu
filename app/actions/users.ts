"use server";

import { createClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "operation" | "assistant" | "teacher" | "student";
type AdminUser = {
  id: string;
  profile_id?: string;
  email?: string;
  initial_password?: string;
  student_id?: string;
  username: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
};
type StudentAccountResult = {
  auth_user_id?: string;
  email?: string;
  initial_password?: string;
  student_id?: string;
  ok: boolean;
  error?: string;
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

const getRole = (user: any) => user.user_metadata?.role?.trim() || "student";

const verifyUserRole = async (token: string, allowedRoles: UserRole[]) => {
  try {
    const userClient = getSupabaseUserClient(token);
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return { error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại." };
    }

    const role = getRole(user);
    if (!allowedRoles.includes(role as UserRole)) {
      return { error: `Bạn không có quyền thực hiện hành động này. Vai trò hiện tại: ${role}.` };
    }

    const adminClient = getSupabaseAdmin();
    return { adminClient, user };
  } catch (e: any) {
    return { error: e.message || "Lỗi xác thực người dùng." };
  }
};

const verifyAdmin = async (token: string) =>
  await verifyUserRole(token, ["admin", "operation"]);

const verifyStudentAccountManager = async (token: string) =>
  verifyUserRole(token, ["admin", "operation", "assistant", "teacher"]);

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
        .update(updates)
        .eq("id", existing.id);
      if (updateError) {
        console.error("Lỗi cập nhật bảng users:", updateError);
        throw new Error(`Không thể cập nhật bảng users: ${updateError.message}`);
      }
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
  const authResult = await verifyStudentAccountManager(token);
  if (authResult.error) throw new Error(authResult.error);
  const { adminClient } = authResult;
  if (!adminClient) throw new Error("Lỗi cấu hình hệ thống.");

  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  const studentUserIds = data.users
    .filter((u) => u.user_metadata?.role === "student")
    .map((u) => u.id);
  const credentialMap = new Map<string, string>();

  if (studentUserIds.length > 0) {
    const { data: credentials, error: credentialsError } = await adminClient
      .from("student_account_credentials")
      .select("auth_user_id,initial_password")
      .in("auth_user_id", studentUserIds);

    if (!credentialsError) {
      credentials?.forEach((row) => {
        credentialMap.set(String(row.auth_user_id), String(row.initial_password ?? ""));
      });
    }
  }

  return Promise.all(data.users.map(async (u) => {
    const role = u.user_metadata?.role ?? "";

    return {
      id: u.id,
      profile_id: await ensurePublicUserProfile(adminClient, u),
      email: u.email,
      username: u.user_metadata?.username ?? "",
      role,
      student_id: u.user_metadata?.student_id ?? undefined,
      initial_password:
        role === "student" && !u.last_sign_in_at
          ? credentialMap.get(u.id) || u.user_metadata?.initial_password
          : undefined,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? undefined,
    };
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
  try {
    const authResult = await verifyAdmin(token);
    if (authResult.error) throw new Error(authResult.error);
    const { adminClient } = authResult;
    if (!adminClient) throw new Error("Lỗi cấu hình hệ thống.");

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role },
    });
    if (error) throw new Error(error.message);
    return { ok: true, user: data.user };
  } catch (error: any) {
    return { ok: false, error: error.message || "Không thể tạo người dùng." };
  }
}

const generateStudentPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const findAuthUserByEmail = async (
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  email: string,
) => {
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
};

const upsertStudentInitialPassword = async (
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  payload: {
    auth_user_id: string;
    created_by?: string;
    initial_password: string;
    student_id: string;
  },
) => {
  const { error } = await adminClient
    .from("student_account_credentials")
    .upsert(
      {
        auth_user_id: payload.auth_user_id,
        created_by: payload.created_by,
        initial_password: payload.initial_password,
        student_id: payload.student_id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "auth_user_id" },
    );

  if (error) {
    throw new Error(
      `Không lưu được mật khẩu khởi tạo. Hãy chạy migration student_account_credentials. Chi tiết: ${error.message}`,
    );
  }
};

export async function createStudentAccount(
  token: string,
  input: { email: string; full_name: string; student_id?: string },
): Promise<StudentAccountResult> {
  try {
    const authResult = await verifyAdmin(token);
    if (authResult.error) return { ok: false, error: authResult.error };
    
    const adminClient = authResult.adminClient;
    const actor = authResult.user;
    if (!adminClient || !actor) return { ok: false, error: "Lỗi cấu hình hệ thống hoặc phiên đăng nhập." };

    let studentId = input.student_id;
    let finalEmail = input.email?.trim().toLowerCase();
    let finalFullName = input.full_name?.trim();

    // 1. Kiểm tra học viên có tồn tại hay không
    if (studentId) {
      const { data: student, error: studentError } = await adminClient
        .from("students")
        .select("id, email, full_name")
        .eq("id", studentId)
        .maybeSingle();
      
      if (studentError) return { ok: false, error: `Lỗi truy vấn học viên: ${studentError.message}` };
      if (!student) return { ok: false, error: "Không tìm thấy học viên này trong hệ thống." };
      
      // Nếu không nhập email/tên trong form thì lấy từ database
      if (!finalEmail) finalEmail = student.email;
      if (!finalFullName) finalFullName = student.full_name;
    } else if (finalEmail) {
      const { data: student, error: studentError } = await adminClient
        .from("students")
        .select("id, full_name")
        .eq("email", finalEmail)
        .maybeSingle();

      if (studentError) return { ok: false, error: `Lỗi truy vấn học viên: ${studentError.message}` };
      if (!student) return { ok: false, error: "Không tìm thấy học viên có email này trong danh sách học viên." };
      
      studentId = String(student.id);
      if (!finalFullName) finalFullName = student.full_name;
    }

    if (!studentId) return { ok: false, error: "Cần cung cấp ID hoặc Email của học viên để cấp tài khoản." };
    if (!finalEmail) return { ok: false, error: "Học viên chưa có địa chỉ email." };
    if (!finalFullName) return { ok: false, error: "Học viên chưa có họ tên." };

    const email = finalEmail;
    const fullName = finalFullName;

    if (!studentId) return { ok: false, error: "Không xác định được học viên." };

    const password = generateStudentPassword();
    const existingAuthUser = await findAuthUserByEmail(adminClient, email);
    
    if (existingAuthUser && existingAuthUser.user_metadata?.role !== "student") {
      return { ok: false, error: `Email ${email} đã được sử dụng cho tài khoản nhân viên.` };
    }

    const metadata = { username: fullName, role: "student", student_id: studentId, initial_password: password };
    
    let authUser;
    if (existingAuthUser) {
      const { data, error } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
        email,
        password,
        user_metadata: metadata,
      });
      if (error) return { ok: false, error: `Lỗi cập nhật tài khoản auth: ${error.message}` };
      authUser = data.user;
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) return { ok: false, error: `Lỗi tạo tài khoản auth: ${error.message}` };
      authUser = data.user;
    }

    if (!authUser) return { ok: false, error: "Không thể khởi tạo tài khoản auth." };

    await ensurePublicUserProfile(adminClient, authUser);
    
    const { error: credError } = await adminClient
      .from("student_account_credentials")
      .upsert({
        auth_user_id: authUser.id,
        created_by: actor.id,
        initial_password: password,
        student_id: studentId,
      }, { onConflict: "auth_user_id" });

    if (credError) {
       console.warn("Mặc dù có lỗi lưu credentials, tài khoản đã được tạo:", credError.message);
    }

    return { 
      ok: true, 
      auth_user_id: authUser.id, 
      email, 
      initial_password: password, 
      student_id: studentId 
    };
  } catch (error: any) {
    console.error("createStudentAccount critical error:", error);
    return { ok: false, error: "Lỗi hệ thống khi cấp tài khoản. Vui lòng thử lại sau." };
  }
}

export async function resetStudentPassword(
  token: string,
  authUserId: string,
): Promise<StudentAccountResult> {
  try {
    const authResult = await verifyAdmin(token);
    if (authResult.error) return { ok: false, error: authResult.error };
    
    const adminClient = authResult.adminClient;
    const actor = authResult.user;
    if (!adminClient || !actor) return { ok: false, error: "Lỗi cấu hình hệ thống hoặc phiên đăng nhập." };

    const { data: existing, error: getError } = await adminClient.auth.admin.getUserById(authUserId);
    if (getError || !existing.user) {
      return { ok: false, error: `Không tìm thấy tài khoản học viên: ${getError?.message || "Lỗi không xác định"}` };
    }

    if (existing.user.user_metadata?.role !== "student") {
      return { ok: false, error: "Chỉ có thể reset mật khẩu cho tài khoản học viên." };
    }

    const password = generateStudentPassword();
    const studentId = existing.user.user_metadata?.student_id;
    if (!studentId) {
      return { ok: false, error: "Tài khoản học viên chưa được liên kết với bản ghi học viên." };
    }

    const { data, error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
      password,
      user_metadata: {
        ...existing.user.user_metadata,
        initial_password: password,
      },
    });

    if (updateError) return { ok: false, error: `Lỗi cập nhật mật khẩu: ${updateError.message}` };
    if (!data.user) return { ok: false, error: "Không thể hoàn tất cập nhật mật khẩu." };

    const { error: credError } = await adminClient
      .from("student_account_credentials")
      .upsert({
        auth_user_id: data.user.id,
        created_by: actor.id,
        initial_password: password,
        student_id: studentId,
      }, { onConflict: "auth_user_id" });

    if (credError) {
      console.warn("Lỗi lưu credentials sau khi reset mật khẩu:", credError.message);
    }

    return {
      ok: true,
      auth_user_id: data.user.id,
      email: data.user.email ?? "",
      initial_password: password,
      student_id: studentId,
    };
  } catch (error: any) {
    console.error("resetStudentPassword critical error:", error);
    return { ok: false, error: "Lỗi hệ thống khi reset mật khẩu. Vui lòng thử lại sau." };
  }
}

export async function updateUser(
  token: string,
  id: string,
  updates: { email?: string; password?: string; username?: string; role?: UserRole },
) {
  try {
    const authResult = await verifyAdmin(token);
    if (authResult.error) throw new Error(authResult.error);
    const { adminClient } = authResult;
    if (!adminClient) throw new Error("Lỗi cấu hình hệ thống.");

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
    return { ok: true, user: data.user };
  } catch (error: any) {
    return { ok: false, error: error.message || "Không thể cập nhật người dùng." };
  }
}

export async function deleteUser(token: string, id: string) {
  try {
    const authResult = await verifyAdmin(token);
    if (authResult.error) throw new Error(authResult.error);
    const { adminClient } = authResult;
    if (!adminClient) throw new Error("Lỗi cấu hình hệ thống.");

    const { error } = await adminClient.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Không thể xóa người dùng." };
  }
}
