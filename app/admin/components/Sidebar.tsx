"use client";

import React from "react";
import { logoUrl } from "../constants";
import type { SidebarGroup, ViewName, TableConfig, DataState } from "../types";

interface SidebarProps {
  openSidebarGroup: SidebarGroup;
  toggleSidebarGroup: (group: SidebarGroup) => void;
  activeView: ViewName;
  changeView: (view: ViewName) => void;
  isAssistantUser: boolean;
  tableConfigs: TableConfig[];
  data: DataState;
  visibleClassItems: any[];
  currentAccount: any;
  roleLabels: Record<string, string>;
  onLogout: () => void | Promise<void>;
}

export function Sidebar({
  openSidebarGroup,
  toggleSidebarGroup,
  activeView,
  changeView,
  isAssistantUser,
  tableConfigs,
  data,
  visibleClassItems,
  currentAccount,
  roleLabels,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 10px" }}>
          <img src={logoUrl} alt="Dua Edu Logo" style={{ width: "120px", height: "auto", objectFit: "contain" }} />
        </div>
      </div>

      <div className="sidebar-content">
        <div className="nav-group">
          <button
            className="sidebar-group-trigger"
            onClick={() => toggleSidebarGroup("overview")}
            type="button"
          >
            <span>Dashboard</span>
            <strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "overview" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </strong>
          </button>
          {openSidebarGroup === "overview" && (
            <nav className="nav-tabs" aria-label="Dashboard">
              {!isAssistantUser && (
                <button
                  className={activeView === "dashboard" ? "active" : ""}
                  onClick={() => changeView("dashboard")}
                  type="button"
                >
                  <span>Tổng quan</span>
                </button>
              )}
              <button
                className={activeView === "classDashboard" ? "active" : ""}
                onClick={() => changeView("classDashboard")}
                type="button"
              >
                <span>Dashboard lớp</span>
              </button>
            </nav>
          )}
        </div>

        <div className="nav-group">
          <button
            className="sidebar-group-trigger"
            onClick={() => toggleSidebarGroup("academic")}
            type="button"
          >
            <span>Quản lý học tập</span>
            <strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "academic" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </strong>
          </button>
          {openSidebarGroup === "academic" && (
            <nav className="nav-tabs" aria-label="Quản lý học tập">
              {!isAssistantUser && (
                <button
                  className={activeView === "courses" ? "active" : ""}
                  onClick={() => changeView("courses")}
                  type="button"
                >
                  <span>Khóa học</span>
                </button>
              )}
              <button
                className={activeView === "classManagement" || activeView === "classDetail" ? "active" : ""}
                onClick={() => changeView("classManagement")}
                type="button"
              >
                <span>Lớp học</span>
              </button>
              <button
                className={activeView === "class_sessions" ? "active" : ""}
                onClick={() => changeView("class_sessions")}
                type="button"
              >
                <span>Buổi học</span>
              </button>
              {!isAssistantUser && (
                <button
                  className={activeView === "enrollments" ? "active" : ""}
                  onClick={() => changeView("enrollments")}
                  type="button"
                >
                  <span>Ghi danh</span>
                </button>
              )}
            </nav>
          )}
        </div>

        <div className="nav-group">
          <button
            className="sidebar-group-trigger"
            onClick={() => toggleSidebarGroup("extendedData")}
            type="button"
          >
            <span>Học viên & Nhân sự</span>
            <strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "extendedData" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </strong>
          </button>
          {openSidebarGroup === "extendedData" && (
            <nav className="nav-tabs" aria-label="Học viên & Nhân sự">
              <button
                className={activeView === "students" ? "active" : ""}
                onClick={() => changeView("students")}
                type="button"
              >
                <span>Học viên</span>
              </button>
              <button
                className={activeView === "attendance" ? "active" : ""}
                onClick={() => changeView("attendance")}
                type="button"
              >
                <span>Điểm danh</span>
              </button>
              <button
                className={activeView === "quiz" ? "active" : ""}
                onClick={() => changeView("quiz")}
                type="button"
              >
                <span>Quiz</span>
              </button>
              {!isAssistantUser && (
                <button
                  className={activeView === "certificates" ? "active" : ""}
                  onClick={() => changeView("certificates")}
                  type="button"
                >
                  <span>Chứng chỉ</span>
                </button>
              )}
              {!isAssistantUser && (
                <button
                  className={activeView === "assistantAssignments" ? "active" : ""}
                  onClick={() => changeView("assistantAssignments")}
                  type="button"
                >
                  <span>Phân công trợ giảng</span>
                </button>
              )}
            </nav>
          )}
        </div>

        <div className="nav-group">
          <button
            className="sidebar-group-trigger"
            onClick={() => toggleSidebarGroup("grading")}
            type="button"
          >
            <span>Chấm điểm</span>
            <strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "grading" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </strong>
          </button>
          {openSidebarGroup === "grading" && (
            <nav className="nav-tabs" aria-label="Chấm điểm">
              <button
                className={activeView === "assignmentScore" ? "active" : ""}
                onClick={() => changeView("assignmentScore")}
                type="button"
              >
                <span>Điểm bài tập</span>
              </button>
              <button
                className={activeView === "projectScore" ? "active" : ""}
                onClick={() => changeView("projectScore")}
                type="button"
              >
                <span>Điểm đồ án</span>
              </button>
            </nav>
          )}
        </div>

        {!isAssistantUser && (
          <div className="nav-group">
            <button
              className="sidebar-group-trigger"
              onClick={() => toggleSidebarGroup("system")}
              type="button"
            >
              <span>Thiết lập</span>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "system" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </strong>
            </button>
            {openSidebarGroup === "system" && (
              <nav className="nav-tabs" aria-label="Thiết lập">
                <button
                  className={activeView === "teachers" ? "active" : ""}
                  onClick={() => changeView("teachers")}
                  type="button"
                >
                  <span>Giáo viên</span>
                </button>
                <button
                  className={activeView === "admins" ? "active" : ""}
                  onClick={() => changeView("admins")}
                  type="button"
                >
                  <span>Quản trị viên</span>
                </button>
                <div style={{ padding: "8px 12px" }}>
                  <button
                    onClick={async () => {
                      if (!confirm("Đồng bộ toàn bộ dữ liệu ra Cổng công khai (JSON Snapshot)?")) return;
                      try {
                        const res = await fetch('/api/admin/sync-public', { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) {
                          alert(`Đồng bộ thành công!\n- Chứng chỉ: ${data.stats.certificates}\n- Học viên: ${data.stats.students}`);
                        } else {
                          alert(`Lỗi: ${data.error}`);
                        }
                      } catch (e) {
                        alert("Lỗi kết nối khi đồng bộ.");
                      }
                    }}
                    type="button"
                    style={{
                      width: "100%", padding: "10px", background: "linear-gradient(135deg, #4f46e5, #10b981)",
                      color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)"
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a3.5 3.5 0 0 0 0-7h-1.5a9 9 0 0 0-17.5-2.5 7.5 7.5 0 0 0 1.5 14.5h17.5z"></path></svg>
                    Đồng bộ Cổng Công Khai
                  </button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
      {currentAccount && (
        <div className="sidebar-account">
          <div className="admin-account-card" aria-label="Thông tin đăng nhập">
            <div className="admin-account-avatar">
              {(currentAccount.name || currentAccount.email || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-account-copy">
              <strong>{currentAccount.name || "User"}</strong>
              <span>
                {roleLabels[currentAccount.role] || currentAccount.role}
                {currentAccount.email ? ` · ${currentAccount.email}` : ""}
              </span>
            </div>
            <button
              aria-label="Đăng xuất"
              className="admin-account-logout"
              onClick={onLogout}
              title="Đăng xuất"
              type="button"
            >
              <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="m16 17 5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
