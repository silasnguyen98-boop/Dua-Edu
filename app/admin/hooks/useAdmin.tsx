"use client";

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { buildStyledWorkbook, downloadWorkbook, type StyledColumn } from "@/app/admin/excel-utils";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getUsersSafe,
  createStudentAccount,
  createUser as createUserSafe,
  deleteUser as deleteUserSafe,
  resetStudentPassword,
  updateUser as updateUserSafe,
} from "@/app/actions/users";
import {
  getMyAssignedClassIds,
  getClassAssistantsSafe,
  assignAssistantSafe,
  removeAssistantSafe,
} from "@/app/actions/assistants";
import { bulkImportAction } from "@/app/actions/import";
import { useDashboardMetrics } from "./useDashboardMetrics";
import {
  attendanceStatusOptions,
  certificateStatusOptions,
  chartColors,
  emptyData,
  enrollmentStatusOptions,
  pageSizeOptions,
  storageKeys,
  tableConfigs,
} from "@/app/admin/constants";
import {
  buildEmptyForm,
  formatLabel,
  formatValue,
  getImportColumnName,
  getInitialAttendanceMode,
  getInitialClassId,
  getInitialSearch,
  getInitialSession,
  getInitialView,
  getSidebarGroupForView,
  isAssistantAllowedView,
  isTableName,
  toInputValue,
} from "@/app/admin/helpers";
import type {
  AssignmentRecord,
  AttendanceRecord,
  ClassAssistant,
  DataState,
  FieldConfig,
  FormState,
  Row,
  SidebarGroup,
  TableName,
  ViewName,
  UseAdminReturn,
  AdminUser,
  UserRole,
} from "@/app/admin/types";

