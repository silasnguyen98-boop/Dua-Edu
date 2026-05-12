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
}: SidebarProps) {
  const groups: { id: SidebarGroup; label: string; icon: string }[] = [
    { id: "overview", label: "Tổng quan", icon: "📊" },
    { id: "academic", label: "Học tập", icon: "🎓" },
    { id: "coreData", label: "Dữ liệu chính", icon: "📂" },
    { id: "extendedData", label: "Dữ liệu mở rộng", icon: "➕" },
    { id: "system", label: "Hệ thống", icon: "⚙️" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 10px" }}>
          <img src={logoUrl} alt="Dua Edu Logo" style={{ width: "120px", height: "auto", objectFit: "contain" }} />
        </div>
      </div>

      <div className="sidebar-content">
        {!isAssistantUser && (
          <div className="nav-group">
            <button
              className="sidebar-group-trigger"
              onClick={() => toggleSidebarGroup("overview")}
              type="button"
            >
              <span>Tổng quan</span>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "overview" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </strong>
            </button>
            {openSidebarGroup === "overview" && (
              <nav className="nav-tabs" aria-label="Nghiệp vụ tổng quan">
                <button
                  className={activeView === "dashboard" ? "active" : ""}
                  onClick={() => changeView("dashboard")}
                  type="button"
                >
                  <span>Dashboard chung</span>
                </button>
              </nav>
            )}
          </div>
        )}

        <div className="nav-group">
          <button
            className="sidebar-group-trigger"
            onClick={() => toggleSidebarGroup("academic")}
            type="button"
          >
            <span>Học vụ</span>
            <strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "academic" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </strong>
          </button>
          {openSidebarGroup === "academic" && (
            <nav className="nav-tabs" aria-label="Nghiệp vụ học vụ">
              <button
                className={activeView === "classDashboard" ? "active" : ""}
                onClick={() => changeView("classDashboard")}
                type="button"
              >
                <span>Dashboard lớp</span>
                <strong>{visibleClassItems.length}</strong>
              </button>
              <button
                className={activeView === "classManagement" || activeView === "classDetail" ? "active" : ""}
                onClick={() => changeView("classManagement")}
                type="button"
              >
                <span>Quản lý lớp</span>
                <strong>{data.classes.length}</strong>
              </button>
              <button
                className={activeView === "class_sessions" ? "active" : ""}
                onClick={() => changeView("class_sessions")}
                type="button"
              >
                <span>Quản lý buổi học</span>
                <strong>{data.class_sessions.length}</strong>
              </button>
              {isAssistantUser && (
                <button
                  className={activeView === "students" ? "active" : ""}
                  onClick={() => changeView("students")}
                  type="button"
                >
                  <span>Học viên</span>
                  <strong>{data.students.length}</strong>
                </button>
              )}
              {!isAssistantUser && (
                <button
                  className={activeView === "assistantAssignments" ? "active" : ""}
                  onClick={() => changeView("assistantAssignments")}
                  type="button"
                >
                  <span>Phân công trợ giảng</span>
                  <strong>{data.classes.length}</strong>
                </button>
              )}
              <button
                className={activeView === "attendance" ? "active" : ""}
                onClick={() => changeView("attendance")}
                type="button"
              >
                <span>Điểm danh</span>
                <strong>{data.classes.length}</strong>
              </button>
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
          <>
            <div className="nav-group">
              <button
                className="sidebar-group-trigger"
                onClick={() => toggleSidebarGroup("coreData")}
                type="button"
              >
                <span>Dữ liệu lõi</span>
                <strong>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "coreData" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </strong>
              </button>
              {openSidebarGroup === "coreData" && (
                <nav className="nav-tabs" aria-label="Dữ liệu hệ thống">
                  {tableConfigs.filter(c => ["courses", "classes", "teachers", "students"].includes(c.name)).map((config) => (
                    <button
                      className={config.name === activeView ? "active" : ""}
                      key={config.name}
                      onClick={() => changeView(config.name)}
                      type="button"
                    >
                      <span>{config.label}</span>
                      <strong>{data[config.name].length}</strong>
                    </button>
                  ))}
                </nav>
              )}
            </div>

            <div className="nav-group">
              <button
                className="sidebar-group-trigger"
                onClick={() => toggleSidebarGroup("extendedData")}
                type="button"
              >
                <span>Mở rộng</span>
                <strong>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "extendedData" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </strong>
              </button>
              {openSidebarGroup === "extendedData" && (
                <nav className="nav-tabs" aria-label="Dữ liệu mở rộng">
                  {tableConfigs.filter(c => ["enrollments", "certificates"].includes(c.name)).map((config) => (
                    <button
                      className={config.name === activeView ? "active" : ""}
                      key={config.name}
                      onClick={() => changeView(config.name)}
                      type="button"
                    >
                      <span>{config.label}</span>
                      <strong>{data[config.name].length}</strong>
                    </button>
                  ))}
                </nav>
              )}
            </div>

            <div className="nav-group">
              <button
                className="sidebar-group-trigger"
                onClick={() => toggleSidebarGroup("system")}
                type="button"
              >
                <span>Hệ thống</span>
                <strong>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "system" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </strong>
              </button>
              {openSidebarGroup === "system" && (
                <nav className="nav-tabs" aria-label="Hệ thống">
                  <button
                    className={activeView === "admins" ? "active" : ""}
                    onClick={() => changeView("admins")}
                    type="button"
                  >
                    <span>Quản trị viên</span>
                  </button>
                </nav>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
