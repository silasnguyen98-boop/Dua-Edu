"use client";

import React, { useState } from "react";
import { ClassInfoModal } from "./ClassInfoModal";

interface ClassManagementViewProps {
  visibleClassItems: any[];
  assignedClassIds: string[];
  currentUserRole: string | null;
  onAddClass: () => void;
  onEditClass: (row: any) => void;
  onOpenDashboard: (id: string) => void;
  onOpenDetail: (id: string) => void;
  formatValue: (val: any) => string;
}

export function ClassManagementView({
  visibleClassItems,
  assignedClassIds,
  currentUserRole,
  onAddClass,
  onEditClass,
  onOpenDashboard,
  onOpenDetail,
  formatValue,
}: ClassManagementViewProps) {
  const [search, setSearch] = useState("");
  const [infoClassItem, setInfoClassItem] = useState<any | null>(null);

  const filteredItems = search
    ? visibleClassItems.filter((item) =>
        item.className.toLowerCase().includes(search.toLowerCase()) ||
        item.classCode.toLowerCase().includes(search.toLowerCase()) ||
        item.courseName.toLowerCase().includes(search.toLowerCase()) ||
        item.teacherName.toLowerCase().includes(search.toLowerCase())
      )
    : visibleClassItems;

  return (
    <section className="analytics-grid" aria-label="Quản lý lớp">
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          {currentUserRole !== "assistant" && currentUserRole !== "teacher" && (
            <button
              aria-label="Thêm lớp"
              className="primary-action"
              onClick={onAddClass}
              title="Thêm lớp"
              type="button"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <span aria-hidden="true" style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
              <span>Thêm lớp</span>
            </button>
          )}
          <input
            type="text"
            placeholder="Tìm theo tên lớp, mã lớp, giảng viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              width: "300px",
              maxWidth: "100%",
            }}
          />
        </div>
        <div className="class-table">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: "center" }}>STT</th>
                <th>Tên lớp</th>
                <th>Mã lớp</th>
                <th>Ngày bắt đầu</th>
                <th>Số buổi</th>
                <th>Lịch học</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center", color: "#94a3b8" }}>{idx + 1}</td>
                    <td>{item.className}</td>
                    <td>{item.classCode}</td>
                    <td>{formatValue(item.startDate)}</td>
                    <td>{item.totalSessions}</td>
                    <td>{item.schedule}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="secondary-button compact-button"
                          onClick={() => setInfoClassItem(item)}
                          type="button"
                        >
                          Xem
                        </button>
                        <button
                          className="secondary-button compact-button"
                          onClick={() => onEditClass(item.raw ?? item)}
                          type="button"
                        >
                          Sửa
                        </button>
                        <button
                          className="secondary-button compact-button"
                          onClick={() => onOpenDetail(item.id)}
                          type="button"
                        >
                          Học viên
                        </button>
                        <button
                          className="secondary-button compact-button"
                          onClick={() => onOpenDashboard(item.id)}
                          type="button"
                        >
                          Dashboard
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    {(currentUserRole === "assistant" || currentUserRole === "teacher") && assignedClassIds.length === 0
                      ? currentUserRole === "teacher"
                          ? "Bạn chưa được gán phụ trách lớp nào. Liên hệ Admin để được cấp quyền."
                          : "Bạn chưa được phân công lớp nào. Liên hệ Admin để được cấp quyền."
                      : "Chưa có dữ liệu lớp hoặc ghi danh."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {infoClassItem && (
        <ClassInfoModal
          classItem={infoClassItem}
          onClose={() => setInfoClassItem(null)}
          onEdit={(row) => {
            setInfoClassItem(null);
            onEditClass(row);
          }}
          formatValue={formatValue}
        />
      )}
    </section>
  );
}
