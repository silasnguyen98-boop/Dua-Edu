"use client";

import React, { useState } from "react";
import { BarChart, PieChart } from "../charts";

interface GeneralDashboardProps {
  stats: any[];
  analytics: any;
  students: any[];
}

export function GeneralDashboard({ stats, analytics, students }: GeneralDashboardProps) {
  const [showReturningDetails, setShowReturningDetails] = useState(false);

  return (
    <>
      <section className="stats-grid" aria-label="Tổng quan">
        {stats.map((item) => (
          <article className="stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="analytics-grid" aria-label="Dashboard phân tích">
        <article className="analytics-card wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Theo khoá học</p>
              <h3>Số ghi danh của các khoá</h3>
            </div>
          </div>
          <BarChart emptyText="Chưa có dữ liệu ghi danh theo khoá." items={analytics.courseItems} />
        </article>

        <article className="analytics-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tỉ trọng</p>
              <h3>% ghi danh các khoá</h3>
            </div>
          </div>
          <PieChart emptyText="Chưa có dữ liệu để vẽ biểu đồ tròn." items={analytics.courseItems} />
        </article>

        <article className="analytics-card wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Theo giảng viên</p>
              <h3>Số ghi danh của mỗi giảng viên</h3>
            </div>
          </div>
          <BarChart emptyText="Chưa có dữ liệu ghi danh theo giảng viên." items={analytics.teacherItems} />
        </article>

        <article className="analytics-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tỉ trọng</p>
              <h3>% ghi danh theo giảng viên</h3>
            </div>
          </div>
          <PieChart emptyText="Chưa có dữ liệu để vẽ biểu đồ tròn." items={analytics.teacherItems} />
        </article>

        <article className="analytics-card return-card">
          <p className="eyebrow">Quay lại học</p>
          <h3>Học viên ghi danh từ 2 lớp trở lên</h3>
          <strong>{analytics.returningStudents}</strong>
          <span>
            Tỉ lệ quay lại: {analytics.returnRate}% trên tổng {students.length} học viên
          </span>
          <button
            className="secondary-button compact-button"
            onClick={() => setShowReturningDetails((current) => !current)}
            type="button"
          >
            {showReturningDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
          </button>
        </article>

        {showReturningDetails && (
          <article className="analytics-card detail-card wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Chi tiết quay lại</p>
                <h3>Danh sách học viên ghi danh từ 2 lớp trở lên</h3>
              </div>
            </div>
            <div className="class-table">
              <table>
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Số lớp</th>
                    <th>Số ghi danh</th>
                    <th>Lớp đã học</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.returningStudentItems.length ? (
                    analytics.returningStudentItems.map((student: any) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.phone}</td>
                        <td>
                          <strong>{student.classCount}</strong>
                        </td>
                        <td>{student.totalEnrollments}</td>
                        <td>{student.classNames.join(", ")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>Chưa có học viên ghi danh từ 2 lớp trở lên.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </section>
    </>
  );
}
