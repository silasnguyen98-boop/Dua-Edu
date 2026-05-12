"use client";

import React from "react";
import type { TableConfig, ViewName } from "../types";

interface TopbarProps {
  pageEyebrow: string;
  pageTitle: string;
  pageDescription: string;
  activeTable: string;
  isSaving: boolean;
  isDataView: boolean;
  isAssistantUser: boolean;
  isClassDetailView: boolean;
  isAssistantAssignmentsView: boolean;
  currentAccount: any;
  roleLabels: Record<string, string>;
  onShowCertGuide: () => void;
  onSyncCertificates: () => void;
  onRefresh: () => void;
  onBackToClasses: () => void;
  onDownloadTemplate: () => void;
  onExportData: () => void;
  onImportClick: () => void;
  onLogout: () => void;
}

export function Topbar({
  pageEyebrow,
  pageTitle,
  pageDescription,
  activeTable,
  isSaving,
  isDataView,
  isAssistantUser,
  isClassDetailView,
  isAssistantAssignmentsView,
  currentAccount,
  roleLabels,
  onShowCertGuide,
  onSyncCertificates,
  onRefresh,
  onBackToClasses,
  onDownloadTemplate,
  onExportData,
  onImportClick,
  onLogout,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{pageEyebrow}</p>
        <h2>{pageTitle}</h2>
        <p>{pageDescription}</p>
      </div>
      <div className="topbar-actions">
        {activeTable === "certificates" && (
          <>
            <button 
              className="secondary-button" 
              onClick={onShowCertGuide}
              style={{ background: "#f0fdf4", borderColor: "#22c55e", color: "#166534", fontWeight: 600 }}
              type="button"
            >
              📖 Hướng dẫn
            </button>
            <button 
              className="secondary-button" 
              onClick={onSyncCertificates} 
              disabled={isSaving}
              style={{ background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent-dark)", fontWeight: 700 }}
              type="button"
            >
              {isSaving ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
            </button>
          </>
        )}
        <button
          className="secondary-button"
          onClick={onRefresh}
          type="button"
        >
          Làm mới
        </button>
        {isClassDetailView && (
          <button className="secondary-button" onClick={onBackToClasses} type="button">
            Quay lại lớp
          </button>
        )}
        {isDataView && !(isAssistantUser && activeTable === "students") && (
          <>
            <button className="secondary-button" onClick={onDownloadTemplate} type="button">
              Tải file mẫu
            </button>
            <button className="secondary-button" onClick={onExportData} type="button">
              Export data
            </button>
            <button
              className="primary-action"
              onClick={onImportClick}
              type="button"
            >
              Import data
            </button>
          </>
        )}
        {isDataView && isAssistantUser && activeTable === "students" && (
            <button className="secondary-button" onClick={onExportData} type="button">
              Export data
            </button>
        )}
        {currentAccount && (
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
        )}
      </div>
    </header>
  );
}
