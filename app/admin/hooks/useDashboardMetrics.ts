"use client";

import { useMemo } from "react";
import type { Row, AttendanceRecord, AssignmentRecord } from "../types";

interface DashboardMetricsParams {
  selectedAttendanceClass: any;
  attendanceRecords: AttendanceRecord[];
  assignmentRecords: AssignmentRecord[];
  attendanceSessionCount: number;
  selectedAttendanceSession: number;
  classDashboardMode: "session" | "overall";
}

export function useDashboardMetrics({
  selectedAttendanceClass,
  attendanceRecords,
  assignmentRecords,
  attendanceSessionCount,
  selectedAttendanceSession,
  classDashboardMode,
}: DashboardMetricsParams) {
  return useMemo(() => {
    if (!selectedAttendanceClass) {
      return {
        statusCounts: { absent: 0, excused: 0, late: 0, present: 0, unmarked: 0 },
        sessionRows: [],
        selectedSession: { absent: 0, excused: 0, late: 0, present: 0, unmarked: 0, attendanceRate: 0 },
        prevSession: { absent: 0, excused: 0, late: 0, present: 0, unmarked: 0, attendanceRate: 0 },
        totalStudents: 0,
        atRiskStudents: [],
        assignmentRate: 0,
        projectRate: 0,
        topStudents: [],
        bottomStudents: [],
        studentRows: [],
        submissionSummary: {
          assignment: { submitted: 0, missing: 0, total: 0 },
          project: { submitted: 0, missing: 0, total: 0 },
        },
        certificateSummary: { participation: 0, completion: 0, none: 0 },
        eligibleCertificateStudents: { participation: [], completion: [] },
        classAverageRate: 0,
        attendanceSegments: {
          attendance: { excellent: 0, good: 0, average: 0, risky: 0 },
          assignment: { excellent: 0, good: 0, average: 0, risky: 0 },
          project: { excellent: 0, good: 0, average: 0, risky: 0 },
        },
        chronicAbsenteesInSession: [],
        recentAbsentees: [],
        recentAbsenceSessionNumbers: [],
      };
    }

    const enrollmentIds = new Set(selectedAttendanceClass.enrollments.map((enrollment: any) => enrollment.id));
    const recordsForClass = attendanceRecords.filter((record) =>
      enrollmentIds.has(String(record.enrollment_id ?? "")),
    );
    const totalStudents = selectedAttendanceClass.enrollments.length;

    const countSession = (sessionNumber: number) => {
      const rows = recordsForClass.filter((record) => Number(record.session_number ?? 0) === sessionNumber);
      const counted = {
        absent: rows.filter((record) => record.status === "absent").length,
        excused: rows.filter((record) => record.status === "excused").length,
        late: rows.filter((record) => record.status === "late").length,
        present: rows.filter((record) => record.status === "present").length,
      };

      const attended = counted.present + counted.late;

      return {
        ...counted,
        unmarked: Math.max(totalStudents - rows.length, 0),
        attended,
        attendanceRate: totalStudents ? Math.round((attended / totalStudents) * 100) : 0,
        isMarked: rows.length > 0
      };
    };

    const sessionRows = Array.from({ length: attendanceSessionCount }, (_, index) => {
      const sessionNumber = index + 1;
      const counts = countSession(sessionNumber);
      const attended = counts.present + counts.late;

      return {
        ...counts,
        attended,
        attendanceRate: totalStudents ? Math.round((attended / totalStudents) * 1000) / 10 : 0,
        sessionNumber,
      };
    }).filter(row => (row.present + row.absent + row.late + row.excused) > 0);

    const last2Sessions = [...sessionRows].sort((a, b) => b.sessionNumber - a.sessionNumber).slice(0, 2);
    const recentAbsenceSessions = [...sessionRows]
      .filter((row) => row.isMarked && row.sessionNumber <= selectedAttendanceSession)
      .sort((a, b) => b.sessionNumber - a.sessionNumber)
      .slice(0, 2);
    const recentAbsenceSessionNumbers = recentAbsenceSessions.map((row) => row.sessionNumber);
    const recentAbsentees = selectedAttendanceClass.enrollments
      .map((en: any) => {
        const recentRecords = recentAbsenceSessionNumbers.map((sessionNumber) => {
          const record = recordsForClass.find(
            (r) => String(r.enrollment_id) === en.id && Number(r.session_number) === sessionNumber,
          );

          return {
            sessionNumber,
            status: String(record?.status ?? ""),
          };
        });
        const recentAbsentCount = recentRecords.filter((record) => record.status === "absent").length;

        return {
          ...en,
          recentAbsentCount,
          recentRecords,
        };
      })
      .filter((student: any) => student.recentAbsentCount > 0)
      .sort((a: any, b: any) =>
        b.recentAbsentCount - a.recentAbsentCount ||
        String(a.name || "").localeCompare(String(b.name || "")),
      );
    const atRiskStudents = selectedAttendanceClass.enrollments.filter((en: any) => {
      if (last2Sessions.length < 2) return false;
      return last2Sessions.every((session) => {
        const record = recordsForClass.find(
          (r) => String(r.enrollment_id) === en.id && Number(r.session_number) === session.sessionNumber,
        );
        return record?.status === "absent";
      });
    });

    const totalAssignments = Number(selectedAttendanceClass.totalAssignments || 0) || 0;
    const totalPossibleAssignments = (totalStudents * totalAssignments) || 0;
    const assignmentRecordsForClass = assignmentRecords.filter(r =>
      enrollmentIds.has(String(r.enrollment_id))
    );
    const actualAssignmentsCount = assignmentRecordsForClass.filter((record) => Number(record.score ?? 0) > 0 || record.status === "submitted").length;

    const assignmentRate = totalPossibleAssignments ? Math.round((actualAssignmentsCount / totalPossibleAssignments) * 100) : 0;
    
    const projectsSubmittedCount = selectedAttendanceClass.enrollments.filter((en: any) => 
      en.projectUrl || Number(en.projectScore ?? 0) > 0
    ).length;
    const projectRate = totalStudents ? Math.round((projectsSubmittedCount / totalStudents) * 100) : 0;

    const studentDiligence = selectedAttendanceClass.enrollments.map((en: any) => {
      const studentRecords = recordsForClass.filter((r) => String(r.enrollment_id) === en.id);
      const presentCount = studentRecords.filter((r) => r.status === "present").length;
      const lateCount = studentRecords.filter((r) => r.status === "late").length;
      const absentCount = studentRecords.filter((r) => r.status === "absent").length;
      const excusedCount = studentRecords.filter((r) => r.status === "excused").length;
      
      const score = presentCount * 1 + lateCount * 0.5 + excusedCount * 0.8;
      const totalSessionsChecked = studentRecords.length;
      const rate = totalSessionsChecked ? Math.round((score / totalSessionsChecked) * 100) : 0;

      return {
        ...en,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        score,
        rate,
      };
    });

    const topStudents = [...studentDiligence].sort((a: any, b: any) => b.rate - a.rate || b.score - a.score).slice(0, 10);
    const bottomStudents = [...studentDiligence].sort((a: any, b: any) => a.rate - b.rate || a.score - b.score).slice(0, 10);
    const eligibleCertificateStudents = selectedAttendanceClass.enrollments.reduce(
      (groups: { participation: any[]; completion: any[] }, enrollment: any) => {
        const attendanceScore = Number(enrollment.attendanceScore ?? 0);
        const assignmentScore = Number(enrollment.assignmentScore ?? 0);
        const projectScore = Number(enrollment.projectScore ?? 0);
        const finalScore = Number(enrollment.finalScore ?? 0);
        const baseRow = {
          id: enrollment.id,
          name: enrollment.name,
          email: enrollment.email,
          phone: enrollment.phone,
          attendanceScore,
          assignmentScore,
          projectScore,
          finalScore,
        };

        if (attendanceScore >= 4 && projectScore > 0 && finalScore >= 4) {
          groups.completion.push(baseRow);
        } else if (attendanceScore >= 2 && assignmentScore > 0) {
          groups.participation.push(baseRow);
        }

        return groups;
      },
      { participation: [], completion: [] },
    );
    const certificateSummary = {
      participation: eligibleCertificateStudents.participation.length,
      completion: eligibleCertificateStudents.completion.length,
      none: Math.max(totalStudents - eligibleCertificateStudents.participation.length - eligibleCertificateStudents.completion.length, 0),
    };
    const markedSessionCount = sessionRows.filter(r => r.isMarked).length;
    const studentRows = studentDiligence.map((student: any) => {
      const attendedCount = student.presentCount + student.lateCount;
      const myMarkedCount = student.presentCount + student.absentCount + student.lateCount + student.excusedCount;
      const attendanceRate = myMarkedCount ? Math.round((attendedCount / myMarkedCount) * 100) : 0;
      
      // Lấy danh sách điểm danh riêng của học viên này
      const studentRecords = attendanceRecords.filter((r: any) => String(r.enrollment_id) === String(student.id));
      
      let note = "Tham gia tốt";
      let noteTone = "good";

      if (classDashboardMode === "session") {
        const sessionRecord = studentRecords.find((r: any) => Number(r.session_number) === selectedAttendanceSession);
        if (sessionRecord) {
          if (sessionRecord.status === "absent") {
            note = "Vắng mặt";
            noteTone = "danger";
          } else if (sessionRecord.status === "late") {
            note = "Đi muộn";
            noteTone = "warning";
          } else if (sessionRecord.status === "excused") {
            note = "Vắng có phép";
            noteTone = "info";
          } else if (sessionRecord.status === "present") {
            note = "Đã tham gia";
            noteTone = "good";
          }
        } else {
          note = "Chưa điểm danh";
          noteTone = "muted";
        }
      } else {
        // Overall mode summary
        if (student.absentCount >= 2) {
          note = `Vắng ${student.absentCount} buổi`;
          noteTone = "danger";
        } else if (student.absentCount === 1) {
          note = "Vắng 1 buổi";
          noteTone = "warning";
        } else if (student.lateCount >= 2) {
          note = `Muộn ${student.lateCount} buổi`;
          noteTone = "warning";
        } else if (markedSessionCount === 0) {
          note = "Chưa có dữ liệu";
          noteTone = "muted";
        }
      }

      return {
        ...student,
        attendedCount,
        attendanceRate,
        note,
        noteTone,
      };
    });

    const droppedCount = selectedAttendanceClass.enrollments.filter((en: any) => en.status === "dropped").length;

    return {
      droppedCount,
      statusCounts: sessionRows.reduce(
        (totals, row) => ({
          absent: totals.absent + row.absent,
          excused: totals.excused + row.excused,
          late: totals.late + row.late,
          present: totals.present + row.present,
          unmarked: totals.unmarked + row.unmarked,
        }),
        { absent: 0, excused: 0, late: 0, present: 0, unmarked: 0 },
      ),
      sessionRows,
      selectedSession: countSession(selectedAttendanceSession),
      prevSession: (() => {
        // Tìm buổi gần nhất có ít nhất 1 bản ghi điểm danh trước buổi hiện tại
        const markedSessionsBefore = sessionRows
          .filter(s => s.sessionNumber < selectedAttendanceSession && s.isMarked)
          .sort((a, b) => b.sessionNumber - a.sessionNumber);
        
        if (markedSessionsBefore.length === 0) {
          return { absent: 0, excused: 0, late: 0, present: 0, unmarked: 0, attendanceRate: 0, sessionNumber: 0 };
        }
        
        const targetPrevSession = markedSessionsBefore[0].sessionNumber;
        return { ...countSession(targetPrevSession), sessionNumber: targetPrevSession };
      })(),
      totalStudents,
      atRiskStudents,
      assignmentRate,
      projectRate,
      submissionSummary: {
        assignment: {
          submitted: actualAssignmentsCount,
          missing: Math.max(totalPossibleAssignments - actualAssignmentsCount, 0),
          total: totalPossibleAssignments,
        },
        project: {
          submitted: projectsSubmittedCount,
          missing: Math.max(totalStudents - projectsSubmittedCount, 0),
          total: totalStudents,
        },
      },
      certificateSummary,
      eligibleCertificateStudents,
      topStudents,
      bottomStudents,
      studentRows,
      classAverages: (() => {
        const markedSessions = sessionRows.filter(r => r.isMarked);
        if (markedSessions.length === 0) return { present: 0, absent: 0, late: 0, excused: 0, rate: 0 };
        return {
          present: Math.round(markedSessions.reduce((sum, r) => sum + r.present, 0) / markedSessions.length),
          absent: Math.round(markedSessions.reduce((sum, r) => sum + r.absent, 0) / markedSessions.length),
          late: Math.round(markedSessions.reduce((sum, r) => sum + r.late, 0) / markedSessions.length),
          excused: Math.round(markedSessions.reduce((sum, r) => sum + r.excused, 0) / markedSessions.length),
          rate: Math.round(markedSessions.reduce((sum, r) => sum + r.attendanceRate, 0) / markedSessions.length)
        };
      })(),
      classAverageRate: 0, // Assigned below
      attendanceSegments: (() => {
        const markedCount = sessionRows.filter(r => r.isMarked).length;
        
        const results = {
          attendance: { excellent: 0, good: 0, average: 0, risky: 0 },
          assignment: { excellent: 0, good: 0, average: 0, risky: 0 },
          project: { excellent: 0, good: 0, average: 0, risky: 0 },
        };
        
        selectedAttendanceClass.enrollments.forEach((en: any) => {
          const attendRecords = recordsForClass.filter(r => String(r.enrollment_id) === en.id);
          const attended = attendRecords.filter(r => r.status === "present" || r.status === "late").length;
          const myMarkedCount = attendRecords.length;
          const attendRate = myMarkedCount ? Math.round((attended / myMarkedCount) * 100) : 0;
          
          const assignRecords = assignmentRecords.filter(r => String(r.enrollment_id) === en.id);
          const submittedAssign = assignRecords.filter(r => r.status === "submitted").length;
          const totalAssigns = Array.from(new Set(assignmentRecords.map(r => r.assignment_id))).length || 1;
          const assignRate = Math.round((submittedAssign / totalAssigns) * 100);

          const projRecords = assignmentRecords.filter(r => String(r.enrollment_id) === en.id && r.project_id);
          const submittedProj = projRecords.filter(r => r.status === "submitted").length;
          const totalProjs = Array.from(new Set(assignmentRecords.filter(r => r.project_id).map(r => r.project_id))).length || 1;
          const projRate = Math.round((submittedProj / totalProjs) * 100);

          const categorize = (rate: number, type: keyof typeof results) => {
            if (rate >= 90) results[type].excellent++;
            else if (rate >= 70) results[type].good++;
            else if (rate >= 50) results[type].average++;
            else results[type].risky++;
          };

          categorize(attendRate, "attendance");
          categorize(assignRate, "assignment");
          categorize(projRate, "project");
        });
        
        return results;
      })(),
      chronicAbsenteesInSession: selectedAttendanceClass.enrollments.filter((en: any) => {
        const todayRecord = attendanceRecords.find(r => String(r.enrollment_id) === en.id && Number(r.session_number) === selectedAttendanceSession);
        if (!todayRecord || (todayRecord.status !== "absent" && todayRecord.status !== "late")) return false;
        
        const history = attendanceRecords.filter(r => String(r.enrollment_id) === en.id && Number(r.session_number) < selectedAttendanceSession);
        const badCount = history.filter(r => r.status === "absent" || r.status === "late").length;
        return badCount >= 2;
      }).map((en: any) => {
        const history = attendanceRecords.filter(r => String(r.enrollment_id) === en.id && Number(r.session_number) < selectedAttendanceSession);
        return {
          ...en,
          badCount: history.filter(r => r.status === "absent" || r.status === "late").length
        };
      }),
      recentAbsentees,
      recentAbsenceSessionNumbers,
    };
  }, [attendanceRecords, assignmentRecords, attendanceSessionCount, selectedAttendanceClass, selectedAttendanceSession]);
}
