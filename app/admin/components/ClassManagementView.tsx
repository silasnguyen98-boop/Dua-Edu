"use client";

import React, { useState } from "react";

interface ClassManagementViewProps {
  visibleClassItems: any[];
  assignedClassIds: string[];
  currentUserRole: string | null;
  onOpenDashboard: (id: string) => void;
  onOpenDetail: (id: string) => void;
  formatValue: (val: any) => string;
}

export function ClassManagementView({
  visibleClassItems,
  assignedClassIds,
  currentUserRole,
  onOpenDashboard,
  onOpenDetail,
  formatValue,
}: ClassManagementViewProps) {
  const [search, setSearch] = useState("");

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
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
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
                <th>Lớp</th>
                <th>Mã lớp</th>
                <th>Khoá học</th>
                <th>Giảng viên</th>
                <th>Ngày bắt đầu</th>
                <th>Số buổi</th>
                <th>Số bài tập</th>
                <th>Lịch học</th>
                <th>Thời gian học</th>
                <th>Sĩ số</th>
                <th>Danh sách</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.className}</td>
                    <td>{item.classCode}</td>
                    <td>{item.courseName}</td>
                    <td>{item.teacherName}</td>
                    <td>{formatValue(item.startDate)}</td>
                    <td>{item.totalSessions}</td>
                    <td>{item.totalAssignments}</td>
                    <td>{item.schedule}</td>
                    <td>{item.studyTime}</td>
                    <td>
                      <strong>{item.enrollmentCount}</strong>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="secondary-button compact-button"
                          onClick={() => onOpenDetail(item.id)}
                          type="button"
                        >
                          Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11}>
                    {currentUserRole === "assistant" && assignedClassIds.length === 0
                      ? "Bạn chưa được phân công lớp nào. Liên hệ Admin để được cấp quyền."
                      : "Chưa có dữ liệu lớp hoặc ghi danh."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
