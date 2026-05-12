"use client";

import React, { useState } from "react";

interface AttendanceViewProps {
  visibleClassItems: any[];
  selectedAttendanceClassId: string | null;
  setSelectedAttendanceClassId: (id: string | null) => void;
  selectedAttendanceSession: number;
  setSelectedAttendanceSession: (num: number) => void;
  attendanceRecordsByEnrollment: Map<string, any>;
  selectedClassEnrollments: any[];
  isSaving: boolean;
  onUpdateAttendance: (enrollmentId: string, status: string) => void;
  onRefresh: () => void;
  attendanceSessionCount: number;
  attendanceError: string | null;
}

export function AttendanceView({
  visibleClassItems,
  selectedAttendanceClassId,
  setSelectedAttendanceClassId,
  selectedAttendanceSession,
  setSelectedAttendanceSession,
  attendanceRecordsByEnrollment,
  selectedClassEnrollments,
  isSaving,
  onUpdateAttendance,
  onRefresh,
  attendanceSessionCount,
  attendanceError,
}: AttendanceViewProps) {
  return (
    <section className="analytics-grid" aria-label="Giao diện điểm danh">
      <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
        <div className="attendance-toolbar" style={{ alignItems: "flex-end", marginBottom: "24px", gap: "16px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px", flex: 1, alignItems: "flex-end" }}>
            <label style={{ flex: "1 1 300px", maxWidth: "400px" }}>
              <span>Lớp học</span>
              <select onChange={(e) => { setSelectedAttendanceClassId(e.target.value || null); setSelectedAttendanceSession(1); }} value={selectedAttendanceClassId ?? ""}>
                <option value="">Chọn lớp học</option>
                {visibleClassItems.map(item => <option key={item.id} value={item.id}>{item.classCode} - {item.className}</option>)}
              </select>
            </label>
            <label style={{ width: "180px" }}>
              <span>Buổi học</span>
              <select onChange={(e) => setSelectedAttendanceSession(Number(e.target.value))} value={selectedAttendanceSession}>
                {Array.from({ length: attendanceSessionCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>Buổi {n}</option>)}
              </select>
            </label>
          </div>
          <button className="secondary-button" onClick={onRefresh} type="button">Làm mới</button>
        </div>

        {attendanceError && <div className="notice error">{attendanceError}</div>}

        <div className="class-table">
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Học viên</th>
                <th>Trạng thái buổi {selectedAttendanceSession}</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {selectedClassEnrollments.length ? (
                selectedClassEnrollments.map((enrollment, index) => {
                  const record = attendanceRecordsByEnrollment.get(String(enrollment.id));
                  return (
                    <tr key={enrollment.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{enrollment.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{enrollment.email}</div>
                      </td>
                      <td>
                        <select 
                          className={`status-select ${record?.status || "unmarked"}`} 
                          value={record?.status || ""} 
                          onChange={(e) => onUpdateAttendance(enrollment.id, e.target.value)}
                          disabled={isSaving}
                        >
                          <option value="">Chưa điểm danh</option>
                          <option value="present">Có mặt</option>
                          <option value="absent">Vắng mặt</option>
                          <option value="late">Đi muộn</option>
                          <option value="excused">Có phép</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="Ghi chú..." 
                          defaultValue={record?.note || ""} 
                          onBlur={(e) => { if (e.target.value !== (record?.note || "")) onUpdateAttendance(enrollment.id, record?.status || ""); }}
                          style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", width: "100%" }}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={4}>Chọn lớp để thực hiện điểm danh.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
