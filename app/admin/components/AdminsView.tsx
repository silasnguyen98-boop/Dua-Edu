"use client";

import React from "react";
import { UserRole, AdminUser } from "../types";
import { SupabaseClient } from "@supabase/supabase-js";

interface AdminsViewProps {
  adminForm: any;
  setAdminForm: (val: any) => void;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
  setError: (val: string) => void;
  setMessage: (val: string) => void;
  adminUsers: AdminUser[];
  loadAdmins: () => Promise<void>;
  accountTab: "staff" | "student";
  setAccountTab: (val: "staff" | "student") => void;
  supabase: SupabaseClient;
  createUser: (token: string, email: string, pass: string, user: string, role: string) => Promise<void>;
  updateUser: (token: string, id: string, data: any) => Promise<void>;
  deleteUser: (token: string, id: string) => Promise<void>;
  genPassword: () => string;
}

export const AdminsView: React.FC<AdminsViewProps> = ({
  adminForm,
  setAdminForm,
  isSaving,
  setIsSaving,
  setError,
  setMessage,
  adminUsers,
  loadAdmins,
  accountTab,
  setAccountTab,
  supabase,
  createUser,
  updateUser,
  deleteUser,
  genPassword,
}) => {
  const ROLES: { value: UserRole; label: string; desc: string; color: string; bg: string }[] = [
    { value: "admin",     label: "Admin",     desc: "Toàn quyền",  color: "#dc2626", bg: "#fef2f2" },
    { value: "operation", label: "Operation", desc: "Vận hành",    color: "#2563eb", bg: "#eff6ff" },
    { value: "assistant", label: "Assistant", desc: "Trợ lý",      color: "#7c3aed", bg: "#f5f3ff" },
    { value: "teacher",   label: "Teacher",   desc: "Giảng viên",  color: "#059669", bg: "#f0fdf4" },
    { value: "student",   label: "Student",   desc: "Học viên",    color: "#d97706", bg: "#fffbeb" },
  ];
  const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (adminForm.id) {
        await updateUser(session.access_token, adminForm.id, {
          email: adminForm.email,
          username: adminForm.username,
          role: adminForm.role,
          password: adminForm.password || undefined
        });
        setMessage(`✓ Cập nhật tài khoản "${adminForm.username}" thành công!`);
      } else {
        await createUser(session.access_token, adminForm.email, adminForm.password, adminForm.username, adminForm.role);
        setMessage(`✓ Tạo tài khoản "${adminForm.username}" (${adminForm.role}) thành công! Mật khẩu: ${adminForm.password}`);
      }

      setAdminForm({ email: "", password: "", username: "", role: "admin", id: "" });
      await loadAdmins();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAccounts = adminUsers.filter(u =>
    accountTab === "staff"
      ? ["admin", "operation", "assistant", "teacher"].includes(u.role)
      : u.role === "student"
  );

  return (
    <div style={{ display: "grid", gap: "28px", padding: "4px 0" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6366f1" }}>Tài khoản hệ thống</p>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>{adminForm.id ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}</h3>
          </div>
        </div>

        <form style={{ padding: "20px 24px" }} onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Username</span>
              <input
                type="text" required placeholder="vd: nguyen_van_a"
                value={adminForm.username}
                onChange={(e) => setAdminForm((prev: any) => ({...prev, username: e.target.value}))}
                style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", outline: "none", transition: "border-color 0.2s", color: "var(--foreground)" }}
              />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Email đăng nhập</span>
              <input
                type="email" required
                value={adminForm.email}
                onChange={(e) => setAdminForm((prev: any) => ({...prev, email: e.target.value}))}
                style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", outline: "none", color: "var(--foreground)" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>Vai trò</span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {ROLES.map(r => (
                <button
                  key={r.value} type="button"
                  onClick={() => setAdminForm((prev: any) => ({...prev, role: r.value}))}
                  style={{
                    padding: "8px 16px", borderRadius: "99px", border: `2px solid ${adminForm.role === r.value ? r.color : "var(--border)"}`,
                    background: adminForm.role === r.value ? r.bg : "transparent",
                    color: adminForm.role === r.value ? r.color : "var(--text-secondary)",
                    fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  {adminForm.role === r.value && <span>✓</span>}
                  {r.label}
                  <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.75 }}>— {r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Mật khẩu</span>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text" required={!adminForm.id} minLength={6} placeholder={adminForm.id ? "Để trống nếu không đổi mật khẩu" : "Ít nhất 6 ký tự"}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((prev: any) => ({...prev, password: e.target.value}))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: adminForm.password ? "monospace" : "inherit", color: "var(--foreground)" }}
                />
              </div>
              <button
                type="button"
                onClick={() => setAdminForm((prev: any) => ({...prev, password: genPassword()}))}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px dashed var(--border)", background: "var(--surface-soft)", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: "var(--foreground)", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                Tự tạo
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit" disabled={isSaving}
              style={{ padding: "11px 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1, transition: "opacity 0.2s" }}
            >
              {isSaving ? "Đang xử lý..." : adminForm.id ? "Cập nhật tài khoản →" : "Tạo tài khoản →"}
            </button>
            {adminForm.id && (
              <button
                type="button"
                onClick={() => setAdminForm({ email: "", password: "", username: "", role: "admin", id: "" })}
                style={{ padding: "11px 28px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Huỷ chỉnh sửa
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0ea5e9" }}>Danh sách</p>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>Người dùng hệ thống <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", background: "var(--surface-soft)", padding: "2px 10px", borderRadius: "99px", marginLeft: "6px" }}>{adminUsers.length}</span></h3>
            </div>
          </div>
          <button onClick={() => void loadAdmins()} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", fontSize: "13px", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            Làm mới
          </button>
        </div>
        <div style={{ padding: "0 24px", background: "var(--background)", borderBottom: "1px solid var(--border)", display: "flex", gap: "24px" }}>
          <button
            onClick={() => setAccountTab("staff")}
            style={{ padding: "14px 0", fontSize: "14px", fontWeight: 600, background: "none", border: "none", borderBottom: accountTab === "staff" ? "2px solid #6366f1" : "2px solid transparent", color: accountTab === "staff" ? "#6366f1" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s" }}
          >
            Quản trị viên & GV
          </button>
          <button
            onClick={() => setAccountTab("student")}
            style={{ padding: "14px 0", fontSize: "14px", fontWeight: 600, background: "none", border: "none", borderBottom: accountTab === "student" ? "2px solid #6366f1" : "2px solid transparent", color: accountTab === "student" ? "#6366f1" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s" }}
          >
            Tài khoản học viên
          </button>
        </div>

        <div style={{ display: "grid" }}>
          {filteredAccounts.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
              <span>Chưa có người dùng nào. Thêm tài khoản đầu tiên bên trên!</span>
            </div>
          ) : (
            filteredAccounts.map((user, idx) => {
              const roleInfo = roleMap[user.role] || { label: user.role || "—", color: "#64748b", bg: "#f8fafc" };
              const initials = (user.username || user.email || "?").slice(0, 2).toUpperCase();
              return (
                <div
                  key={user.id}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 24px", borderBottom: idx < filteredAccounts.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: `linear-gradient(135deg, ${roleInfo.color}22, ${roleInfo.color}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: roleInfo.color, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--foreground)" }}>{user.username || "—"}</span>
                      <span style={{ padding: "1px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.color}33` }}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, display: "grid", gap: "2px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Tạo: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span style={{ fontSize: "12px", color: user.last_sign_in_at ? "var(--text-secondary)" : "#94a3b8" }}>
                      {user.last_sign_in_at ? `Đăng nhập: ${new Date(user.last_sign_in_at).toLocaleDateString("vi-VN")}` : "Chưa đăng nhập"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-soft)", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}
                      onClick={() => setAdminForm({
                        id: user.id,
                        email: user.email || "",
                        username: user.username || "",
                        role: user.role as UserRole,
                        password: ""
                      })}
                    >
                      Sửa
                    </button>
                    <button
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #fecaca", background: "transparent", fontSize: "12px", fontWeight: 600, color: "#dc2626", cursor: "pointer", whiteSpace: "nowrap" }}
                      onClick={async () => {
                        if (confirm(`Xoá tài khoản "${user.username || user.email}" vĩnh viễn?`)) {
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;
                            await deleteUser(session.access_token, user.id);
                            await loadAdmins();
                            setMessage("Đã xoá tài khoản thành công.");
                          } catch(err: any) { setError(err.message); }
                        }
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
