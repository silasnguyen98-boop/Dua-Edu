"use client";

import React from "react";
import type { Row, AttendanceRecord } from "../types";

interface AttendanceModalProps {
  status: string | null;
  selectedClass: any; // Using any for now to match the complex classItem structure
  attendanceRecords: AttendanceRecord[];
  sessionNumber: number;
  onClose: () => void;
}

export function AttendanceModal({ status, selectedClass, attendanceRecords, sessionNumber, onClose }: AttendanceModalProps) {
  if (!status || !selectedClass) return null;

  return (
    <div style={{ 
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: "20px"
    }} onClick={onClose}>
      <article 
        className="class-dashboard-panel" 
        style={{ 
          width: "100%", maxWidth: "1000px", maxHeight: "85vh", 
          display: "flex", flexDirection: "column", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "40px"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="section-heading" style={{ marginBottom: "24px" }}>
          <div>
            <p className="eyebrow" style={{ fontSize: "14px" }}>Chi tiết trạng thái</p>
            <h3 style={{ fontSize: "28px" }}>Danh sách {
              status === "present" ? "Có mặt" :
              status === "absent" ? "Vắng" :
              status === "late" ? "Đi muộn" :
              status === "excused" ? "Có phép" : "Chưa điểm danh"
            }</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "32px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
        <div className="class-table" style={{ overflowY: "auto", marginTop: "16px" }}>
          <table style={{ background: "transparent", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ background: "transparent", fontSize: "14px", padding: "12px 16px" }}>Học viên</th>
                <th style={{ background: "transparent", fontSize: "14px", padding: "12px 16px" }}>Email liên hệ</th>
              </tr>
            </thead>
            <tbody>
              {selectedClass.enrollments.filter((en: any) => {
                const record = attendanceRecords.find(r => String(r.enrollment_id) === en.id && Number(r.session_number) === sessionNumber);
                const s = record?.status || "unmarked";
                return s === status;
              }).map((en: any) => (
                <tr key={en.id}>
                  <td style={{ fontWeight: 700, fontSize: "16px", padding: "16px" }}>{en.name}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "15px", padding: "16px" }}>{en.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedClass.enrollments.filter((en: any) => {
            const record = attendanceRecords.find(r => String(r.enrollment_id) === en.id && Number(r.session_number) === sessionNumber);
            const s = record?.status || "unmarked";
            return s === status;
          }).length === 0 && (
            <p style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "16px" }}>Không có học viên nào ở trạng thái này.</p>
          )}
        </div>
      </article>
    </div>
  );
}
