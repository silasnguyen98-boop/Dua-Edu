"use client";

import React, { useMemo, useState } from "react";
import { PieChart } from "../charts";

interface GeneralDashboardProps {
  stats: any[];
  analytics: any;
  attendanceRecords: any[];
}

type GrowthMetric = "enrollmentCount" | "participationCertificates" | "completionCertificates" | "projectSubmissions";

const growthMetricOptions: { label: string; value: GrowthMetric }[] = [
  { label: "Sĩ số", value: "enrollmentCount" },
  { label: "Chứng chỉ tham gia", value: "participationCertificates" },
  { label: "Chứng chỉ hoàn thành", value: "completionCertificates" },
  { label: "Số lượng nộp đồ án", value: "projectSubmissions" },
];

export function GeneralDashboard({ stats, analytics, attendanceRecords }: GeneralDashboardProps) {
  const [growthMetric, setGrowthMetric] = useState<GrowthMetric>("enrollmentCount");
  const [topClassMetric, setTopClassMetric] = useState<GrowthMetric>("enrollmentCount");
  const [attendanceSession, setAttendanceSession] = useState(1);
  const totalEnrollments = stats.find((item) => item.label === "Ghi danh")?.value ?? 0;
  const totalCertificates = stats.find((item) => item.label === "Chứng chỉ")?.value ?? 0;
  const returningStudentCount = analytics.returningStudents ?? 0;
  const getClassMetricValue = (classItem: any, metric: GrowthMetric) => {
    const enrollments = classItem.enrollments ?? [];
    if (metric === "enrollmentCount") return Number(classItem.enrollmentCount ?? 0);
    if (metric === "participationCertificates") {
      return enrollments.filter((enrollment: any) => enrollment.certificateRecordType === "participation").length;
    }
    if (metric === "completionCertificates") {
      return enrollments.filter((enrollment: any) => enrollment.certificateRecordType === "completion").length;
    }
    return enrollments.filter((enrollment: any) => Boolean(enrollment.projectUrl) || Number(enrollment.projectScore ?? 0) > 0).length;
  };
  const topClasses = (analytics.classItems ?? [])
    .map((classItem: any) => ({ ...classItem, metricValue: getClassMetricValue(classItem, topClassMetric) }))
    .filter((classItem: any) => classItem.metricValue > 0)
    .sort((a: any, b: any) => b.metricValue - a.metricValue || String(a.className).localeCompare(String(b.className)))
    .slice(0, 10);
  const topClassMaxValue = Math.max(...topClasses.map((classItem: any) => classItem.metricValue), 1);
  const classGrowthItems = (analytics.classItems ?? [])
    .map((classItem: any) => {
      const time = Date.parse(classItem.startDate);
      if (!Number.isFinite(time)) return null;

      const valueByMetric: Record<GrowthMetric, number> = {
        completionCertificates: getClassMetricValue(classItem, "completionCertificates"),
        enrollmentCount: getClassMetricValue(classItem, "enrollmentCount"),
        participationCertificates: getClassMetricValue(classItem, "participationCertificates"),
        projectSubmissions: getClassMetricValue(classItem, "projectSubmissions"),
      };

      return {
        classCode: classItem.classCode,
        className: classItem.className,
        dateLabel: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(time)),
        id: classItem.id,
        time,
        value: valueByMetric[growthMetric],
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.time - b.time);
  const selectedGrowthLabel = growthMetricOptions.find((option) => option.value === growthMetric)?.label ?? "Sĩ số";
  const growthChartHeight = 260;
  const growthChartWidth = Math.max(680, classGrowthItems.length * 112);
  const growthPadding = 42;
  const maxGrowthValue = Math.max(...classGrowthItems.map((item: any) => item.value), 1);
  const growthPoints = classGrowthItems.map((item: any, index: number) => {
    const x = classGrowthItems.length > 1
      ? growthPadding + (index * (growthChartWidth - growthPadding * 2)) / (classGrowthItems.length - 1)
      : growthChartWidth / 2;
    const y = growthChartHeight - growthPadding - (item.value / maxGrowthValue) * (growthChartHeight - growthPadding * 2);
    return { ...item, x, y };
  });
  const growthPath = growthPoints.length ? `M ${growthPoints.map((point: any) => `${point.x},${point.y}`).join(" L ")}` : "";
  const maxGrowthPointValue = Math.max(...growthPoints.map((point: any) => point.value), 0);
  const minGrowthPointValue = Math.min(...growthPoints.map((point: any) => point.value), 0);
  const latestGrowthPointId = growthPoints[growthPoints.length - 1]?.id;
  const attendanceSessionOptions = useMemo(() => {
    const configuredMax = Math.max(
      ...(analytics.classItems ?? []).map((classItem: any) => Number(classItem.totalSessions ?? 0)),
      0,
    );
    const recordedMax = Math.max(
      ...attendanceRecords.map((record: any) => Number(record.session_number ?? 0)),
      0,
    );
    const maxSession = Math.max(configuredMax, recordedMax);
    return Array.from({ length: maxSession }, (_, index) => index + 1);
  }, [analytics.classItems, attendanceRecords]);
  const selectedAttendanceSession = attendanceSessionOptions.includes(attendanceSession)
    ? attendanceSession
    : attendanceSessionOptions[0] ?? 1;
  const courseAttendanceRows = useMemo(() => {
    const recordByEnrollment = new Map<string, any>();
    attendanceRecords.forEach((record: any) => {
      if (Number(record.session_number ?? 0) === selectedAttendanceSession) {
        recordByEnrollment.set(String(record.enrollment_id ?? ""), record);
      }
    });

    const courseMap = new Map<string, {
      absent: number;
      attended: number;
      classCount: number;
      courseCode: string;
      courseName: string;
      totalStudents: number;
    }>();

    (analytics.classItems ?? []).forEach((classItem: any) => {
      const totalSessions = Number(classItem.totalSessions ?? 0);
      const enrollments = classItem.enrollments ?? [];
      if (!enrollments.length || (totalSessions > 0 && selectedAttendanceSession > totalSessions)) return;

      const classRecords = enrollments
        .map((enrollment: any) => recordByEnrollment.get(String(enrollment.id ?? "")))
        .filter(Boolean);
      if (!classRecords.length) return;

      const key = classItem.courseId || classItem.courseName;
      const current = courseMap.get(key) ?? {
        absent: 0,
        attended: 0,
        classCount: 0,
        courseCode: classItem.courseCode ?? "-",
        courseName: classItem.courseName ?? "-",
        totalStudents: 0,
      };

      current.classCount += 1;
      current.totalStudents += enrollments.length;
      classRecords.forEach((record: any) => {
        if (record?.status === "present" || record?.status === "late") current.attended += 1;
        if (record?.status === "absent") current.absent += 1;
      });
      courseMap.set(key, current);
    });

    return Array.from(courseMap.entries())
      .map(([id, row]) => ({
        ...row,
        absentRate: row.totalStudents ? Math.round((row.absent / row.totalStudents) * 1000) / 10 : 0,
        attendanceRate: row.totalStudents ? Math.round((row.attended / row.totalStudents) * 1000) / 10 : 0,
        id,
        unmarkedRate: row.totalStudents ? Math.max(Math.round(((row.totalStudents - row.attended - row.absent) / row.totalStudents) * 1000) / 10, 0) : 0,
      }))
      .filter((row) => row.totalStudents > 0)
      .sort((a, b) => b.attendanceRate - a.attendanceRate || a.courseName.localeCompare(b.courseName));
  }, [analytics.classItems, attendanceRecords, selectedAttendanceSession]);

  return (
    <div className="general-dashboard">
      <section className="dashboard-hero" aria-label="Tổng quan vận hành">
        <div>
          <p className="eyebrow">Dashboard chung</p>
          <h2>Toàn cảnh học vụ</h2>
          <span>Theo dõi nhanh quy mô đào tạo, ghi danh, lớp học và chứng chỉ trong hệ thống.</span>
        </div>
        <div className="dashboard-hero-metrics">
          <div>
            <span>Tổng ghi danh</span>
            <strong>{totalEnrollments}</strong>
          </div>
          <div>
            <span>Chứng chỉ</span>
            <strong>{totalCertificates}</strong>
          </div>
          <div>
            <span>Quay lại</span>
            <strong>{returningStudentCount}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid dashboard-stat-grid" aria-label="Tổng quan">
        {stats.map((item, index) => (
          <article className="stat-card" key={item.label}>
            <i className="stat-card-dot" aria-hidden="true">{index + 1}</i>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="analytics-card class-growth-card" aria-label="Biểu đồ tăng trưởng lớp học">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tăng trưởng lớp</p>
            <h3>Các lớp theo ngày khai giảng</h3>
          </div>
          <label className="dashboard-select-label">
            <span>Chỉ số</span>
            <select value={growthMetric} onChange={(event) => setGrowthMetric(event.target.value as GrowthMetric)}>
              {growthMetricOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {growthPoints.length ? (
          <div className="class-growth-chart">
            <svg height={growthChartHeight} viewBox={`0 0 ${growthChartWidth} ${growthChartHeight}`} width={growthChartWidth}>
              <defs>
                <linearGradient id="classGrowthStroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#34a853" />
                  <stop offset="100%" stopColor="#0b8043" />
                </linearGradient>
                <linearGradient id="classGrowthArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0f9d58" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#0f9d58" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = growthChartHeight - growthPadding - ratio * (growthChartHeight - growthPadding * 2);
                const value = Math.round(maxGrowthValue * ratio);
                return (
                  <g key={ratio}>
                    <line stroke="#e8eaed" strokeDasharray="4 7" x1={growthPadding} x2={growthChartWidth - growthPadding} y1={y} y2={y} />
                    <text fill="#9aa0a6" fontSize="11" fontWeight="700" textAnchor="end" x={growthPadding - 10} y={y + 4}>{value}</text>
                  </g>
                );
              })}
              {growthPoints.length > 1 && (
                <path
                  d={`${growthPath} L ${growthPoints[growthPoints.length - 1].x},${growthChartHeight - growthPadding} L ${growthPoints[0].x},${growthChartHeight - growthPadding} Z`}
                  fill="url(#classGrowthArea)"
                />
              )}
              <path d={growthPath} fill="none" stroke="url(#classGrowthStroke)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              {growthPoints.map((point: any) => {
                const isLatest = point.id === latestGrowthPointId;
                const isMax = point.value === maxGrowthPointValue && maxGrowthPointValue !== minGrowthPointValue;
                const isMin = point.value === minGrowthPointValue && maxGrowthPointValue !== minGrowthPointValue;
                const pointColor = isLatest ? "#0b8043" : isMax ? "#16a34a" : isMin ? "#dc2626" : "#059669";
                const radius = isLatest || isMax || isMin ? 8 : 6;
                const label = isLatest ? "Gần nhất" : isMax ? "Cao nhất" : isMin ? "Thấp nhất" : selectedGrowthLabel;

                return (
                  <g key={point.id}>
                    <title>{`${point.className} (${point.dateLabel}) - ${label}: ${point.value}`}</title>
                    <circle cx={point.x} cy={point.y} fill="#ffffff" r={radius} stroke={pointColor} strokeWidth="3" className="growth-point" />
                    <text fill={pointColor} fontSize="11" fontWeight="800" textAnchor="middle" x={point.x} y={point.y - 14}>{point.value}</text>
                    <text fill="#64748b" fontSize="10" fontWeight="700" textAnchor="middle" x={point.x} y={growthChartHeight - 18}>{point.dateLabel}</text>
                    <text fill="#94a3b8" fontSize="10" fontWeight="700" textAnchor="middle" x={point.x} y={growthChartHeight - 4}>{point.classCode}</text>
                  </g>
                );
              })}
            </svg>
            <div className="growth-chart-legend">
              <span><i style={{ background: "#16a34a" }} /> Cao nhất</span>
              <span><i style={{ background: "#dc2626" }} /> Thấp nhất</span>
              <span><i style={{ background: "#0b8043" }} /> Gần nhất</span>
            </div>
          </div>
        ) : (
          <p className="empty-chart">Chưa có lớp nào có ngày khai giảng.</p>
        )}
      </section>

      <section className="analytics-card course-attendance-card" aria-label="So sánh chuyên cần theo khóa">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chuyên cần theo khóa</p>
            <h3>So sánh tỉ lệ tham gia và vắng theo buổi</h3>
          </div>
          <label className="dashboard-select-label">
            <span>Buổi học</span>
            <select value={selectedAttendanceSession} onChange={(event) => setAttendanceSession(Number(event.target.value))}>
              {attendanceSessionOptions.length ? (
                attendanceSessionOptions.map((sessionNumber) => (
                  <option key={sessionNumber} value={sessionNumber}>Buổi {sessionNumber}</option>
                ))
              ) : (
                <option value={1}>Chưa có dữ liệu</option>
              )}
            </select>
          </label>
        </div>

        {courseAttendanceRows.length ? (
          <div className="course-attendance-chart">
            <div className="course-attendance-header" aria-hidden="true">
              <span>Khóa học</span>
              <span>Tỉ lệ trên sĩ số</span>
              <span>Tham gia</span>
              <span>Vắng</span>
            </div>
            {courseAttendanceRows.map((row) => (
              <div className="course-attendance-row" key={row.id}>
                <div className="course-attendance-meta">
                  <strong>{row.courseCode !== "-" ? `${row.courseCode} - ${row.courseName}` : row.courseName}</strong>
                  <span>{row.classCount} lớp · {row.totalStudents} học viên</span>
                </div>
                <div className="course-attendance-track" aria-label={`${row.courseName}: tham gia ${row.attendanceRate}%, vắng ${row.absentRate}%`}>
                  <i className="attended" style={{ width: `${row.attendanceRate}%` }} />
                  <i className="absent" style={{ width: `${row.absentRate}%` }} />
                  <i className="unmarked" style={{ width: `${row.unmarkedRate}%` }} />
                </div>
                <strong className="course-attendance-rate attended">{row.attendanceRate}%</strong>
                <strong className="course-attendance-rate absent">{row.absentRate}%</strong>
              </div>
            ))}
            <div className="attendance-legend">
              <span><i className="present" /> Tham gia</span>
              <span><i className="absent" /> Vắng</span>
              <span><i className="unmarked" /> Chưa điểm danh / có phép</span>
            </div>
          </div>
        ) : (
          <p className="empty-chart">Chưa có dữ liệu điểm danh để so sánh theo khóa.</p>
        )}
      </section>

      <section className="analytics-grid dashboard-pie-grid" aria-label="Dashboard phân tích">
        <article className="analytics-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tỉ trọng</p>
              <h3>% ghi danh các khoá</h3>
            </div>
          </div>
          <PieChart emptyText="Chưa có dữ liệu để vẽ biểu đồ tròn." items={analytics.courseItems} />
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
      </section>

      <section className="dashboard-operations-grid" aria-label="Theo dõi vận hành">
        <article className="analytics-card dashboard-class-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lớp học</p>
              <h3>Top 10 lớp nổi bật</h3>
            </div>
            <label className="dashboard-select-label">
              <span>Chỉ số</span>
              <select value={topClassMetric} onChange={(event) => setTopClassMetric(event.target.value as GrowthMetric)}>
                {growthMetricOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="dashboard-class-list">
            {topClasses.length ? (
              topClasses.map((classItem: any, index: number) => (
                <div className="dashboard-class-row" key={classItem.id}>
                  <span className="dashboard-class-rank">{index + 1}</span>
                  <div>
                    <strong>{classItem.className}</strong>
                    <span>{classItem.teacherName}</span>
                    <i style={{ width: `${Math.max((classItem.metricValue / topClassMaxValue) * 100, 8)}%` }} />
                  </div>
                  <div>
                    <strong>{classItem.metricValue}</strong>
                    <span>số lượng</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-chart">Chưa có dữ liệu lớp học.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
