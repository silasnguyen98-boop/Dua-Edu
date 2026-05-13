"use client";

import React from "react";

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
  onShowCertGuide: () => void | Promise<void>;
  onSyncCertificates: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onBackToClasses: () => void | Promise<void>;
  onDownloadTemplate: () => void | Promise<void>;
  onExportData: () => void | Promise<void>;
  onImportClick: () => void | Promise<void>;
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
  onShowCertGuide,
  onSyncCertificates,
  onRefresh,
  onBackToClasses,
  onDownloadTemplate,
  onExportData,
  onImportClick,
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
        {(isClassDetailView || activeTable === "classes") && (
          <button className="secondary-button" onClick={onBackToClasses} type="button">
            Quay lại quản lý lớp
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
      </div>
    </header>
  );
}
