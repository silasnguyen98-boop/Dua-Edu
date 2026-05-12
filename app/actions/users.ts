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
  auth_user_id: string;
  email: string;
  initial_password?: string;
  student_id: string;
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
  const userClient = getSupabaseUserClient(token);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại.");
  }

  const role = getRole(user);
  if (!allowedRoles.includes(role as UserRole)) {
    throw new Error(`Bạn không có quyền thực hiện hành động này. Vai trò hiện tại: ${role}.`);
  }

  const adminClient = getSupabaseAdmin();
  return { adminClient, user };
};

const verifyAdmin = async (token: string) =>
  (await verifyUserRole(token, ["admin", "operation"])).adminClient;

const verifyStudentAccountManager = async (token: string) =>
  verifyUserRole(token, ["admin", "operation", "assistant"]);

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
  const { adminClient } = await verifyStudentAccountManager(token);
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
  const { adminClient, user: actor } = await verifyStudentAccountManager(token);
  const email = input.email.trim().toLowerCase();
  const fullName = input.full_name.trim();

  if (!fullName) throw new Error("Vui lòng nhập tên học viên.");
  if (!email) throw new Error("Vui lòng nhập email học viên.");

  let studentId = input.student_id;

  if (studentId) {
    const { error } = await adminClient
      .from("students")
      .update({ full_name: fullName, email, updated_at: new Date().toISOString() })
      .eq("id", studentId);
    if (error) throw new Error(error.message);
  } else {
    const { data: existingStudent, error: selectError } = await adminClient
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (selectError) throw new Error(selectError.message);

    if (existingStudent?.id) {
      studentId = String(existingStudent.id);
      const { error } = await adminClient
        .from("students")
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq("id", studentId);
      if (error) throw new Error(error.message);
    } else {
      const { data: insertedStudent, error: insertError } = await adminClient
        .from("students")
        .insert({ full_name: fullName, email })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);
      studentId = String(insertedStudent.id);
    }
  }

  if (!studentId) {
    throw new Error("Không xác định được học viên để cấp tài khoản.");
  }

  const password = generateStudentPassword();
  const existingAuthUser = await findAuthUserByEmail(adminClient, email);
  if (existingAuthUser && existingAuthUser.user_metadata?.role !== "student") {
    throw new Error(`Email ${email} đang thuộc tài khoản hệ thống, không thể chuyển thành tài khoản học viên.`);
  }

  const metadata = { username: fullName, role: "student", student_id: studentId, initial_password: password };
  const authUserResult = existingAuthUser
    ? await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
        email,
        password,
        user_metadata: metadata,
      })
    : await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });

  if (authUserResult.error) throw new Error(authUserResult.error.message);
  const authUser = authUserResult.data.user;
  if (!authUser) throw new Error("Không tạo được tài khoản đăng nhập cho học viên.");

  await ensurePublicUserProfile(adminClient, authUser);
  await upsertStudentInitialPassword(adminClient, {
    auth_user_id: authUser.id,
    created_by: actor.id,
    initial_password: password,
    student_id: studentId,
  });

  return { auth_user_id: authUser.id, email, initial_password: password, student_id: studentId };
}

export async function resetStudentPassword(
  token: string,
  authUserId: string,
): Promise<StudentAccountResult> {
  const { adminClient, user: actor } = await verifyStudentAccountManager(token);
  const { data: existing, error: getError } = await adminClient.auth.admin.getUserById(authUserId);
  if (getError || !existing.user) {
    throw new Error(getError?.message || "Không tìm thấy tài khoản học viên.");
  }

  if (existing.user.user_metadata?.role !== "student") {
    throw new Error("Chỉ có thể reset mật khẩu cho tài khoản học viên.");
  }

  const password = generateStudentPassword();
  const studentId = existing.user.user_metadata?.student_id;
  if (!studentId) {
    throw new Error("Tài khoản học viên chưa được liên kết với bản ghi học viên.");
  }
  const { data, error } = await adminClient.auth.admin.updateUserById(authUserId, {
    password,
    user_metadata: {
      ...existing.user.user_metadata,
      initial_password: password,
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Không reset được mật khẩu học viên.");

  await upsertStudentInitialPassword(adminClient, {
    auth_user_id: data.user.id,
    created_by: actor.id,
    initial_password: password,
    student_id: studentId,
  });

  return {
    auth_user_id: data.user.id,
    email: data.user.email ?? "",
    initial_password: password,
    student_id: studentId,
  };
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