export function useAdmin(): UseAdminReturn {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<ViewName>((searchParams.get("view") as ViewName) || "classManagement");
  const [openSidebarGroup, setOpenSidebarGroup] = useState<SidebarGroup>(() =>
    getSidebarGroupForView(activeView)
  );
  const [data, setData] = useState<DataState>(emptyData);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceError, setAttendanceError] = useState("");
  const [assignmentRecords, setAssignmentRecords] = useState<AssignmentRecord[]>([]);
  const [assignmentError, setAssignmentError] = useState("");
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(tableConfigs[0].fields));
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(getInitialClassId);
  const [selectedAttendanceClassId, setSelectedAttendanceClassId] = useState<string | null>(getInitialClassId);
  const [selectedAttendanceSession, setSelectedAttendanceSession] = useState(getInitialSession);
  const [attendanceMode, setAttendanceMode] = useState<"session" | "summary">(getInitialAttendanceMode);
  const [relationQueries, setRelationQueries] = useState<Record<string, string>>({});
  const [openRelationPicker, setOpenRelationPicker] = useState<string | null>(null);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(null);
  const [updatingCertificateEnrollmentId, setUpdatingCertificateEnrollmentId] = useState<string | null>(null);
  const [classStatusFilter, setClassStatusFilter] = useState("all");
  const [classDetailSortField, setClassDetailSortField] = useState<string>("name");
  const [classDetailSortDir, setClassDetailSortDir] = useState<"asc" | "desc">("asc");
  const [classSessionsFilterId, setClassSessionsFilterId] = useState<string | null>(getInitialClassId);
  const [assistantAssignmentSearch, setAssistantAssignmentSearch] = useState("");
  const [assistantAssignmentsByClass, setAssistantAssignmentsByClass] = useState<Record<string, ClassAssistant[]>>({});
  const [search, setSearch] = useState(getInitialSearch);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<Row | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousDataTableRef = useRef<TableName | null>(null);
  const activeTable: TableName = isTableName(activeView) ? activeView : "students";
  
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", username: "", role: "admin" as UserRole, id: "" });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentAccount, setCurrentAccount] = useState<{ email: string; name: string; role: string } | null>(null);
  const [accountTab, setAccountTab] = useState<"staff" | "student">("staff");
  const [classDashboardMode, setClassDashboardMode] = useState<"session" | "overall">("session");
  const [segmentCriteria, setSegmentCriteria] = useState<"attendance" | "assignment" | "project">("attendance");
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Row | null>(null);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [assistantAssignmentsLoaded, setAssistantAssignmentsLoaded] = useState(false);
  const [classAssistants, setClassAssistants] = useState<ClassAssistant[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showCertGuide, setShowCertGuide] = useState(false);
  const [showAttendanceGuide, setShowAttendanceGuide] = useState(false);

  useEffect(() => {
    if (showAssignModal) {
      void loadClassAssistants(showAssignModal).then(res => setClassAssistants(res));
    } else {
      setClassAssistants([]);
    }
  }, [showAssignModal]);

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const loadIdRef = useRef(0);

  // "isAssistantUser" được giữ tên cũ nhưng mang nghĩa "scoped staff":
  // gồm cả assistant lẫn teacher — hai vai trò có scope dữ liệu giống nhau
  // (chỉ thấy lớp họ phụ trách / dạy). Dùng isStrictAssistant cho các luồng
  // chỉ dành riêng cho assistant (vd: view phân công assistant).
  const isStrictAssistant = currentUserRole === "assistant";
  const isTeacherUser = currentUserRole === "teacher";
  const isAssistantUser = isStrictAssistant || isTeacherUser;
  const isAdminView = currentUserRole === "admin" || currentUserRole === "operation";

  const isDataView = isTableName(activeView);
  const isClassDetailView = activeView === "classDetail";
  const isAssistantAssignmentsView = activeView === "assistantAssignments";
  const isClassDashboardView = activeView === "classDashboard";
  const isAttendanceView = activeView === "attendance";
  const isAssignmentScoreView = activeView === "assignmentScore";
  const isProjectScoreView = activeView === "projectScore";
  const isAdminsView = activeView === "admins";

  const activeConfig = tableConfigs.find(c => c.name === activeTable) || tableConfigs[0];

  useEffect(() => {
    if ((currentUserRole === "assistant" || currentUserRole === "teacher") && activeView === "dashboard") {
      setOpenSidebarGroup("academic");
      setActiveView("classManagement");
    }
  }, [activeView, currentUserRole]);

  const stats = useMemo(
    () => [
      { label: "Học viên", value: data.students.length },
      { label: "Giảng viên", value: data.teachers.length },
      { label: "Khoá học", value: data.courses.length },
      { label: "Lớp học", value: data.classes.length },
      { label: "Ghi danh", value: data.enrollments.length },
      { label: "Chứng chỉ", value: data.certificates.length },
    ],
    [data],
  );

  const analytics = useMemo(() => {
    const classById = new Map(data.classes.map((item) => [String(item.id), item]));
    const courseById = new Map(data.courses.map((item) => [String(item.id), item]));
    const studentById = new Map(data.students.map((item) => [String(item.id), item]));
    const teacherById = new Map(data.teachers.map((item) => [String(item.id), item]));
    const certificateByEnrollmentId = new Map(data.certificates.map((item) => [String(item.enrollment_id), item]));
    const courseEnrollments = new Map<string, number>();
    const teacherEnrollments = new Map<string, number>();
    const classEnrollments = new Map<string, number>();
    const classEnrollmentRows = new Map<string, Row[]>();
    const studentClasses = new Map<string, Set<string>>();
    const studentEnrollmentRows = new Map<string, Row[]>();

    data.enrollments.forEach((enrollment) => {
      const studentId = enrollment.student_id ? String(enrollment.student_id) : "";
      const classId = enrollment.class_id ? String(enrollment.class_id) : "";
      const classRow = classById.get(classId);
      const courseId = classRow?.course_id ? String(classRow.course_id) : "";
      const teacherId = classRow?.teacher_id ? String(classRow.teacher_id) : "";

      if (classId) {
        classEnrollments.set(classId, (classEnrollments.get(classId) ?? 0) + 1);
        if (!classEnrollmentRows.has(classId)) classEnrollmentRows.set(classId, []);
        classEnrollmentRows.get(classId)?.push(enrollment);
      }
      if (studentId && classId) {
        if (!studentClasses.has(studentId)) studentClasses.set(studentId, new Set());
        studentClasses.get(studentId)?.add(classId);
      }
      if (studentId) {
        if (!studentEnrollmentRows.has(studentId)) studentEnrollmentRows.set(studentId, []);
        studentEnrollmentRows.get(studentId)?.push(enrollment);
      }
      if (courseId) courseEnrollments.set(courseId, (courseEnrollments.get(courseId) ?? 0) + 1);
      if (teacherId) teacherEnrollments.set(teacherId, (teacherEnrollments.get(teacherId) ?? 0) + 1);
    });

    const buildItems = (source: Map<string, number>, labels: Map<string, Row>, labelKey: string, codeKey?: string) => {
      const total = Array.from(source.values()).reduce((sum, value) => sum + value, 0);
      return Array.from(source.entries())
        .map(([id, value], index) => {
          const row = labels.get(id);
          const code = codeKey && row?.[codeKey] ? `${String(row[codeKey])} - ` : "";
          return {
            color: chartColors[index % chartColors.length],
            id,
            label: row?.[labelKey] ? `${code}${String(row[labelKey])}` : id.slice(0, 8),
            percent: total ? Math.round((value / total) * 1000) / 10 : 0,
            value,
          };
        })
        .sort((a, b) => b.value - a.value);
    };

    const classItems = data.classes
      .map((classRow) => {
        const classId = String(classRow.id ?? "");
        const course = classRow.course_id ? courseById.get(String(classRow.course_id)) : undefined;
        const teacher = classRow.teacher_id ? teacherById.get(String(classRow.teacher_id)) : undefined;

        return {
          classCode: String(classRow.class_code ?? "-"),
          className: String(classRow.class_name ?? classId.slice(0, 8)),
          courseCode: String(course?.course_code ?? "-"),
          courseId: String(classRow.course_id ?? ""),
          courseName: String(course?.name ?? "-"),
          enrollmentCount: classEnrollments.get(classId) ?? 0,
          enrollments: (classEnrollmentRows.get(classId) ?? []).map((enrollment) => {
            const student = enrollment.student_id ? studentById.get(String(enrollment.student_id)) : undefined;
            const certificate = certificateByEnrollmentId.get(String(enrollment.id ?? ""));
            return {
              attendanceScore: enrollment.attendance_score != null ? Number(enrollment.attendance_score) : null,
              assignmentScore: enrollment.assignment_score != null ? Number(enrollment.assignment_score) : null,
              certificateCode: certificate?.certificate_code ? String(certificate.certificate_code) : "",
              certificateId: certificate?.id ? String(certificate.id) : "",
              certificateRecordStatus: certificate?.status ? String(certificate.status) : "",
              certificateRecordType: certificate?.certificate_type ? String(certificate.certificate_type) : "",
              projectScore: enrollment.project_score != null ? Number(enrollment.project_score) : null,
              finalScore: enrollment.final_score != null ? Number(enrollment.final_score) : null,
              projectUrl: enrollment.project_url ? String(enrollment.project_url) : "",
              createdAt: enrollment.created_at ? String(enrollment.created_at) : "",
              email: String(student?.email ?? "-"),
              id: String(enrollment.id ?? ""),
              name: String(student?.full_name ?? String(enrollment.student_id ?? "-")),
              phone: String(student?.phone ?? "-"),
              status: String(enrollment.status ?? ""),
              studentId: String(enrollment.student_id ?? ""),
            };
          }),
          id: classId,
          raw: classRow,
          schedule: String(classRow.schedule ?? "-"),
          startDate: classRow.start_date ? String(classRow.start_date) : "-",
          studyTime: String(classRow.study_time ?? "-"),
          teacherName: String(teacher?.full_name ?? "-"),
          totalSessions: classRow.total_sessions ? String(classRow.total_sessions) : "-",
          totalAssignments: classRow.total_assignments ? String(classRow.total_assignments) : "-",
        };
      })
      .sort((a, b) => {
        // Sort by start_date desc (lớp mới nhất lên đầu).
        // Lớp chưa có start_date đẩy xuống cuối; tie-break theo class_code.
        const aTime = a.startDate && a.startDate !== "-" ? Date.parse(a.startDate) : NaN;
        const bTime = b.startDate && b.startDate !== "-" ? Date.parse(b.startDate) : NaN;
        const aValid = Number.isFinite(aTime);
        const bValid = Number.isFinite(bTime);
        if (aValid && bValid && aTime !== bTime) return bTime - aTime;
        if (aValid !== bValid) return aValid ? -1 : 1;
        return a.classCode.localeCompare(b.classCode);
      });

    const returningStudentItems = Array.from(studentClasses.entries())
      .filter(([, classes]) => classes.size >= 2)
      .map(([studentId, classes]) => {
        const student = studentById.get(studentId);
        return {
          classCount: classes.size,
          classNames: Array.from(classes).map((classId) => String(classById.get(classId)?.class_name ?? classId.slice(0, 8))),
          email: String(student?.email ?? "-"),
          id: studentId,
          name: String(student?.full_name ?? studentId.slice(0, 8)),
          phone: String(student?.phone ?? "-"),
          totalEnrollments: studentEnrollmentRows.get(studentId)?.length ?? 0,
        };
      })
      .sort((a, b) => b.classCount - a.classCount || a.name.localeCompare(b.name));

    return {
      classItems,
      courseItems: buildItems(courseEnrollments, courseById, "name", "course_code"),
      returnRate: data.students.length ? Math.round((returningStudentItems.length / data.students.length) * 1000) / 10 : 0,
      returningStudentItems,
      returningStudents: returningStudentItems.length,
      teacherItems: buildItems(teacherEnrollments, teacherById, "full_name"),
    };
  }, [data]);

  const visibleClassItems = useMemo(() => {
    if (currentUserRole === "assistant" || currentUserRole === "teacher") {
      return assignedClassIds.length
        ? analytics.classItems.filter((item) => assignedClassIds.includes(item.id))
        : [];
    }
    return analytics.classItems;
  }, [analytics.classItems, assignedClassIds, currentUserRole]);

  const selectedClass = useMemo(
    () => visibleClassItems.find((item) => item.id === selectedClassId) ?? null,
    [visibleClassItems, selectedClassId],
  );

  const selectedAttendanceClass = useMemo(
    () => visibleClassItems.find((item) => item.id === selectedAttendanceClassId) ?? null,
    [visibleClassItems, selectedAttendanceClassId],
  );

  const attendanceSessionCount = useMemo(() => {
    const totalSessions = Number(selectedAttendanceClass?.totalSessions ?? 0);
    const totalAssignments = Number(selectedAttendanceClass?.totalAssignments ?? 0);
    const count = activeView === "assignmentScore" ? totalAssignments : totalSessions;
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  }, [selectedAttendanceClass, activeView]);

  const classDashboardMetrics = useDashboardMetrics({
    selectedAttendanceClass,
    attendanceRecords,
    assignmentRecords,
    attendanceSessionCount,
    selectedAttendanceSession,
    classDashboardMode,
  });

  const selectedClassEnrollments = useMemo(() => {
    const sourceClass = isClassDetailView ? selectedClass : selectedAttendanceClass;
    if (!sourceClass) return [];

    let filtered = sourceClass.enrollments;
    if (isClassDetailView && classStatusFilter !== "all") {
      filtered = classStatusFilter === "__empty"
        ? filtered.filter((enrollment: any) => !enrollment.status)
        : filtered.filter((enrollment: any) => enrollment.status === classStatusFilter);
    }

    return filtered
      .map((enrollment: any) => {
        const attScore = enrollment.attendanceScore != null ? Number(enrollment.attendanceScore) : 0;
        const assignScore = enrollment.assignmentScore != null ? Number(enrollment.assignmentScore) : 0;
        const projScore = enrollment.projectScore != null ? Number(enrollment.projectScore) : 0;
        const finalScore = enrollment.finalScore != null ? Number(enrollment.finalScore) : 0;
        let certificate = enrollment.certificateRecordType || "none";
        if (certificate === "none") {
          if (attScore >= 4 && projScore > 0 && finalScore >= 4) certificate = "completion";
          else if (attScore >= 2 && assignScore > 0) certificate = "participation";
        }
        return { ...enrollment, certificate };
      })
      .sort((a: any, b: any) => {
        const aVal = a[classDetailSortField] ?? "";
        const bVal = b[classDetailSortField] ?? "";
        const comparison = typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
        return classDetailSortDir === "asc" ? comparison : -comparison;
      });
  }, [classDetailSortDir, classDetailSortField, classStatusFilter, isClassDetailView, selectedAttendanceClass, selectedClass]);

  const pageEyebrow = useMemo(() => {
    if (activeView === "dashboard") return "Phân tích hệ thống";
    if (activeView === "classDashboard") return "Báo cáo tiến độ";
    if (activeView === "classManagement") return "Quản lý học thuật";
    if (activeView === "classDetail") return "Hồ sơ lớp học";
    if (activeView === "assistantAssignments") return "Phân quyền quản lý";
    if (activeView === "attendance") return "Công cụ trợ giảng";
    if (activeView === "assignmentScore") return "Công cụ trợ giảng";
    if (activeView === "projectScore") return "Công cụ trợ giảng";
    if (activeView === "admins") return "Quản trị hệ thống";
    if (activeView === "quiz") return "Học tập tương tác";
    return "Quản lý dữ liệu";
  }, [activeView]);

  const pageTitle = useMemo(() => {
    if (activeView === "dashboard") return "Dashboard tổng quan";
    if (activeView === "classDashboard") return "Tiến độ & Chuyên cần";
    if (activeView === "classManagement") return "Danh sách lớp học";
    if (activeView === "classDetail") return selectedClass ? `${selectedClass.className} (${selectedClass.classCode})` : "Chi tiết lớp học";
    if (activeView === "assistantAssignments") return "Phân công Trợ giảng";
    if (activeView === "attendance") return "Điểm danh học viên";
    if (activeView === "assignmentScore") return "Chấm điểm bài tập";
    if (activeView === "projectScore") return "Chấm điểm Project";
    if (activeView === "admins") return "Người dùng hệ thống";
    if (activeView === "quiz") return "Quản lý Quiz";
    return activeConfig.label;
  }, [activeView, activeConfig, selectedClass]);

  const pageDescription = useMemo(() => {
    if (activeView === "dashboard") return "Xem các chỉ số quan trọng và biểu đồ tăng trưởng của trung tâm.";
    if (activeView === "classDashboard") return "Theo dõi tỉ lệ tham gia và kết quả học tập của từng lớp học.";
    if (activeView === "classManagement") return "Quản lý thông tin chung, lịch khai giảng và sĩ số các lớp học.";
    if (activeView === "classDetail") return "Xem danh sách học viên, trạng thái đóng học phí và đồng bộ chứng chỉ.";
    if (activeView === "assistantAssignments") return "Cấp quyền cho Trợ giảng quản lý dữ liệu của từng lớp học cụ thể.";
    if (activeView === "attendance") return "Ghi nhận sự hiện diện của học viên trong từng buổi học của lớp.";
    if (activeView === "assignmentScore") return "Cập nhật kết quả làm bài tập về nhà của học viên theo từng số bài.";
    if (activeView === "projectScore") return "Đánh giá kết quả đồ án cuối khoá của học viên sau khi hoàn thành.";
    if (activeView === "admins") return "Quản lý tài khoản đăng nhập của nhân viên và cấp quyền truy cập.";
    if (activeView === "quiz") return "Tạo quiz cho từng buổi học, chia sẻ link công khai và xem lịch sử lượt làm.";
    return activeConfig.description;
  }, [activeView, activeConfig]);

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    operation: "Operation",
    assistant: "Assistant",
    teacher: "Teacher",
    student: "Student",
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const toggleSidebarGroup = (group: SidebarGroup) => {
    setOpenSidebarGroup(prev => prev === group ? null : group);
  };

  const changeView = (view: ViewName) => {
    const params = new URLSearchParams(window.location.search);
    
    if (isAssistantUser && !isAssistantAllowedView(view)) {
      setOpenSidebarGroup("academic");
      setActiveView("classManagement");
      params.set("view", "classManagement");
      router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
      return;
    }
    
    setOpenSidebarGroup(getSidebarGroupForView(view));
    setActiveView(view);
    params.set("view", view);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  // Data Loading Logic
  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const result = await getUsersSafe(session.access_token);
      setAdminUsers(result.users);
      if (!result.ok) setError(result.error);
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách quản trị viên.");
    } finally {
      setIsLoading(false);
    }
  };

  const attendanceRecordsByEnrollment = useMemo(() => {
    const map = new Map<string, any>();
    attendanceRecords.forEach(r => {
      if (Number(r.session_number) === selectedAttendanceSession) {
        map.set(String(r.enrollment_id), r);
      }
    });
    return map;
  }, [attendanceRecords, selectedAttendanceSession]);

  const assistantUserByProfileId = useMemo(() => {
    return new Map(adminUsers.map((user) => [String(user.profile_id ?? user.id), user]));
  }, [adminUsers]);

  const assistantAssignmentClassItems = useMemo(() => {
    const keyword = assistantAssignmentSearch.trim().toLowerCase();
    if (!keyword) return visibleClassItems;
    return visibleClassItems.filter((item) =>
      item.className.toLowerCase().includes(keyword) ||
      item.classCode.toLowerCase().includes(keyword) ||
      item.courseName.toLowerCase().includes(keyword) ||
      item.teacherName.toLowerCase().includes(keyword),
    );
  }, [assistantAssignmentSearch, visibleClassItems]);

  const assignedAssistantTotal = useMemo(
    () => Object.values(assistantAssignmentsByClass).reduce((sum, rows) => sum + rows.length, 0),
    [assistantAssignmentsByClass],
  );

  async function loadClassAssistants(classId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const result = await getClassAssistantsSafe(session.access_token, classId);
    return result.ok ? (result.assistants as ClassAssistant[]) : [];
  }

  async function loadAssistantAssignmentOverview() {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const usersResult = await getUsersSafe(session.access_token);
      setAdminUsers(usersResult.users);
      if (!usersResult.ok) setError(usersResult.error);

      const assignments = await Promise.all(
        visibleClassItems.map(async (classItem) => [
          classItem.id,
          await loadClassAssistants(classItem.id),
        ] as const),
      );
      setAssistantAssignmentsByClass(Object.fromEntries(assignments));
    } catch (err: any) {
      setError(err.message || "Không tải được dữ liệu phân công trợ giảng.");
    } finally {
      setIsLoading(false);
    }
  }

  async function assignAssistantToClass(classId: string, assistantId: string) {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");
      const result = await assignAssistantSafe(session.access_token, classId, assistantId);
      if (!result.ok) throw new Error(result.error);
      setMessage("Đã phân công trợ giảng.");
      await loadAssistantAssignmentOverview();
    } catch (err: any) {
      setError(err.message || "Không phân công được trợ giảng.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAssistantFromClass(assignmentId: string) {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");
      const result = await removeAssistantSafe(session.access_token, assignmentId);
      if (!result.ok) throw new Error(result.error);
      setMessage("Đã gỡ phân công trợ giảng.");
      await loadAssistantAssignmentOverview();
    } catch (err: any) {
      setError(err.message || "Không gỡ được trợ giảng.");
    } finally {
      setIsSaving(false);
    }
  }

  const assignmentRecordsByEnrollment = useMemo(() => {
    const map = new Map<string, Record<number, any>>();
    assignmentRecords.forEach(r => {
      const eid = String(r.enrollment_id);
      if (!map.has(eid)) map.set(eid, {});
      map.get(eid)![Number(r.assignment_number)] = r;
    });
    return map;
  }, [assignmentRecords]);

  async function loadAttendanceRecords(allowedEnrollmentIds?: Set<string> | null) {
    setAttendanceError("");
    const { data: rows, error: tableError } = await supabase
      .from("attendance_records")
      .select("*")
      .order("session_number", { ascending: true });

    if (tableError) {
      setAttendanceRecords([]);
      setAttendanceError("Chưa tìm thấy bảng attendance_records.");
      return;
    }

    setAttendanceRecords(
      allowedEnrollmentIds
        ? (rows ?? []).filter((row) => allowedEnrollmentIds.has(String(row.enrollment_id ?? "")))
        : rows ?? [],
    );
  }

  async function loadAssignmentRecords(allowedEnrollmentIds?: Set<string> | null) {
    setAssignmentError("");
    const { data: rows, error: tableError } = await supabase
      .from("assignment_records")
      .select("*")
      .order("assignment_number", { ascending: true });

    if (tableError) {
      setAssignmentRecords([]);
      setAssignmentError("Chưa tìm thấy bảng assignment_records.");
      return;
    }

    setAssignmentRecords(
      allowedEnrollmentIds
        ? (rows ?? []).filter((row) => allowedEnrollmentIds.has(String(row.enrollment_id ?? "")))
        : rows ?? [],
    );
  }

  async function loadAllTables() {
    const currentLoadId = ++loadIdRef.current;
    setIsLoading(true);
    setError("");

    const results = await Promise.all(
      tableConfigs.map(async (config) => {
        const selectQuery = config.name === "class_sessions"
          ? "id, class_id, session_number, session_title, session_date, start_time, end_time, note, created_at"
          : "*";

        const { data: rows, error: tableError } = await supabase
          .from(config.name)
          .select(selectQuery as any)
          .order("created_at", { ascending: false });

        return {
          error: tableError ? `${config.label}: ${tableError.message}` : "",
          name: config.name,
          rows: (rows as any ?? []) as Row[],
        };
      }),
    );

    if (currentLoadId !== loadIdRef.current) return;

    const nextData: DataState = { ...emptyData };
    const loadErrors = results.filter((result) => result.error).map((result) => result.error);
    results.forEach((result) => {
      nextData[result.name] = result.error ? [] : result.rows;
    });

    let assistantEnrollmentIds: Set<string> | null = null;
    if (isAssistantUser) {
      const allowedClassIds = new Set(assignedClassIds);
      nextData.classes = nextData.classes.filter((row) => allowedClassIds.has(String(row.id ?? "")));
      nextData.class_sessions = nextData.class_sessions.filter((row) => allowedClassIds.has(String(row.class_id ?? "")));
      nextData.enrollments = nextData.enrollments.filter((row) => allowedClassIds.has(String(row.class_id ?? "")));
      assistantEnrollmentIds = new Set(nextData.enrollments.map((row) => String(row.id ?? "")));
      const allowedStudentIds = new Set(nextData.enrollments.map((row) => String(row.student_id ?? "")));
      const allowedCourseIds = new Set(nextData.classes.map((row) => String(row.course_id ?? "")));
      const allowedTeacherIds = new Set(nextData.classes.map((row) => String(row.teacher_id ?? "")));
      nextData.students = nextData.students.filter((row) => allowedStudentIds.has(String(row.id ?? "")));
      nextData.courses = nextData.courses.filter((row) => allowedCourseIds.has(String(row.id ?? "")));
      nextData.teachers = nextData.teachers.filter((row) => allowedTeacherIds.has(String(row.id ?? "")));
      nextData.certificates = nextData.certificates.filter((row) => assistantEnrollmentIds?.has(String(row.enrollment_id ?? "")) ?? false);
    }

    setData(nextData);
    if (loadErrors.length) setError(`Không tải được một số bảng: ${loadErrors.join("; ")}`);
    await Promise.all([
      loadAttendanceRecords(assistantEnrollmentIds),
      loadAssignmentRecords(assistantEnrollmentIds),
    ]);
    setIsLoading(false);
  }

  function updateFormValue(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Row Management
  async function saveRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (isAssistantUser && activeTable === "students") {
      setError("Bạn không có quyền thao tác trên dữ liệu học viên.");
      return;
    }
    if (isAssistantUser && activeTable === "classes" && !editingRow?.id) {
      setError("Bạn không có quyền tạo lớp học mới.");
      return;
    }
    const missingField = activeConfig.fields.find(f => f.required && !form[f.name]?.trim());
    if (missingField) {
      setError(`Vui lòng ${missingField.optionsKey ? "chọn" : "nhập"} ${missingField.label}.`);
      return;
    }
    setIsSaving(true);
    const payload = buildPayload();
    if (isAssistantUser && activeTable === "classes" && editingRow?.id) {
      delete (payload as any).class_name;
      delete (payload as any).class_code;
    }
    const request = editingRow?.id
      ? supabase.from(activeTable).update(payload).eq("id", editingRow.id)
      : supabase.from(activeTable).insert(payload);
    const { error: saveError } = await request;
    if (saveError) { setError(saveError.message); setIsSaving(false); return; }
    setMessage(editingRow ? "Đã cập nhật bản ghi." : "Đã thêm bản ghi mới.");
    resetForm();
    await loadAllTables();
    setIsSaving(false);
  }

  async function deleteRow(row: Row) {
    if (isAssistantUser && activeTable === "classes") {
      setError("Bạn không có quyền xoá lớp học.");
      return;
    }
    if (!window.confirm(`Xác nhận xoá bản ghi này?`)) return;
    setIsSaving(true);
    const { error: deleteError } = await supabase.from(activeTable).delete().eq("id", row.id);
    if (deleteError) { setError(deleteError.message); }
    else { setMessage("Đã xoá bản ghi."); await loadAllTables(); }
    setIsSaving(false);
  }

  function startEdit(row: Row) {
    setSelectedSessionDetail(null);
    const nextForm = activeConfig.fields.reduce<FormState>((fs, f) => {
      fs[f.name] = toInputValue(f, row[f.name]);
      return fs;
    }, {});
    setEditingRow(row); setForm(nextForm); setRelationQueries({}); setOpenRelationPicker(null); setMessage(""); setError("");
  }

  function startEditClass(row: Row) {
    const classConfig = tableConfigs.find((config) => config.name === "classes");
    if (!classConfig) return;

    setSelectedSessionDetail(null);
    setActiveView("classes");
    const nextForm = classConfig.fields.reduce<FormState>((fs, f) => {
      fs[f.name] = toInputValue(f, row[f.name]);
      return fs;
    }, {});
    setEditingRow(row);
    setForm(nextForm);
    setRelationQueries({});
    setOpenRelationPicker(null);
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingRow(null);
    const newForm = buildEmptyForm(activeConfig.fields);
    if (activeConfig.name === "class_sessions" && classSessionsFilterId) newForm.class_id = classSessionsFilterId;
    setForm(newForm); setRelationQueries({}); setOpenRelationPicker(null); setMessage(""); setError("");
  }

  function buildPayload() {
    const payload = activeConfig.fields.reduce<Record<string, string | number | null>>((p, f) => {
      const rawValue = form[f.name]?.trim() ?? "";
      if (rawValue === "") p[f.name] = null;
      else if (f.type === "number") p[f.name] = Number(rawValue);
      else if (f.type === "datetime-local") p[f.name] = new Date(rawValue).toISOString();
      else p[f.name] = rawValue;
      return p;
    }, {});
    if (activeTable === "classes" || activeTable === "class_sessions") {
      delete (payload as any).status;
    }
    if (editingRow?.id && activeTable === "classes") {
      for (const field of activeConfig.fields) {
        const nextValue = payload[field.name];
        const currentValue = editingRow[field.name] ?? null;
        const isSameNumber =
          field.type === "number" &&
          (nextValue == null || nextValue === "" ? null : Number(nextValue)) ===
            (currentValue == null || currentValue === "" ? null : Number(currentValue));
        const isSameValue = field.type === "number"
          ? isSameNumber
          : String(nextValue ?? "") === String(currentValue ?? "");

        if (isSameValue) delete payload[field.name];
      }
    }
    return payload;
  }

  // Import/Export Logic
  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsSaving(true); setError(""); setMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("File Excel không có sheet nào.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], { defval: "", range: 3 });
      const payload = rows.map(row => activeConfig.fields.reduce<Record<string, any>>((r, f) => {
        r[f.name] = normalizeImportValue(f, row[getImportColumnName(f)]);
        return r;
      }, {})).filter(row => Object.values(row).some(v => v !== null && v !== ""));
      if (!payload.length) throw new Error("Không có dòng dữ liệu hợp lệ.");
      const resolvedPayload = await resolveImportReferences(payload);
      if (activeTable === "classes" || activeTable === "class_sessions") {
        resolvedPayload.forEach(r => { if ('status' in r) delete r.status; });
      }
      const importData = await skipDuplicateEmails(resolvedPayload);
      if (!importData.payload.length) { setMessage("Không có dòng mới để import."); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");
      const result = await bulkImportAction(session.access_token, activeTable, importData.payload);
      if (!result.ok) throw new Error(result.error);
      setMessage(`✓ Đã import ${result.data?.length || 0} dòng thành công.`);
      await loadAllTables();
    } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
  }

  function templateColumnWidth(field: FieldConfig, header: string) {
    if (field.type === "textarea" || field.name === "note") return 36;
    if (field.name.endsWith("_url") || field.name === "linkedin_url" || field.name === "avatar_url") return 38;
    if (field.type === "date" || field.type === "datetime-local") return 18;
    if (field.type === "number") return 14;
    return Math.max(header.length + 4, 18);
  }

  async function downloadTemplate() {
    const fields = activeConfig.fields;
    const columns: StyledColumn[] = fields.map((field) => {
      const header = getImportColumnName(field);
      return {
        header,
        key: header,
        required: field.required,
        width: templateColumnWidth(field, header),
      };
    });

    const guideColumns: StyledColumn[] = [
      { header: "Cột import", key: "name", width: 28 },
      { header: "Tên trường", key: "label", width: 32 },
      { header: "Kiểu dữ liệu", key: "type", width: 16 },
      { header: "Bắt buộc", key: "required", width: 12, align: "center" },
      { header: "Ví dụ", key: "example", width: 32 },
    ];
    const guideRows = fields.map((field) => ({
      name: getImportColumnName(field),
      label: field.label,
      type: field.type,
      required: field.required ? "Có" : "",
      example: field.exampleValue ?? "",
    }));

    const subtitle =
      "Giữ nguyên dòng tiêu đề ở hàng 4. Nhập dữ liệu từ hàng 5 trở xuống. " +
      'Cột có nền đỏ là trường bắt buộc. Chi tiết các cột xem tại sheet "Hướng dẫn".';

    const workbook = await buildStyledWorkbook({
      sheetName: activeConfig.label,
      title: `MẪU IMPORT - ${activeConfig.label.toUpperCase()}`,
      subtitle,
      columns,
      rows: [],
      emptyData: true,
      extraSheets: [{ name: "Hướng dẫn", columns: guideColumns, rows: guideRows }],
    });
    await downloadWorkbook(workbook, `${activeConfig.name}-template.xlsx`);
  }

  async function exportData() {
    const exportedAt = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

    if (isClassDetailView && selectedClass) {
      const certificateLabelMap: Record<string, string> = {
        completion: "Hoàn thành",
        participation: "Tham gia",
        none: "",
      };
      const enrollmentStatusLabel = (value: string) =>
        enrollmentStatusOptions.find((opt) => opt.value === value)?.label ?? value ?? "";
      const certificateRecordStatusLabel = (value: string) =>
        certificateStatusOptions.find((opt) => opt.value === value)?.label ?? value ?? "";

      const columns: StyledColumn[] = [
        { header: "Học viên", key: "name", width: 28 },
        { header: "Email", key: "email", width: 30 },
        { header: "Chuyên cần", key: "attendance", width: 14, align: "center" },
        { header: "Bài tập", key: "assignment", width: 14, align: "center" },
        { header: "Đồ án", key: "project", width: 14, align: "center" },
        { header: "Tổng kết", key: "final", width: 14, align: "center" },
        { header: "Chứng chỉ", key: "certificate", width: 18, align: "center" },
        { header: "Trạng thái chứng chỉ", key: "certificate_status", width: 22, align: "center" },
        { header: "Trạng thái", key: "status", width: 16, align: "center" },
      ];
      const rows = selectedClassEnrollments.map((enrollment: any) => ({
        name: enrollment.name ?? "",
        email: enrollment.email ?? "",
        attendance: enrollment.attendanceScore ?? "",
        assignment: enrollment.assignmentScore ?? "",
        project: enrollment.projectScore ?? "",
        final: enrollment.finalScore ?? "",
        certificate: certificateLabelMap[enrollment.certificate] ?? "",
        certificate_status: enrollment.certificateId
          ? certificateRecordStatusLabel(enrollment.certificateRecordStatus || "pending")
          : "",
        status: enrollmentStatusLabel(enrollment.status),
      }));

      const sheetName = (selectedClass.classCode || selectedClass.className || "class")
        .toString()
        .slice(0, 31);
      const subtitle = [
        `Khoá: ${selectedClass.courseName || "-"}`,
        `GV: ${selectedClass.teacherName || "-"}`,
        `Bắt đầu: ${selectedClass.startDate || "-"}`,
        `Lịch: ${selectedClass.schedule || "-"}`,
        `Sĩ số: ${selectedClass.enrollmentCount ?? 0}`,
        `Xuất lúc ${exportedAt}`,
      ].join(" · ");

      const workbook = await buildStyledWorkbook({
        sheetName,
        title: `${selectedClass.className || "LỚP"} (${selectedClass.classCode || "-"})`,
        subtitle,
        columns,
        rows,
      });
      const fileSlug = selectedClass.classCode || selectedClass.id;
      await downloadWorkbook(workbook, `class-${fileSlug}-export.xlsx`);
      return;
    }

    const fields = activeConfig.fields;
    const sourceRows = (filteredRows as Row[]).filter((row) => !(row as any).__placeholder);

    const columns: StyledColumn[] = [
      ...fields.map((field) => {
        const header = getImportColumnName(field);
        return {
          header,
          key: header,
          width: templateColumnWidth(field, header),
        };
      }),
      { header: "created_at", key: "created_at", width: 22 },
    ];

    const rows = sourceRows.map((row) =>
      columns.reduce<Record<string, any>>((acc, col) => {
        const field = fields.find((f) => getImportColumnName(f) === col.key);
        acc[col.key] = field ? getExportValue(field, row) : row[col.key];
        return acc;
      }, {}),
    );

    const workbook = await buildStyledWorkbook({
      sheetName: activeConfig.label,
      title: `${activeConfig.label.toUpperCase()} - Xuất lúc ${exportedAt}`,
      subtitle: `Tổng số: ${rows.length} bản ghi`,
      columns,
      rows,
    });
    await downloadWorkbook(workbook, `${activeConfig.name}-export.xlsx`);
  }

  function getExportValue(field: FieldConfig, row: Row) {
    if (!field.importKey) return row[field.name];
    if (field.importKey === "course_code") return data.courses.find(i => i.id === row[field.name])?.course_code ?? row[field.name];
    if (field.importKey === "teacher_email") return data.teachers.find(i => i.id === row[field.name])?.email ?? row[field.name];
    if (field.importKey === "student_email") return data.students.find(i => i.id === row[field.name])?.email ?? row[field.name];
    if (field.importKey === "class_code") return data.classes.find(i => i.id === row[field.name])?.class_code ?? row[field.name];
    return row[field.name];
  }

  // Academic Management
  async function updateEnrollmentStatus(enrollmentId: string, status: string) {
    setUpdatingEnrollmentId(enrollmentId);
    const { error: updateError } = await supabase.from("enrollments").update({ status }).eq("id", enrollmentId);
    if (updateError) setError(updateError.message);
    else await loadAllTables();
    setUpdatingEnrollmentId(null);
  }

  async function updateCertificateStatus(enrollmentId: string, status: string) {
    setUpdatingCertificateEnrollmentId(enrollmentId);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("certificates")
      .update({ status })
      .eq("enrollment_id", enrollmentId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Đã cập nhật trạng thái chứng chỉ.");
      await loadAllTables();
    }

    setUpdatingCertificateEnrollmentId(null);
  }

  async function syncAttendanceScore(enrollmentId: string) {
    const enrollment = data.enrollments.find(e => String(e.id) === String(enrollmentId));
    if (!enrollment) return;
    const cls = data.classes.find(c => String(c.id) === String(enrollment.class_id));
    if (!cls) return;
    const totalSessions = Number(cls.total_sessions || 0);
    if (totalSessions === 0) return;

    const { data: records } = await supabase.from("attendance_records").select("status, session_number").eq("enrollment_id", enrollmentId);
    if (!records) return;

    let totalPoints = 0;
    records.forEach(r => {
      if (Number(r.session_number) === 0) return;
      if (r.status === "present") totalPoints += 1;
      else if (r.status === "late") totalPoints += 0.75;
      else if (r.status === "excused") totalPoints += 0.5;
      else if (r.status === "absent") totalPoints += 0;
    });
    const score = Number(((totalPoints / totalSessions) * 10).toFixed(2));
    await supabase.from("enrollments").update({ attendance_score: score }).eq("id", enrollmentId);
  }

  async function updateAttendance(enrollmentId: string, session: number, status: string, note: string = "") {
    setIsSaving(true);
    if (!status) {
      const { error: deleteError } = await supabase
        .from("attendance_records")
        .delete()
        .eq("enrollment_id", enrollmentId)
        .eq("session_number", session);
      if (deleteError) setError(deleteError.message);
      else {
        setAttendanceRecords((current) =>
          current.filter((record) => !(String(record.enrollment_id) === enrollmentId && Number(record.session_number) === session)),
        );
        await syncAttendanceScore(enrollmentId);
        setMessage("Đã chuyển về Chưa điểm danh và cập nhật điểm CC.");
      }
      setIsSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from("attendance_records").upsert(
      { enrollment_id: enrollmentId, session_number: session, status, note }, 
      { onConflict: "enrollment_id,session_number" }
    );
    if (saveError) setError(saveError.message);
    else {
      await loadAttendanceRecords(new Set(visibleClassItems.flatMap(c => c.enrollments.map((e: any) => e.id))));
      await syncAttendanceScore(enrollmentId);
      setMessage("Đã điểm danh và cập nhật điểm CC.");
    }
    setIsSaving(false);
  }

  async function updateProjectScore(enrollmentId: string, _session: number, score: string) {
    setIsSaving(true);
    const { error: updateError } = await supabase.from("enrollments").update({ project_score: Number(score) || 0 }).eq("id", enrollmentId);
    if (updateError) setError(updateError.message);
    else await loadAllTables();
    setIsSaving(false);
  }

  async function updateProjectLink(enrollmentId: string, url: string) {
    setIsSaving(true);
    const { error: updateError } = await supabase.from("enrollments").update({ project_url: url }).eq("id", enrollmentId);
    if (updateError) setError(updateError.message);
    else await loadAllTables();
    setIsSaving(false);
  }

  async function updateAssignmentScore(enrollmentId: string, assignmentNumber: number, score: string) {
    setIsSaving(true);
    // Điểm trung bình trong enrollments được trigger DB tính từ các assignment_records có điểm.
    const normalizedScore = score.trim();
    const request = normalizedScore === ""
      ? supabase
          .from("assignment_records")
          .delete()
          .eq("enrollment_id", enrollmentId)
          .eq("assignment_number", assignmentNumber)
      : supabase
          .from("assignment_records")
          .upsert(
            { enrollment_id: enrollmentId, assignment_number: assignmentNumber, score: Number(normalizedScore) },
            { onConflict: "enrollment_id,assignment_number" }
          );

    const { error: saveError } = await request;

    if (saveError) {
      setError(saveError.message);
    } else {
      // Refresh dữ liệu để giao diện hiển thị đúng điểm trung bình mới từ trigger
      await loadAssignmentRecords(new Set(visibleClassItems.flatMap(c => c.enrollments.map(e => e.id))));
      await loadAllTables(); 
    }
    setIsSaving(false);
  }

  async function syncCertificates(targetId?: string, targetType?: "class" | "student") {
    setIsSaving(true);
    try {
      const enrollments = targetId 
        ? (targetType === "class" || activeTable === "classes"
          ? data.enrollments.filter(e => e.class_id === targetId)
          : data.enrollments.filter(e => e.student_id === targetId))
        : data.enrollments;
      
      const classById = new Map(data.classes.map((classRow) => [String(classRow.id), classRow]));
      const createCertificateCode = (enrollment: Row, type: string) => {
        const classRow = classById.get(String(enrollment.class_id ?? ""));
        const classCode = String(classRow?.class_code ?? "EDU").trim() || "EDU";
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `${classCode}-${type.slice(0, 4).toUpperCase()}-${suffix}`;
      };

      const certificateBatch: { enrollment: Row; certificate_type: string }[] = [];
      enrollments.forEach(e => {
        const attScore = Number(e.attendance_score ?? 0);
        const projScore = Number(e.project_score ?? 0);
        const finalScore = Number(e.final_score ?? 0);
        const assignScore = Number(e.assignment_score ?? 0);
        
        if (attScore >= 4 && projScore > 0 && finalScore >= 4) {
          certificateBatch.push({ enrollment: e, certificate_type: "completion" });
        }
        if (attScore >= 2 && assignScore > 0) {
          certificateBatch.push({ enrollment: e, certificate_type: "participation" });
        }
      });

      for (const cert of certificateBatch) {
        const enrollment = cert.enrollment;
        const enrollmentId = String(enrollment.id ?? "");
        const nextType = cert.certificate_type;
        const { data: existingCertificate, error: selectError } = await supabase
          .from("certificates")
          .select("id")
          .eq("enrollment_id", enrollmentId)
          .eq("certificate_type", nextType)
          .maybeSingle();

        if (selectError) throw selectError;

        if (!existingCertificate) {
          const { error: insertError } = await supabase.from("certificates").insert({
            enrollment_id: enrollmentId,
            certificate_type: nextType,
            certificate_code: createCertificateCode(enrollment, nextType),
            status: "draft",
            issued_at: new Date().toISOString(),
          });
          if (insertError) throw insertError;
        }
      }
      setMessage("✓ Đã đồng bộ chứng chỉ.");
      await loadAllTables();
    } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
  }

  // Student Account Logic
  async function createStudentLoginAccount(input: { email: string; full_name: string; student_id?: string }) {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");
      const result = await createStudentAccount(session.access_token, input);
      if (!result.ok) throw new Error(result.error);
      setMessage(`✓ Đã cấp tài khoản. Mật khẩu: ${result.initial_password}`);
      await Promise.all([loadAllTables(), loadAdmins()]);
    } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
  }

  async function resetStudentLoginPassword(authUserId: string, email: string) {
    if (!window.confirm(`Reset mật khẩu cho "${email}"?`)) return;
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");
      const result = await resetStudentPassword(session.access_token, authUserId);
      if (!result.ok) throw new Error(result.error);
      setMessage(`✓ Đã reset mật khẩu cho ${email}. Mật khẩu mới: ${result.initial_password}`);
      await loadAdmins();
    } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
  }

  // Internal Helpers
  function normalizeImportValue(field: FieldConfig, value: any) {
    if (value == null || value === "") return null;
    if (field.type === "number") return isNaN(Number(value)) ? null : Number(value);
    if (field.type === "date") return typeof value === "number" ? String(value) : String(value).slice(0, 10);
    return String(value).trim();
  }

  async function resolveImportReferences(payload: any[]) {
    return payload.map(row => {
      if (activeTable === "classes") {
        row.course_id = data.courses.find(c => String(c.course_code).toLowerCase() === String(row.course_id).toLowerCase())?.id || row.course_id;
        row.teacher_id = data.teachers.find(t => String(t.email).toLowerCase() === String(row.teacher_id).toLowerCase())?.id || row.teacher_id;
      }
      if (activeTable === "class_sessions") {
        const rawCode = String(row.class_id ?? "").trim();
        const match = data.classes.find(c => String(c.class_code).toLowerCase() === rawCode.toLowerCase());
        if (!match) {
          throw new Error(`Không tìm thấy lớp với mã "${rawCode}". Vui lòng kiểm tra cột "class_code" trong file Excel.`);
        }
        row.class_id = match.id;
      }
      return row;
    });
  }

  async function skipDuplicateEmails(payload: any[]) {
    return { payload }; // Simplified for now
  }

  const filteredRows = useMemo(() => {
    let rows = data[activeTable];
    if (activeTable === "class_sessions" && classSessionsFilterId) {
      const existing = rows
        .filter(r => String(r.class_id) === classSessionsFilterId)
        .sort((a, b) => Number(a.session_number) - Number(b.session_number));

      const cls = data.classes.find(c => String(c.id) === classSessionsFilterId);
      const totalSessions = Number(cls?.total_sessions ?? 0);
      const maxExisting = existing.reduce((max, r) => Math.max(max, Number(r.session_number) || 0), 0);
      const slotCount = Math.max(totalSessions, maxExisting);

      if (slotCount > 0) {
        const byNumber = new Map(existing.map(r => [Number(r.session_number), r]));
        const synthesized: Row[] = [];
        for (let i = 0; i <= slotCount; i++) {
          const found = byNumber.get(i);
          synthesized.push(
            found ?? ({
              class_id: classSessionsFilterId,
              session_number: i,
              __placeholder: true,
            } as unknown as Row),
          );
        }
        rows = synthesized;
      } else {
        rows = existing;
      }
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter(r => {
      if ((r as any).__placeholder) return false;
      return activeConfig.searchFields.some(f => {
        let val = "";
        if (activeTable === "certificates" && (f === "student_name" || f === "student_email")) {
          const enrollment = data.enrollments.find(e => e.id === r.enrollment_id);
          const student = enrollment ? data.students.find(s => s.id === enrollment.student_id) : null;
          const studentValue = student ? (f === "student_name" ? student.full_name : student.email) : "";
          val = String(studentValue ?? "");
        } else {
          val = String(r[f] ?? "");
        }
        return val.toLowerCase().includes(q);
      });
    });
  }, [activeTable, data, search, classSessionsFilterId, activeConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  function getOptionLabel(field: FieldConfig, row: Row) {
    const labelKey = field.optionLabel ?? "id";
    const label = row[labelKey] ? String(row[labelKey]) : String(row.id ?? "");
    const suffix = labelKey !== "id" && row.id ? ` (${String(row.id).slice(0, 8)})` : "";
    return `${label}${suffix}`;
  }

  function getFieldValue(row: Row, column: any) {
    const val = row[column.key];

    if (activeTable === "class_sessions" && column.key === "time_range") {
      const startTime = row.start_time ? String(row.start_time).slice(0, 5) : "";
      const endTime = row.end_time ? String(row.end_time).slice(0, 5) : "";
      return startTime || endTime ? [startTime, endTime].filter(Boolean).join(" - ") : "-";
    }

    if (column.key === "score" || column.key === "project_score" || column.key === "attendance_score" || column.key === "assignment_score") {
      return val != null ? Number(val).toFixed(1) : "-";
    }
    if (column.key === "student_id") {
      const student = data.students.find(s => s.id === val);
      return student ? `${student.full_name} (${student.email})` : val;
    }
    if (column.key === "class_id") {
      const cls = data.classes.find(c => c.id === val);
      return cls ? `${cls.class_name} (${cls.class_code})` : val;
    }
    if (activeTable === "certificates" && column.key === "certificate_type") {
      if (val === "participation") return "Tham gia";
      if (val === "completion") return "Hoàn thành";
      return val;
    }

    if (activeTable === "certificates" && (column.key === "student_name" || column.key === "student_email")) {
      const enrollment = data.enrollments.find(e => e.id === row.enrollment_id);
      if (!enrollment) return "-";
      const student = data.students.find(s => s.id === enrollment.student_id);
      if (!student) return "-";
      return column.key === "student_name" ? student.full_name : student.email;
    }

    if (activeTable === "certificates" && column.key === "status") {
      return (
        <select
          className="status-select certificate-status-select"
          value={val || "draft"}
          onChange={(e) => updateCertificateStatus(String(row.enrollment_id), e.target.value)}
          disabled={updatingCertificateEnrollmentId === row.enrollment_id}
        >
          {certificateStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return formatValue(val);
  }

  function getScoreClass(score: any) {
    if (score == null) return "";
    const s = Number(score);
    if (s >= 8) return "score-high";
    if (s >= 5) return "score-mid";
    return "score-low";
  }

  function getRelationLabel(field: FieldConfig, row: Row) {
    const baseLabel = getOptionLabel(field, row);
    if (field.optionsKey === "students") return [row.full_name, row.email, row.phone].filter(Boolean).join(" · ") || baseLabel;
    if (field.optionsKey === "teachers") return [row.full_name, row.email, row.phone].filter(Boolean).join(" · ") || baseLabel;
    if (field.optionsKey === "courses") return [row.course_code, row.name, row.course_type].filter(Boolean).join(" · ") || baseLabel;
    if (field.optionsKey === "classes") return [row.class_code, row.class_name].filter(Boolean).join(" · ") || baseLabel;
    return baseLabel;
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setCurrentUserRole(null);
        setCurrentAccount(null);
        if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") router.push("/login");
        return;
      }

      const metadata = session.user.user_metadata ?? {};
      const appMetadata = session.user.app_metadata ?? {};
      const email = session.user.email ?? "";
      const rawRole = String(metadata.role || appMetadata.role || "").trim().toLowerCase();
      const isStudentRole = rawRole === "student" || Boolean(metadata.student_id);
      const isStaffRole = ["admin", "operation", "assistant", "teacher"].includes(rawRole);
      const studentByEmail = !rawRole && email
        ? await supabase.from("students").select("id").eq("email", email.toLowerCase()).maybeSingle()
        : { data: null };

      if (isStudentRole || (!isStaffRole && Boolean(studentByEmail.data?.id))) {
        setIsAuthenticated(false);
        router.push("/user");
        return;
      }

      const role = isStaffRole ? rawRole : "admin";
      // assistantAssignmentsLoaded gate cũng dùng cho teacher — vì teacher cũng
      // cần load assignedClassIds trước khi loadAllTables() filter dữ liệu.
      setAssistantAssignmentsLoaded(role !== "assistant" && role !== "teacher");
      setCurrentAccount({
        email,
        name: String(metadata.username || metadata.full_name || metadata.name || email.split("@")[0] || "Người dùng"),
        role,
      });
      setCurrentUserRole(role as UserRole);

      if (role === "assistant") {
        try {
          const ids = await getMyAssignedClassIds(session.access_token);
          setAssignedClassIds(ids);
          if (!isAssistantAllowedView(activeView)) setActiveView("classManagement");
        } catch {
          setAssignedClassIds([]);
        } finally {
          setAssistantAssignmentsLoaded(true);
        }
      } else if (role === "teacher") {
        try {
          const { data: teacherRow } = await supabase
            .from("teachers")
            .select("id")
            .ilike("email", email)
            .maybeSingle();
          if (teacherRow?.id) {
            const { data: classRows } = await supabase
              .from("classes")
              .select("id")
              .eq("teacher_id", teacherRow.id);
            setAssignedClassIds((classRows ?? []).map((row) => String(row.id)));
          } else {
            setAssignedClassIds([]);
          }
          if (!isAssistantAllowedView(activeView)) setActiveView("classManagement");
        } catch {
          setAssignedClassIds([]);
        } finally {
          setAssistantAssignmentsLoaded(true);
        }
      }

      setIsAuthenticated(true);
    });

    return () => subscription.unsubscribe();
  }, [activeView, router]);

  useEffect(() => {
    if (isAuthenticated !== true) return;
    if ((currentUserRole === "assistant" || currentUserRole === "teacher") && !assistantAssignmentsLoaded) return;
    void loadAllTables();
  }, [assistantAssignmentsLoaded, isAuthenticated, currentUserRole, assignedClassIds]);

  useEffect(() => {
    if ((isAdminsView || activeTable === "students") && isAuthenticated) void loadAdmins();
  }, [activeTable, isAdminsView, isAuthenticated]);

  useEffect(() => {
    if (isAssistantAssignmentsView && isAuthenticated) void loadAssistantAssignmentOverview();
  }, [isAssistantAssignmentsView, isAuthenticated, visibleClassItems]);

  useEffect(() => {
    if (isAssistantUser && !isAssistantAllowedView(activeView)) {
      setOpenSidebarGroup("academic");
      setActiveView("classManagement");
    }
  }, [activeView, isAssistantUser]);

  useEffect(() => {
    if (activeTable === "class_sessions" && !classSessionsFilterId && data.classes.length > 0) {
      setClassSessionsFilterId(String(data.classes[0].id));
    }
  }, [activeTable, classSessionsFilterId, data.classes]);

  useEffect(() => {
    setEditingRow(null);
    const newForm = buildEmptyForm(activeConfig.fields);
    if (activeConfig.name === "class_sessions" && classSessionsFilterId) newForm.class_id = classSessionsFilterId;
    setForm(newForm);
    setRelationQueries({});
    setOpenRelationPicker(null);
    setMessage("");
    setError("");
  }, [activeConfig, classSessionsFilterId]);

  useEffect(() => {
    if (!isDataView) return;
    if (previousDataTableRef.current && previousDataTableRef.current !== activeTable) setSearch("");
    previousDataTableRef.current = activeTable;
  }, [activeTable, isDataView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTable, classSessionsFilterId, pageSize, search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Additional Side Effects
  useEffect(() => {
    const ids = visibleClassItems.map(c => c.id);
    if ((isAttendanceView || isClassDashboardView) && !selectedAttendanceClassId && ids.length) setSelectedAttendanceClassId(ids[0]);
  }, [visibleClassItems, isAttendanceView, isClassDashboardView, selectedAttendanceClassId]);

  useEffect(() => {
    if (!isClassDashboardView && !isAttendanceView && !isAssignmentScoreView && !isProjectScoreView) return;
    if (selectedAttendanceClassId && visibleClassItems.some((item) => item.id === selectedAttendanceClassId)) return;
    setSelectedAttendanceClassId(visibleClassItems[0]?.id ?? null);
  }, [isAttendanceView, isAssignmentScoreView, isClassDashboardView, isProjectScoreView, selectedAttendanceClassId, visibleClassItems]);

  useEffect(() => {
    if (selectedAttendanceSession > attendanceSessionCount) setSelectedAttendanceSession(attendanceSessionCount);
  }, [attendanceSessionCount, selectedAttendanceSession]);
  async function createUserWrap(token: string, email: string, pass: string, username: string, role: string) {
    const res = await createUserSafe(token, email, pass, username, role as UserRole);
    if (!res.ok) throw new Error(res.error);
  }

  async function updateUserWrap(token: string, id: string, data: any) {
    const res = await updateUserSafe(token, id, data);
    if (!res.ok) throw new Error(res.error);
  }

  async function deleteUserWrap(token: string, id: string) {
    const res = await deleteUserSafe(token, id);
    if (!res.ok) throw new Error(res.error);
  }

  return {
    activeView, setActiveView, changeView,
    openSidebarGroup, setOpenSidebarGroup, toggleSidebarGroup,
    data, setData,
    attendanceRecords, setAttendanceRecords,
    attendanceError, setAttendanceError,
    assignmentRecords, setAssignmentRecords,
    assignmentError, setAssignmentError,
    form, setForm,
    editingRow, setEditingRow,
    selectedClassId, setSelectedClassId,
    selectedAttendanceClassId, setSelectedAttendanceClassId,
    selectedAttendanceSession, setSelectedAttendanceSession,
    attendanceMode, setAttendanceMode,
    relationQueries, setRelationQueries,
    openRelationPicker, setOpenRelationPicker,
    updatingEnrollmentId, setUpdatingEnrollmentId,
    updatingCertificateEnrollmentId, setUpdatingCertificateEnrollmentId,
    classStatusFilter, setClassStatusFilter,
    classDetailSortField, setClassDetailSortField,
    classDetailSortDir, setClassDetailSortDir,
    classSessionsFilterId, setClassSessionsFilterId,
    assistantAssignmentSearch, setAssistantAssignmentSearch,
    assistantAssignmentsByClass, setAssistantAssignmentsByClass,
    search, setSearch,
    pageSize, setPageSize,
    currentPage, setCurrentPage,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    message, setMessage,
    error, setError,
    isAuthenticated, setIsAuthenticated,
    selectedSessionDetail, setSelectedSessionDetail,
    fileInputRef,
    activeTable,
    adminUsers, setAdminUsers,
    adminForm, setAdminForm,
    currentUserRole, setCurrentUserRole,
    currentAccount, setCurrentAccount,
    accountTab, setAccountTab,
    classDashboardMode, setClassDashboardMode,
    segmentCriteria, setSegmentCriteria,
    selectedStudentForDetail, setSelectedStudentForDetail,
    assignedClassIds, setAssignedClassIds,
    classAssistants, setClassAssistants,
    showAssignModal, setShowAssignModal,
    showCertGuide, setShowCertGuide,
    showAttendanceGuide, setShowAttendanceGuide,
    activeConfig,
    visibleClassItems,
    stats,
    analytics,
    selectedClass,
    selectedAttendanceClass,
    attendanceSessionCount,
    classDashboardMetrics,
    selectedClassEnrollments,
    assistantAssignmentClassItems,
    assistantUserByProfileId,
    assignedAssistantTotal,
    loadAdmins,
    loadAllTables,
    loadClassAssistants,
    assignAssistantToClass,
    removeAssistantFromClass,
    loadAssistantAssignmentOverview,
    isAssistantUser,
    isAdminView,
    router,
    updateFormValue,
    saveRow,
    deleteRow,
    startEdit,
    startEditClass,
    resetForm,
    importExcel,
    downloadTemplate,
    exportData,
    updateEnrollmentStatus,
    updateCertificateStatus,
    updateAttendance,
    updateProjectScore,
    updateProjectLink,
    updateAssignmentScore,
    syncCertificates,
    createStudentLoginAccount,
    resetStudentLoginPassword,
    totalPages,
    paginatedRows,
    filteredRows,
    getOptionLabel,
    getFieldValue,
    getScoreClass,
    getRelationLabel,
    genPassword,
    createUser: createUserWrap,
    updateUser: updateUserWrap,
    deleteUser: deleteUserWrap,
    supabase,
    isDataView,
    isClassDetailView,
    isAssistantAssignmentsView,
    pageEyebrow,
    pageTitle,
    pageDescription,
    roleLabels,
    onLogout,
    formatValue,
    formatLabel,
    tableConfigs,
    certificateStatusOptions,
    attendanceRecordsByEnrollment,
    assignmentRecordsByEnrollment,
  };
}
