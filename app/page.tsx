"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  getUsersSafe,
  createStudentAccount,
  createUser,
  deleteUser,
  resetStudentPassword,
  updateUser,
  type UserRole,
} from "@/app/actions/users";
import {
  assignAssistantSafe,
  getClassAssistantsSafe,
  getMyAssignedClassIds,
  removeAssistantSafe,
} from "@/app/actions/assistants";
import { bulkImportAction } from "@/app/actions/import";

type FieldType = "text" | "email" | "number" | "date" | "time" | "datetime-local" | "textarea" | "select";

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  exampleValue?: string;
  importKey?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  optionsKey?: TableName;
  optionLabel?: string;
};

type TableName =
  | "students"
  | "teachers"
  | "courses"
  | "classes"
  | "enrollments"
  | "certificates"
  | "class_sessions";
type ViewName =
  | "dashboard"
  | "classManagement"
  | "classDetail"
  | "assistantAssignments"
  | "attendance"
  | "assignmentScore"
  | "projectScore"
  | "admins"
  | TableName;
type SidebarGroup = "overview" | "academic" | "coreData" | "extendedData" | "system" | null;

type TableConfig = {
  name: TableName;
  label: string;
  description: string;
  fields: FieldConfig[];
  columns: string[];
  searchFields: string[];
};

type Row = Record<string, string | number | null>;
type DataState = Record<TableName, Row[]>;
type FormState = Record<string, string>;
type AttendanceRecord = Row;
type AssignmentRecord = Row;
type ClassAssistant = {
  assistant_id: string;
  assigned_at?: string | null;
  assigned_by?: string | null;
  class_id: string;
  created_at?: string | null;
  id?: string;
  note?: string | null;
  status?: string | null;
  updated_at?: string | null;
};
type ChartItem = {
  color: string;
  id: string;
  label: string;
  percent: number;
  value: number;
};

const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";
const storageKeys = {
  classId: "dua-edu-admin-class-id",
  search: "dua-edu-admin-search",
  scrollY: "dua-edu-admin-scroll-y",
  view: "dua-edu-admin-view",
  session: "dua-edu-admin-session",
  attendanceMode: "dua-edu-admin-attendance-mode",
};
const courseTypeOptions = [
  { label: "Offline", value: "offline" },
  { label: "Online", value: "online" },
  { label: "E-learning", value: "elearning" },
  { label: "Tự học", value: "self_study" },
];
const enrollmentStatusOptions = [
  { label: "Đang học", value: "active" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Bỏ học", value: "dropped" },
  { label: "Bảo lưu", value: "reserved" },
  { label: "Đã huỷ", value: "cancelled" },
];
const attendanceStatusOptions = [
  { label: "Có mặt", value: "present" },
  { label: "Vắng", value: "absent" },
  { label: "Đi muộn", value: "late" },
  { label: "Có phép", value: "excused" },
];
const chartColors = ["#059669", "#22c55e", "#14b8a6", "#84cc16", "#0f766e", "#65a30d"];
const pageSizeOptions = [20, 50, 100];

const tableConfigs: TableConfig[] = [
  {
    name: "students",
    label: "Học viên",
    description: "Quản lý thông tin học viên và liên hệ.",
    columns: ["full_name", "email", "phone", "note", "created_at"],
    searchFields: ["full_name", "email", "phone"],
    fields: [
      { name: "full_name", label: "Họ tên", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "teachers",
    label: "Giảng viên",
    description: "Theo dõi hồ sơ, liên hệ và kinh nghiệm giảng viên.",
    columns: ["full_name", "email", "phone", "linkedin_url", "current_job", "created_at"],
    searchFields: ["full_name", "email", "phone", "linkedin_url", "current_job"],
    fields: [
      { name: "full_name", label: "Họ tên", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
      { name: "linkedin_url", label: "LinkedIn", type: "text" },
      { name: "avatar_url", label: "Avatar URL", type: "text" },
      { name: "current_job", label: "Công việc hiện tại", type: "text" },
      { name: "previous_job", label: "Công việc trước đây", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "courses",
    label: "Khoá học",
    description: "Quản lý chương trình học và phân loại khoá.",
    columns: ["name", "course_code", "course_type", "note", "created_at"],
    searchFields: ["name", "course_code", "course_type"],
    fields: [
      { name: "name", label: "Tên khoá học", type: "text", required: true },
      { name: "course_code", label: "Mã viết tắt", type: "text" },
      {
        name: "course_type",
        label: "Loại khoá",
        type: "select",
        required: true,
        options: courseTypeOptions,
      },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "classes",
    label: "Lớp học",
    description: "Gán lớp với khoá học và giảng viên phụ trách.",
    columns: [
      "class_name",
      "class_code",
      "course_id",
      "teacher_id",
      "start_date",
      "total_sessions",
      "schedule",
      "study_time",
      "total_assignments",
    ],
    searchFields: ["class_name", "class_code", "schedule", "study_time"],
    fields: [
      {
        name: "course_id",
        label: "Khoá học",
        type: "select",
        importKey: "course_code",
        exampleValue: "REACT",
        required: true,
        optionsKey: "courses",
        optionLabel: "name",
      },
      {
        name: "teacher_id",
        label: "Giảng viên",
        type: "select",
        importKey: "teacher_email",
        exampleValue: "teacher@dua-edu.com",
        required: true,
        optionsKey: "teachers",
        optionLabel: "full_name",
      },
      { name: "class_name", label: "Tên lớp", type: "text", required: true },
      { name: "class_code", label: "Mã lớp", type: "text" },
      { name: "start_date", label: "Ngày bắt đầu", type: "date" },
      { name: "total_sessions", label: "Số buổi học", type: "number" },
      { name: "total_assignments", label: "Số bài tập", type: "number" },
      { name: "schedule", label: "Lịch học", type: "text", exampleValue: "Thứ 2, 4, 6" },
      { name: "study_time", label: "Thời gian học", type: "text", exampleValue: "19:30 - 21:30" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "enrollments",
    label: "Ghi danh",
    description: "Quản lý học viên ghi danh vào từng lớp.",
    columns: ["student_id", "class_id", "status", "attendance_score", "note", "created_at"],
    searchFields: ["note"],
    fields: [
      {
        name: "student_id",
        label: "Học viên",
        type: "select",
        importKey: "student_email",
        exampleValue: "student@dua-edu.com",
        required: true,
        optionsKey: "students",
        optionLabel: "full_name",
      },
      {
        name: "class_id",
        label: "Lớp học",
        type: "select",
        importKey: "class_code",
        exampleValue: "REACT-K01",
        required: true,
        optionsKey: "classes",
        optionLabel: "class_name",
      },
      {
        name: "status",
        label: "Trạng thái",
        type: "select",
        required: true,
        options: enrollmentStatusOptions,
      },
      { name: "attendance_score", label: "Điểm chuyên cần", type: "number" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "certificates",
    label: "Chứng chỉ",
    description: "Phát hành và theo dõi chứng chỉ sau khoá học.",
    columns: ["enrollment_id", "certificate_type", "certificate_code", "status", "issued_at"],
    searchFields: ["certificate_type", "certificate_code", "status"],
    fields: [
      {
        name: "enrollment_id",
        label: "Ghi danh",
        type: "select",
        importKey: "enrollment_key",
        exampleValue: "student@dua-edu.com|REACT-K01",
        required: true,
        optionsKey: "enrollments",
        optionLabel: "id",
      },
      { name: "certificate_type", label: "Loại chứng chỉ", type: "text", required: true },
      { name: "certificate_code", label: "Mã chứng chỉ", type: "text", required: true },
      { name: "certificate_url", label: "Certificate URL", type: "text" },
      { name: "status", label: "Trạng thái", type: "text", required: true },
      { name: "issued_at", label: "Ngày cấp", type: "datetime-local" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "class_sessions",
    label: "Quản lý buổi học",
    description: "Quản lý các buổi học, lịch học, link video của từng buổi.",
    columns: ["session_number", "session_title", "session_date", "time_range"],
    searchFields: ["session_title", "meeting_url", "recording_url", "note"],
    fields: [
      {
        name: "class_id",
        label: "Lớp học",
        type: "select",
        importKey: "class_code",
        exampleValue: "REACT-K01",
        required: true,
        optionsKey: "classes",
        optionLabel: "class_name",
      },
      { name: "session_number", label: "Buổi số", type: "number", required: true },
      { name: "session_title", label: "Tiêu đề buổi học", type: "text", required: true },
      { name: "session_date", label: "Ngày học", type: "date" },
      { name: "start_time", label: "Giờ bắt đầu", type: "time" },
      { name: "end_time", label: "Giờ kết thúc", type: "time" },
      { name: "meeting_url", label: "Link học online (Meeting URL)", type: "text" },
      { name: "recording_url", label: "Link video xem lại (Recording URL)", type: "text" },
      { name: "slide_url", label: "Link slide bài giảng", type: "text" },
      { name: "reference_url", label: "Link tài liệu tham khảo", type: "text" },
      { name: "assignment_url", label: "Link bài tập", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
];

const emptyData: DataState = {
  students: [],
  teachers: [],
  courses: [],
  classes: [],
  enrollments: [],
  certificates: [],
  class_sessions: [],
};

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatValue = (value: Row[string]) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string" && value.includes("T") && value.endsWith("Z")) {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return String(value);
};

const buildEmptyForm = (fields: FieldConfig[]) =>
  fields.reduce<FormState>((form, field) => {
    form[field.name] = "";
    return form;
  }, {});

const toInputValue = (field: FieldConfig, value: Row[string]) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (field.type === "datetime-local" && typeof value === "string") {
    return value.slice(0, 16);
  }

  return String(value);
};

const getImportColumnName = (field: FieldConfig) => field.importKey ?? field.name;

const isTableName = (value: string | null): value is TableName =>
  tableConfigs.some((config) => config.name === value);

const isViewName = (value: string | null): value is ViewName =>
  value === "dashboard" ||
  value === "classManagement" ||
  value === "classDetail" ||
  value === "assistantAssignments" ||
  value === "attendance" ||
  value === "assignmentScore" ||
  value === "projectScore" ||
  value === "admins" ||
  isTableName(value);

const getInitialView = () => {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const viewFromUrl =
    new URLSearchParams(window.location.search).get("view") ??
    new URLSearchParams(window.location.search).get("table");
  if (isViewName(viewFromUrl)) {
    return viewFromUrl;
  }

  const viewFromStorage = window.localStorage.getItem(storageKeys.view);
  return isViewName(viewFromStorage) ? viewFromStorage : "dashboard";
};

const getInitialSearch = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const searchFromUrl = new URLSearchParams(window.location.search).get("q");
  return searchFromUrl ?? "";
};

const getInitialClassId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    new URLSearchParams(window.location.search).get("classId") ??
    window.localStorage.getItem(storageKeys.classId)
  );
};

const getInitialSession = () => {
  if (typeof window === "undefined") {
    return 1;
  }
  const val = Number(new URLSearchParams(window.location.search).get("session") ?? window.localStorage.getItem(storageKeys.session));
  return Number.isFinite(val) && val > 0 ? val : 1;
};

const getInitialAttendanceMode = (): "session" | "summary" => {
  if (typeof window === "undefined") {
    return "session";
  }
  const val = new URLSearchParams(window.location.search).get("mode") ?? window.localStorage.getItem(storageKeys.attendanceMode);
  return val === "summary" ? "summary" : "session";
};

const getSidebarGroupForView = (view: ViewName): SidebarGroup => {
  if (view === "dashboard") return "overview";
  if (
    view === "classManagement" || view === "classDetail" || view === "assistantAssignments" || view === "attendance" ||
    view === "assignmentScore" || view === "projectScore" || view === "class_sessions"
  ) return "academic";
  if (view === "courses" || view === "classes" || view === "teachers" || view === "students") return "coreData";
  if (view === "enrollments" || view === "certificates") return "extendedData";
  return "system";
};
const isAssistantAllowedView = (view: ViewName) =>
  view === "classManagement" ||
  view === "classDetail" ||
  view === "attendance" ||
  view === "assignmentScore" ||
  view === "projectScore" ||
  view === "students" ||
  view === "class_sessions";

export default function Home() {
  const [activeView, setActiveView] = useState<ViewName>(getInitialView);
  const [openSidebarGroup, setOpenSidebarGroup] = useState<SidebarGroup>(() =>
    getSidebarGroupForView(getInitialView())
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
  const [showReturningDetails, setShowReturningDetails] = useState(false);
  const [relationQueries, setRelationQueries] = useState<Record<string, string>>({});
  const [openRelationPicker, setOpenRelationPicker] = useState<string | null>(null);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(null);
  const [classStatusFilter, setClassStatusFilter] = useState("all");
  const [classDetailSortField, setClassDetailSortField] = useState<string>("name");
  const [classDetailSortDir, setClassDetailSortDir] = useState<"asc" | "desc">("asc");
  const [classSessionsFilterId, setClassSessionsFilterId] = useState<string | null>(getInitialClassId);
  const [classManagementSearch, setClassManagementSearch] = useState("");
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
  const isDashboardView = activeView === "dashboard";
  const isClassManagementView = activeView === "classManagement";
  const isClassDetailView = activeView === "classDetail";
  const isAssistantAssignmentsView = activeView === "assistantAssignments";
  const isAttendanceView = activeView === "attendance";
  const isAssignmentScoreView = activeView === "assignmentScore";
  const isProjectScoreView = activeView === "projectScore";
  const isAdminsView = activeView === "admins";
  const isDataView = isTableName(activeView);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", username: "", role: "admin" as UserRole, id: "" });
  const [studentAccountForm, setStudentAccountForm] = useState({ email: "", full_name: "" });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const isAssistantUser = currentUserRole === "assistant";
  const isFullAdmin = currentUserRole === "admin" || currentUserRole === "operation";
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [classAssistants, setClassAssistants] = useState<ClassAssistant[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // classId
  const loadIdRef = useRef(0);

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const result = await getUsersSafe(session.access_token);
      setAdminUsers(result.users);
      if (!result.ok) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách quản trị viên. Vui lòng thêm SUPABASE_SERVICE_ROLE_KEY vào .env.local.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((isAdminsView || activeTable === "students") && isAuthenticated) {
      void loadAdmins();
    }
  }, [activeTable, isAdminsView, isAuthenticated]);

  const activeConfig = useMemo(
    () => tableConfigs.find((config) => config.name === activeTable) ?? tableConfigs[0],
    [activeTable],
  );

  const changeView = (view: ViewName) => {
    if (isAssistantUser && !isAssistantAllowedView(view)) {
      setOpenSidebarGroup("academic");
      setActiveView("classManagement");
      return;
    }

    setOpenSidebarGroup(isAssistantUser && view === "students" ? "academic" : getSidebarGroupForView(view));
    setActiveView(view);
  };

  const toggleSidebarGroup = (group: SidebarGroup) => {
    setOpenSidebarGroup((current) => (current === group ? null : group));
  };

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

      if (!studentId) {
        return;
      }

      if (classId) {
        classEnrollments.set(classId, (classEnrollments.get(classId) ?? 0) + 1);
        if (!classEnrollmentRows.has(classId)) {
          classEnrollmentRows.set(classId, []);
        }
        classEnrollmentRows.get(classId)?.push(enrollment);

        if (!studentClasses.has(studentId)) {
          studentClasses.set(studentId, new Set());
        }
        studentClasses.get(studentId)?.add(classId);
      }

      if (courseId) {
        courseEnrollments.set(courseId, (courseEnrollments.get(courseId) ?? 0) + 1);
      }

      if (teacherId) {
        teacherEnrollments.set(teacherId, (teacherEnrollments.get(teacherId) ?? 0) + 1);
      }

      if (!studentEnrollmentRows.has(studentId)) {
        studentEnrollmentRows.set(studentId, []);
      }
      studentEnrollmentRows.get(studentId)?.push(enrollment);
    });

    const buildItems = (
      source: Map<string, number>,
      labels: Map<string, Row>,
      labelKey: string,
      codeKey?: string,
    ) => {
      const total = Array.from(source.values()).reduce((sum, value) => sum + value, 0);

      return Array.from(source.entries())
        .map(([id, value], index) => {
          const row = labels.get(id);
          const code = codeKey && row?.[codeKey] ? `${String(row[codeKey])} - ` : "";
          const label = row?.[labelKey] ? `${code}${String(row[labelKey])}` : id.slice(0, 8);

          return {
            color: chartColors[index % chartColors.length],
            id,
            label,
            percent: total ? Math.round((value / total) * 1000) / 10 : 0,
            value,
          };
        })
        .sort((a, b) => b.value - a.value);
    };

    const courseItems = buildItems(courseEnrollments, courseById, "name", "course_code");
    const teacherItems = buildItems(teacherEnrollments, teacherById, "full_name");
    const classItems = data.classes
      .map((classRow) => {
        const classId = String(classRow.id ?? "");
        const course = classRow.course_id ? courseById.get(String(classRow.course_id)) : undefined;
        const teacher = classRow.teacher_id ? teacherById.get(String(classRow.teacher_id)) : undefined;

        return {
          classCode: String(classRow.class_code ?? "-"),
          className: String(classRow.class_name ?? classId.slice(0, 8)),
          courseName: String(course?.name ?? "-"),
          enrollmentCount: classEnrollments.get(classId) ?? 0,
          enrollments: (classEnrollmentRows.get(classId) ?? []).map((enrollment) => {
            const student = enrollment.student_id
              ? studentById.get(String(enrollment.student_id))
              : undefined;

            return {
              attendanceScore: enrollment.attendance_score ? Number(enrollment.attendance_score) : null,
              assignmentScore: enrollment.assignment_score ? Number(enrollment.assignment_score) : null,
              projectScore: enrollment.project_score ? Number(enrollment.project_score) : null,
              finalScore: enrollment.final_score ? Number(enrollment.final_score) : null,
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
          schedule: String(classRow.schedule ?? "-"),
          startDate: classRow.start_date ? String(classRow.start_date) : "-",
          studyTime: String(classRow.study_time ?? "-"),
          teacherName: String(teacher?.full_name ?? "-"),
          totalSessions: classRow.total_sessions ? String(classRow.total_sessions) : "-",
          totalAssignments: classRow.total_assignments ? String(classRow.total_assignments) : "-",
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    const returningStudentItems = Array.from(studentClasses.entries())
      .filter(([, classes]) => classes.size >= 2)
      .map(([studentId, classes]) => {
        const student = studentById.get(studentId);
        const classNames = Array.from(classes).map((classId) => {
          const classRow = classById.get(classId);
          return classRow?.class_name ? String(classRow.class_name) : classId.slice(0, 8);
        });

        return {
          classCount: classes.size,
          classNames,
          email: String(student?.email ?? "-"),
          id: studentId,
          name: String(student?.full_name ?? studentId.slice(0, 8)),
          phone: String(student?.phone ?? "-"),
          totalEnrollments: studentEnrollmentRows.get(studentId)?.length ?? 0,
        };
      })
      .sort((a, b) => b.classCount - a.classCount || a.name.localeCompare(b.name));
    const returningStudents = returningStudentItems.length;
    const returnRate = data.students.length
      ? Math.round((returningStudents / data.students.length) * 1000) / 10
      : 0;

    return {
      classItems,
      courseItems,
      returnRate,
      returningStudentItems,
      returningStudents,
      teacherItems,
    };
  }, [data]);

  // If current user is assistant, filter to only their assigned classes
  const visibleClassItems = useMemo(() => {
    if (currentUserRole === "assistant" && assignedClassIds.length > 0) {
      return analytics.classItems.filter(item => assignedClassIds.includes(item.id));
    }
    if (currentUserRole === "assistant" && assignedClassIds.length === 0) {
      return [];
    }
    return analytics.classItems;
  }, [analytics.classItems, currentUserRole, assignedClassIds]);

  const loadAssistantAssignmentOverview = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const usersResult = await getUsersSafe(session.access_token);
      setAdminUsers(usersResult.users);
      if (!usersResult.ok) {
        setError(usersResult.error);
      }

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
  };

  useEffect(() => {
    if (isAssistantAssignmentsView && isAuthenticated) {
      void loadAssistantAssignmentOverview();
    }
  }, [isAssistantAssignmentsView, isAuthenticated, visibleClassItems]);

  const assistantUserByProfileId = useMemo(() => {
    return new Map(
      adminUsers.map((user) => [String(user.profile_id ?? user.id), user]),
    );
  }, [adminUsers]);

  const studentAccountByEmail = useMemo(() => {
    return new Map(
      adminUsers
        .filter((user) => user.role === "student" && user.email)
        .map((user) => [String(user.email).toLowerCase(), user]),
    );
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
    return Number.isFinite(totalSessions) && totalSessions > 0 ? Math.floor(totalSessions) : 1;
  }, [selectedAttendanceClass]);

  const attendanceRecordsByEnrollment = useMemo(() => {
    const records = new Map<string, AttendanceRecord>();
    const enrollmentIds = new Set(
      selectedAttendanceClass?.enrollments.map((enrollment) => enrollment.id) ?? [],
    );

    attendanceRecords
      .filter(
        (record) =>
          enrollmentIds.has(String(record.enrollment_id ?? "")) &&
          Number(record.session_number ?? 0) === selectedAttendanceSession,
      )
      .forEach((record) => {
        records.set(String(record.enrollment_id ?? ""), record);
      });

    return records;
  }, [attendanceRecords, selectedAttendanceClass, selectedAttendanceSession]);

  const assignmentNumberCount = useMemo(() => {
    const totalAssignments = Number(selectedAttendanceClass?.totalAssignments ?? 0);
    return Number.isFinite(totalAssignments) && totalAssignments > 0 ? Math.floor(totalAssignments) : 1;
  }, [selectedAttendanceClass]);

  const assignmentRecordsByEnrollment = useMemo(() => {
    const records = new Map<string, Map<number, AssignmentRecord>>();
    const enrollmentIds = new Set(
      selectedAttendanceClass?.enrollments.map((enrollment) => enrollment.id) ?? [],
    );

    assignmentRecords
      .filter((record) => enrollmentIds.has(String(record.enrollment_id ?? "")))
      .forEach((record) => {
        const enrollmentId = String(record.enrollment_id ?? "");
        const assignmentNumber = Number(record.assignment_number ?? 0);
        
        if (!records.has(enrollmentId)) {
          records.set(enrollmentId, new Map());
        }
        records.get(enrollmentId)!.set(assignmentNumber, record);
      });

    return records;
  }, [assignmentRecords, selectedAttendanceClass]);

  const selectedClassStatusOptions = useMemo(() => {
    const customStatuses =
      selectedClass?.enrollments
        .map((enrollment) => enrollment.status)
        .filter(
          (status) =>
            status &&
            !enrollmentStatusOptions.some((option) => option.value === status),
        ) ?? [];
    const uniqueCustomStatuses = Array.from(new Set(customStatuses));

    return [
      { label: "Tất cả trạng thái", value: "all" },
      ...enrollmentStatusOptions,
      ...uniqueCustomStatuses.map((status) => ({ label: status, value: status })),
      { label: "Chưa có trạng thái", value: "__empty" },
    ];
  }, [selectedClass]);

  const selectedClassEnrollments = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    let filtered = selectedClass.enrollments;

    if (classStatusFilter !== "all") {
      if (classStatusFilter === "__empty") {
        filtered = filtered.filter((enrollment) => !enrollment.status);
      } else {
        filtered = filtered.filter((enrollment) => enrollment.status === classStatusFilter);
      }
    }

    return filtered.slice().sort((a, b) => {
      let aVal: any = a[classDetailSortField as keyof typeof a];
      let bVal: any = b[classDetailSortField as keyof typeof b];
      
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return classDetailSortDir === "asc" ? comparison : -comparison;
    });
  }, [classStatusFilter, selectedClass, classDetailSortField, classDetailSortDir]);

  const handleClassDetailSort = (field: string) => {
    if (classDetailSortField === field) {
      setClassDetailSortDir(classDetailSortDir === "asc" ? "desc" : "asc");
    } else {
      setClassDetailSortField(field);
      setClassDetailSortDir("asc");
    }
  };

  const renderClassDetailSortIcon = (field: string) => {
    if (classDetailSortField !== field) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
    return <span style={{ marginLeft: "4px" }}>{classDetailSortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const filteredRows = useMemo(() => {
    let rows = data[activeTable];
    
    if (activeTable === "class_sessions" && classSessionsFilterId) {
      rows = rows.filter(row => String(row.class_id) === classSessionsFilterId)
                 .sort((a, b) => Number(a.session_number) - Number(b.session_number));
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      activeConfig.searchFields.some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [activeConfig.searchFields, activeTable, data, search, classSessionsFilterId]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows, pageSize]);
  const paginationStart = filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0;
  const paginationEnd = Math.min(currentPage * pageSize, filteredRows.length);

  useEffect(() => {
    if (!isDataView) {
      return;
    }

    if (previousDataTableRef.current && previousDataTableRef.current !== activeTable) {
      setSearch("");
    }

    previousDataTableRef.current = activeTable;
  }, [activeTable, isDataView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTable, classSessionsFilterId, pageSize, search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setCurrentUserRole(null);
        if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
          router.push("/login");
        }
        return;
      }

      const role = session.user.user_metadata?.role?.trim() || "student";
      setCurrentUserRole(role);

      if (role === "assistant") {
        try {
          const ids = await getMyAssignedClassIds(session.access_token);
          setAssignedClassIds(ids);
          if (!isAssistantAllowedView(activeView)) {
            setActiveView("classManagement");
          }
        } catch (e) {
          console.error("Failed to load assistant data:", e);
          setAssignedClassIds([]);
        }
      }

      setIsAuthenticated(true);
    });

    return () => subscription.unsubscribe();
  }, [activeView, router]);

  useEffect(() => {
    if (isAuthenticated !== true) return;
    // If assistant, wait for assigned IDs before first load
    if (isAssistantUser && assignedClassIds.length === 0) {
      // Still load if we want to show empty state, but usually we wait for the fetch
      // But if they actually have 0 classes, we'll wait forever? 
      // Actually, the auth effect sets it to [] even if 0.
      // So we just need to ensure loadAllTables is robust.
    }
    void loadAllTables();
  }, [isAuthenticated, isAssistantUser, assignedClassIds]);

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

    if (
      activeTable === "class_sessions" &&
      classSessionsFilterId &&
      !data.classes.some((classRow) => String(classRow.id) === classSessionsFilterId)
    ) {
      setClassSessionsFilterId(data.classes[0]?.id ? String(data.classes[0].id) : null);
    }
  }, [activeTable, classSessionsFilterId, data.classes]);

  useEffect(() => {
    setEditingRow(null);
    const newForm = buildEmptyForm(activeConfig.fields);
    if (activeConfig.name === "class_sessions" && classSessionsFilterId) {
      newForm.class_id = classSessionsFilterId;
    }
    setForm(newForm);
    setRelationQueries({});
    setOpenRelationPicker(null);
    setMessage("");
    setError("");
  }, [activeConfig, classSessionsFilterId]);

  useEffect(() => {
    if (!isClassManagementView && !isClassDetailView && !isAttendanceView && !isProjectScoreView && !isAssignmentScoreView) {
      setSelectedClassId(null);
      setClassStatusFilter("all");
      window.localStorage.removeItem(storageKeys.classId);
    }

    if (!isDashboardView) {
      setShowReturningDetails(false);
    }
  }, [isAttendanceView, isClassManagementView, isClassDetailView, isDashboardView, isProjectScoreView, isAssignmentScoreView]);

  useEffect(() => {
    if (!isAttendanceView || selectedAttendanceClassId || !visibleClassItems.length) {
      return;
    }

    setSelectedAttendanceClassId(visibleClassItems[0].id);
  }, [visibleClassItems, isAttendanceView, selectedAttendanceClassId]);

  useEffect(() => {
    if (!isAttendanceView && !isAssignmentScoreView && !isProjectScoreView) {
      return;
    }

    if (selectedAttendanceClassId && visibleClassItems.some((item) => item.id === selectedAttendanceClassId)) {
      return;
    }

    setSelectedAttendanceClassId(visibleClassItems[0]?.id ?? null);
  }, [isAttendanceView, isAssignmentScoreView, isProjectScoreView, selectedAttendanceClassId, visibleClassItems]);

  useEffect(() => {
    if (selectedAttendanceSession <= attendanceSessionCount) {
      return;
    }

    setSelectedAttendanceSession(attendanceSessionCount);
  }, [attendanceSessionCount, selectedAttendanceSession]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.view, activeView);
    window.localStorage.setItem(storageKeys.search, search);

    const url = new URL(window.location.href);
    url.searchParams.set("view", activeView);
    url.searchParams.delete("table");

    const urlClassId = isAttendanceView || isProjectScoreView || isAssignmentScoreView ? selectedAttendanceClassId : selectedClassId;

    if ((isClassDetailView || isAttendanceView || isProjectScoreView || isAssignmentScoreView) && urlClassId) {
      url.searchParams.set("classId", urlClassId);
      window.localStorage.setItem(storageKeys.classId, urlClassId);
    } else {
      url.searchParams.delete("classId");
    }

    if (isAttendanceView) {
      url.searchParams.set("session", String(selectedAttendanceSession));
      url.searchParams.set("mode", attendanceMode);
      window.localStorage.setItem(storageKeys.session, String(selectedAttendanceSession));
      window.localStorage.setItem(storageKeys.attendanceMode, attendanceMode);
    } else {
      url.searchParams.delete("session");
      url.searchParams.delete("mode");
    }

    if (isDataView && search.trim()) {
      url.searchParams.set("q", search.trim());
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState(null, "", url);
  }, [
    activeView,
    isAttendanceView,
    isProjectScoreView,
    isAssignmentScoreView,
    isClassDetailView,
    isDataView,
    search,
    selectedAttendanceClassId,
    selectedClassId,
    selectedAttendanceSession,
    attendanceMode,
  ]);

  useEffect(() => {
    const scrollY = Number(window.localStorage.getItem(storageKeys.scrollY) ?? "0");

    if (scrollY > 0) {
      window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }

    const saveScrollPosition = () => {
      window.localStorage.setItem(storageKeys.scrollY, String(window.scrollY));
    };

    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("beforeunload", saveScrollPosition);

    return () => {
      saveScrollPosition();
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, []);

  async function loadAllTables() {
    const currentLoadId = ++loadIdRef.current;
    setIsLoading(true);
    setError("");

    const results = await Promise.all(
      tableConfigs.map(async (config) => {
        const { data: rows, error: tableError } = await supabase
          .from(config.name)
          .select("*")
          .order("created_at", { ascending: false });

        return {
          error: tableError ? `${config.label}: ${tableError.message}` : "",
          name: config.name,
          rows: (rows ?? []) as Row[],
        };
      }),
    );

    const nextData: DataState = { ...emptyData };
    const loadErrors = results
      .filter((result) => result.error)
      .map((result) => result.error);

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

    if (loadErrors.length) {
      setError(`Không tải được một số bảng: ${loadErrors.join("; ")}`);
    }

    await loadAttendanceRecords(assistantEnrollmentIds);
    await loadAssignmentRecords(assistantEnrollmentIds);

    if (currentLoadId === loadIdRef.current) {
      setIsLoading(false);
    }
  }

  async function loadAttendanceRecords(allowedEnrollmentIds?: Set<string> | null) {
    setAttendanceError("");

    const { data: rows, error: tableError } = await supabase
      .from("attendance_records")
      .select("*")
      .order("session_number", { ascending: true });

    if (tableError) {
      setAttendanceRecords([]);
      setAttendanceError(
        "Chưa tìm thấy bảng attendance_records. Hãy chạy migration Supabase mới để dùng tính năng điểm danh.",
      );
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
      setAssignmentError(
        "Chưa tìm thấy bảng assignment_records. Hãy chạy migration Supabase mới để dùng tính năng điểm bài tập.",
      );
      return;
    }

    setAssignmentRecords(
      allowedEnrollmentIds
        ? (rows ?? []).filter((row) => allowedEnrollmentIds.has(String(row.enrollment_id ?? "")))
        : rows ?? [],
    );
  }

  function getAssistantAllowedEnrollmentIds() {
    if (!isAssistantUser) {
      return null;
    }

    return new Set(data.enrollments.map((row) => String(row.id ?? "")));
  }

  function updateFormValue(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function getOptionLabel(field: FieldConfig, row: Row) {
    const labelKey = field.optionLabel ?? "id";
    const label = row[labelKey] ? String(row[labelKey]) : String(row.id ?? "");
    const suffix = labelKey !== "id" && row.id ? ` (${String(row.id).slice(0, 8)})` : "";
    return `${label}${suffix}`;
  }

  function getRelationLabel(field: FieldConfig, row: Row) {
    const baseLabel = getOptionLabel(field, row);

    if (field.optionsKey === "students") {
      return [row.full_name, row.email, row.phone].filter(Boolean).join(" · ") || baseLabel;
    }

    if (field.optionsKey === "teachers") {
      return [row.full_name, row.email, row.phone].filter(Boolean).join(" · ") || baseLabel;
    }

    if (field.optionsKey === "courses") {
      return [row.course_code, row.name, row.course_type].filter(Boolean).join(" · ") || baseLabel;
    }

    if (field.optionsKey === "classes") {
      return [row.class_code, row.class_name].filter(Boolean).join(" · ") || baseLabel;
    }

    if (field.optionsKey === "enrollments") {
      const student = data.students.find((studentRow) => studentRow.id === row.student_id);
      const classRow = data.classes.find((item) => item.id === row.class_id);
      const studentLabel = [student?.email, student?.full_name].filter(Boolean).join(" · ");
      const classLabel = [classRow?.class_code, classRow?.class_name].filter(Boolean).join(" · ");
      return [studentLabel, classLabel].filter(Boolean).join(" | ") || baseLabel;
    }

    return baseLabel;
  }

  function getRelationPickerKey(field: FieldConfig) {
    return `${activeTable}.${field.name}`;
  }

  function getSelectedRelation(field: FieldConfig) {
    if (!field.optionsKey) {
      return null;
    }

    const selectedId = form[field.name];
    return data[field.optionsKey].find((row) => String(row.id) === selectedId) ?? null;
  }

  function resolveReference(column: string, value: Row[string]) {
    if (!value || typeof value !== "string") {
      return formatValue(value);
    }

    const relationMap: Record<string, { table: TableName; label: string }> = {
      student_id: { table: "students", label: "full_name" },
      teacher_id: { table: "teachers", label: "full_name" },
      course_id: { table: "courses", label: "name" },
      class_id: { table: "classes", label: "class_name" },
      enrollment_id: { table: "enrollments", label: "id" },
    };

    const relation = relationMap[column];
    if (!relation) {
      return formatValue(value);
    }

    const match = data[relation.table].find((row) => row.id === value);
    if (!match) {
      return value.slice(0, 8);
    }

    return relation.label === "id"
      ? String(match.id).slice(0, 8)
      : String(match[relation.label] ?? value.slice(0, 8));
  }

  function startEdit(row: Row) {
    setSelectedSessionDetail(null);
    const nextForm = activeConfig.fields.reduce<FormState>((formState, field) => {
      formState[field.name] = toInputValue(field, row[field.name]);
      return formState;
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
    if (activeConfig.name === "class_sessions" && classSessionsFilterId) {
      newForm.class_id = classSessionsFilterId;
    }
    setForm(newForm);
    setRelationQueries({});
    setOpenRelationPicker(null);
    setMessage("");
    setError("");
  }

  function buildPayload() {
    const payload = activeConfig.fields.reduce<Record<string, string | number | null>>((payload, field) => {
      const rawValue = form[field.name]?.trim() ?? "";

      if (rawValue === "") {
        payload[field.name] = null;
      } else if (field.type === "number") {
        payload[field.name] = Number(rawValue);
      } else if (field.type === "date") {
        payload[field.name] = rawValue;
      } else if (field.type === "datetime-local") {
        payload[field.name] = new Date(rawValue).toISOString();
      } else {
        payload[field.name] = rawValue;
      }

      return payload;
    }, {});

    return sanitizePayloadForTable(activeTable, payload);
  }

  function sanitizePayloadForTable<T extends Record<string, string | number | null>>(tableName: TableName, payload: T) {
    if (tableName !== "classes") {
      return payload;
    }

    const sanitizedPayload = { ...payload };
    delete sanitizedPayload.status;
    return sanitizedPayload;
  }

  function normalizeImportValue(field: FieldConfig, value: unknown) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (field.type === "number") {
      const numberValue = Number(value);
      return Number.isNaN(numberValue) ? null : numberValue;
    }

    if (field.type === "datetime-local") {
      if (typeof value === "number") {
        const parsedDate = XLSX.SSF.parse_date_code(value);
        if (!parsedDate) {
          return null;
        }

        return new Date(
          parsedDate.y,
          parsedDate.m - 1,
          parsedDate.d,
          parsedDate.H,
          parsedDate.M,
          Math.floor(parsedDate.S),
        ).toISOString();
      }

      const dateValue = new Date(String(value));
      return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
    }

    if (field.type === "date") {
      if (typeof value === "number") {
        const parsedDate = XLSX.SSF.parse_date_code(value);
        if (!parsedDate) {
          return null;
        }

        return `${parsedDate.y}-${String(parsedDate.m).padStart(2, "0")}-${String(parsedDate.d).padStart(2, "0")}`;
      }

      const dateValue = new Date(String(value));
      if (!Number.isNaN(dateValue.getTime())) {
        return dateValue.toISOString().slice(0, 10);
      }

      return String(value).trim();
    }

    return String(value).trim();
  }

  function buildExcelRows(rows: Row[]) {
    const exportColumns = [
      ...activeConfig.fields.map(getImportColumnName),
      "created_at",
    ];

    return rows.map((row) =>
      exportColumns.reduce<Record<string, string | number>>((excelRow, column) => {
        const field = activeConfig.fields.find((fieldItem) => getImportColumnName(fieldItem) === column);
        const value = field ? getExportValue(field, row) : row[column];
        excelRow[column] = value === null || value === undefined ? "" : String(value);
        return excelRow;
      }, {}),
    );
  }

  function getExportValue(field: FieldConfig, row: Row) {
    if (!field.importKey) {
      return row[field.name];
    }

    if (field.importKey === "course_code") {
      const course = data.courses.find((item) => item.id === row[field.name]);
      return course?.course_code ?? course?.name ?? row[field.name];
    }

    if (field.importKey === "teacher_email") {
      const teacher = data.teachers.find((item) => item.id === row[field.name]);
      return teacher?.email ?? row[field.name];
    }

    if (field.importKey === "student_email") {
      const student = data.students.find((item) => item.id === row[field.name]);
      return student?.email ?? row[field.name];
    }

    if (field.importKey === "class_code") {
      const classRow = data.classes.find((item) => item.id === row[field.name]);
      return classRow?.class_code ?? classRow?.class_name ?? row[field.name];
    }

    if (field.importKey === "enrollment_key") {
      const enrollment = data.enrollments.find((item) => item.id === row[field.name]);
      const student = data.students.find((item) => item.id === enrollment?.student_id);
      const classRow = data.classes.find((item) => item.id === enrollment?.class_id);
      return student?.email && classRow?.class_code
        ? `${student.email}|${classRow.class_code}`
        : row[field.name];
    }

    return row[field.name];
  }

  function downloadWorkbook(filename: string, rows: Record<string, string | number>[]) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeConfig.name);
    XLSX.writeFile(workbook, filename);
  }

  function getTemplateValue(field: FieldConfig) {
    if (field.exampleValue) {
      return field.exampleValue;
    }

    if (field.type === "number") {
      return 0;
    }

    if (field.type === "datetime-local") {
      return "2026-05-10T09:00";
    }

    if (field.type === "date") {
      return "2026-05-10";
    }

    if (field.name === "email") {
      return "example@dua-edu.com";
    }

    if (field.name === "phone") {
      return "0900000000";
    }

    if (field.name.includes("status")) {
      return "active";
    }

    return `Nhập ${field.label.toLowerCase()}`;
  }

  async function downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeConfig.label);
    const fieldNames = activeConfig.fields.map(getImportColumnName);

    workbook.creator = "Dua-Edu";
    workbook.created = new Date();

    worksheet.mergeCells(1, 1, 1, fieldNames.length + 1);
    worksheet.mergeCells(2, 1, 2, fieldNames.length + 1);
    worksheet.getCell("A1").value = `Dua-Edu - File mẫu ${activeConfig.label}`;
    worksheet.getCell("A2").value =
      "Giữ nguyên tên cột ở dòng 4. Sửa hoặc xoá dòng ví dụ ở dòng 5 trước khi import.";
    worksheet.getCell("A1").font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" },
    };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A2").font = { color: { argb: "FF166534" }, italic: true };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    const headerRow = worksheet.getRow(4);
    headerRow.values = ["", ...fieldNames];
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF059669" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFBBF7D0" } },
        left: { style: "thin", color: { argb: "FFBBF7D0" } },
        bottom: { style: "thin", color: { argb: "FFBBF7D0" } },
        right: { style: "thin", color: { argb: "FFBBF7D0" } },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    const exampleRow = worksheet.getRow(5);
    exampleRow.values = ["", ...activeConfig.fields.map(getTemplateValue)];
    exampleRow.eachCell((cell) => {
      cell.font = { color: { argb: "FF14532D" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCFCE7" },
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });

    worksheet.columns = [
      { key: "spacer", width: 3 },
      ...activeConfig.fields.map((field) => ({
        key: getImportColumnName(field),
        width: Math.max(18, field.label.length + 8, getImportColumnName(field).length + 6),
      })),
    ];
    worksheet.views = [{ state: "frozen", ySplit: 4 }];
    worksheet.autoFilter = {
      from: { row: 4, column: 2 },
      to: { row: 4, column: fieldNames.length + 1 },
    };

    activeConfig.fields.forEach((field, fieldIndex) => {
      const options = field.options;

      if (!options?.length) {
        return;
      }

      const column = worksheet.getColumn(fieldIndex + 2);
      column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber < 5) {
          return;
        }

        cell.dataValidation = {
          type: "list",
          allowBlank: !field.required,
          formulae: [`"${options.map((option) => option.value).join(",")}"`],
          showErrorMessage: true,
          errorTitle: "Giá trị không hợp lệ",
          error: `Chọn một trong: ${options.map((option) => option.value).join(", ")}`,
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeConfig.name}-template.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportData() {
    downloadWorkbook(`${activeConfig.name}-export.xlsx`, buildExcelRows(filteredRows));
  }

  async function skipDuplicateEmails(
    payload: Record<string, string | number | null>[],
  ) {
    const hasEmailField = activeConfig.fields.some(f => f.name === "email");
    if (!hasEmailField) {
      return { duplicateCount: 0, duplicateEmails: [], payload };
    }

    const seenEmails = new Set<string>();
    const duplicateEmails: string[] = [];
    let duplicateCount = 0;
    const uniqueRows = payload.filter((row) => {
      const email = String(row.email ?? "").trim().toLowerCase();

      if (!email) {
        return true;
      }

      if (seenEmails.has(email)) {
        duplicateCount += 1;
        duplicateEmails.push(email);
        return false;
      }

      seenEmails.add(email);
      return true;
    });
    const emails = Array.from(seenEmails);

    if (!emails.length) {
      return { duplicateCount, duplicateEmails, payload: uniqueRows };
    }

    const { data: existingRows, error: emailCheckError } = await supabase
      .from(activeTable)
      .select("email")
      .in("email", emails);

    if (emailCheckError) {
      throw new Error(emailCheckError.message);
    }

    const existingEmails = new Set(
      (existingRows ?? []).map((row) => String(row.email ?? "").trim().toLowerCase()),
    );
    const filteredPayload = uniqueRows.filter((row) => {
      const email = String(row.email ?? "").trim().toLowerCase();

      if (email && existingEmails.has(email)) {
        duplicateCount += 1;
        duplicateEmails.push(email);
        return false;
      }

      return true;
    });

    return { duplicateCount, duplicateEmails, payload: filteredPayload };
  }

  async function resolveImportReferences(payload: Record<string, string | number | null>[]) {
    const normalizeKey = (value: string | number | null | undefined) =>
      String(value ?? "").trim().toLowerCase();
    const findByKey = (rows: Row[], key: string, value: string | number | null) =>
      rows.find((row) => normalizeKey(row[key]) === normalizeKey(value));

    if (activeTable === "classes") {
      return payload.map((row, index) => {
        const course = findByKey(data.courses, "course_code", row.course_id);
        const teacher = findByKey(data.teachers, "email", row.teacher_id);

        if (!course?.id) {
          throw new Error(`Dòng ${index + 5}: không tìm thấy khoá học với course_code "${row.course_id}".`);
        }

        if (!teacher?.id) {
          throw new Error(`Dòng ${index + 5}: không tìm thấy giảng viên với teacher_email "${row.teacher_id}".`);
        }

        return {
          ...row,
          course_id: String(course.id),
          teacher_id: String(teacher.id),
        };
      });
    }

    if (activeTable === "enrollments") {
      return payload.map((row, index) => {
        const student = findByKey(data.students, "email", row.student_id);
        const classRow = findByKey(data.classes, "class_code", row.class_id);

        if (!student?.id) {
          throw new Error(`Dòng ${index + 5}: không tìm thấy học viên với student_email "${row.student_id}".`);
        }

        if (!classRow?.id) {
          throw new Error(`Dòng ${index + 5}: không tìm thấy lớp với class_code "${row.class_id}".`);
        }

        return {
          ...row,
          class_id: String(classRow.id),
          student_id: String(student.id),
        };
      });
    }

    if (activeTable === "certificates") {
      return payload.map((row, index) => {
        const [email, classCode] = String(row.enrollment_id ?? "")
          .split("|")
          .map((value) => value.trim());
        const student = findByKey(data.students, "email", email);
        const classRow = findByKey(data.classes, "class_code", classCode);
        const enrollment = data.enrollments.find(
          (item) =>
            normalizeKey(item.student_id) === normalizeKey(student?.id) &&
            normalizeKey(item.class_id) === normalizeKey(classRow?.id),
        );

        if (!email || !classCode) {
          throw new Error(
            `Dòng ${index + 5}: enrollment_key phải có dạng student_email|class_code.`,
          );
        }

        if (!enrollment?.id) {
          throw new Error(
            `Dòng ${index + 5}: không tìm thấy ghi danh với enrollment_key "${row.enrollment_id}".`,
          );
        }

        return {
          ...row,
          enrollment_id: String(enrollment.id),
        };
      });
    }

    return payload;
  }

  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("File Excel không có sheet nào.");
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        workbook.Sheets[firstSheetName],
        { defval: "", range: 3 },
      );

      const payload = rows
        .map((row) =>
          activeConfig.fields.reduce<Record<string, string | number | null>>((record, field) => {
            record[field.name] = normalizeImportValue(field, row[getImportColumnName(field)]);
            return record;
          }, {}),
        )
        .filter((row) => Object.values(row).some((value) => value !== null && value !== ""));

      if (!payload.length) {
        throw new Error("File Excel không có dòng dữ liệu hợp lệ.");
      }

      const resolvedPayload = (await resolveImportReferences(payload)).map((row) =>
        sanitizePayloadForTable(activeTable, row),
      );
      const importData = await skipDuplicateEmails(resolvedPayload);

      if (!importData.payload.length) {
        const duplicatePreview = importData.duplicateEmails.length
          ? ` Email trùng: ${importData.duplicateEmails.slice(0, 10).join(", ")}${importData.duplicateEmails.length > 10 ? `, ... (+${importData.duplicateEmails.length - 10} email khác)` : ""}.`
          : "";
        setMessage(
          importData.duplicateCount
            ? `Không có dòng mới để import. Đã bỏ qua ${importData.duplicateCount} email đã tồn tại trong hệ thống.${duplicatePreview}`
            : "Không có dòng mới để import.",
        );
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");

      const result = await bulkImportAction(session.access_token, activeTable, importData.payload);

      if (!result.ok) {
        throw new Error(result.error);
      }

      const totalSkipped = (importData.duplicateCount || 0) + (result.skipped || 0);
      const duplicateEmails = Array.from(
        new Set([...(importData.duplicateEmails || []), ...((result as any).duplicatedEmails || [])]),
      );

      setMessage(
        `✓ Đã import ${result.data?.length || 0} dòng thành công.` +
          (totalSkipped > 0
            ? ` Bỏ qua ${totalSkipped} email trùng${duplicateEmails.length > 0 ? `: ${duplicateEmails.slice(0, 10).join(", ")}${duplicateEmails.length > 10 ? `, ... (+${duplicateEmails.length - 10} email khác)` : ""}` : ""}.`
            : ""),
      );
      await loadAllTables();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Không thể import file Excel.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const missingField = activeConfig.fields.find(
      (field) => field.required && !form[field.name]?.trim(),
    );

    if (missingField) {
      setError(`Vui lòng ${missingField.optionsKey ? "chọn" : "nhập"} ${missingField.label}.`);
      return;
    }

    setIsSaving(true);
    const payload = buildPayload();
    const request = editingRow?.id
      ? supabase.from(activeTable).update(payload).eq("id", editingRow.id)
      : supabase.from(activeTable).insert(payload);

    const { error: saveError } = await request;

    if (saveError) {
      setError(saveError.message);
      setIsSaving(false);
      return;
    }

    setMessage(editingRow ? "Đã cập nhật bản ghi." : "Đã thêm bản ghi mới.");
    setEditingRow(null);
    setForm(buildEmptyForm(activeConfig.fields));
    setRelationQueries({});
    setOpenRelationPicker(null);
    await loadAllTables();
    setIsSaving(false);
  }

  async function createStudentLoginAccount(input: { email: string; full_name: string; student_id?: string }) {
    setError("");
    setMessage("");

    const fullName = input.full_name.trim();
    const email = input.email.trim().toLowerCase();
    if (!fullName || !email) {
      setError("Vui lòng nhập tên và email học viên.");
      return;
    }

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");

      const result = await createStudentAccount(session.access_token, {
        email,
        full_name: fullName,
        student_id: input.student_id,
      });

      setMessage(`✓ Đã cấp tài khoản học viên ${email}. Mật khẩu: ${result.initial_password}`);
      setStudentAccountForm({ email: "", full_name: "" });
      await Promise.all([loadAllTables(), loadAdmins()]);
    } catch (err: any) {
      setError(err.message || "Không cấp được tài khoản học viên.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetStudentLoginPassword(authUserId: string, email: string) {
    const confirmed = window.confirm(`Reset mật khẩu cho tài khoản học viên "${email}"?`);
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vui lòng đăng nhập lại.");

      const result = await resetStudentPassword(session.access_token, authUserId);
      setMessage(`✓ Đã reset mật khẩu cho ${email}. Mật khẩu mới: ${result.initial_password}`);
      await loadAdmins();
    } catch (err: any) {
      setError(err.message || "Không reset được mật khẩu học viên.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRow(row: Row) {
    const label = String(row.full_name ?? row.name ?? row.class_name ?? row.certificate_code ?? row.id);
    const confirmed = window.confirm(`Xoá "${label}" khỏi ${activeConfig.label}?`);

    if (!confirmed || !row.id) {
      return;
    }

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase.from(activeTable).delete().eq("id", row.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("Đã xoá bản ghi.");
    await loadAllTables();
  }

  function openClassDetail(classId: string) {
    setSelectedClassId(classId);
    setClassStatusFilter("all");
    changeView("classDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openClassManagement() {
    setClassStatusFilter("all");
    changeView("classManagement");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAttendanceView() {
    setSelectedAttendanceClassId((current) => current ?? visibleClassItems[0]?.id ?? null);
    changeView("attendance");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function openAssignAssistantModal(classId: string) {
    setShowAssignModal(classId);
    setClassAssistants([]);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const [assistants, usersResult] = await Promise.all([
        loadClassAssistants(classId),
        getUsersSafe(session.access_token),
      ]);
      setClassAssistants(assistants);
      setAdminUsers(usersResult.users);
      if (!usersResult.ok) {
        setError(usersResult.error);
      }
    } catch (err: any) {
      setError(err.message || "Không tải được danh sách trợ giảng.");
    }
  }

  async function loadClassAssistants(classId: string) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất rồi đăng nhập lại.");
    }

    const result = await getClassAssistantsSafe(session.access_token, classId);
    if (!result.ok) {
      throw new Error(result.error);
    }

    return result.assistants as ClassAssistant[];
  }

  async function assignAssistantToClass(classId: string, assistantId: string) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất rồi đăng nhập lại.");
    }

    const result = await assignAssistantSafe(session.access_token, classId, assistantId);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  async function removeAssistantFromClass(classId: string, assistantId: string) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất rồi đăng nhập lại.");
    }

    const result = await removeAssistantSafe(session.access_token, classId, assistantId);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  function getEnrollmentStatusClass(status: string) {
    if (enrollmentStatusOptions.some((option) => option.value === status)) {
      return `status-${status}`;
    }

    return status ? "status-custom" : "status-empty";
  }

  async function updateEnrollmentStatus(enrollmentId: string, status: string) {
    if (!enrollmentId) {
      setError("Không tìm thấy ghi danh để cập nhật trạng thái.");
      return;
    }

    setUpdatingEnrollmentId(enrollmentId);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ status: status || null })
      .eq("id", enrollmentId);

    if (updateError) {
      setError(updateError.message);
      setUpdatingEnrollmentId(null);
      return;
    }

    setData((current) => ({
      ...current,
      enrollments: current.enrollments.map((enrollment) =>
        String(enrollment.id) === enrollmentId ? { ...enrollment, status: status || null } : enrollment,
      ),
    }));
    setMessage("Đã cập nhật trạng thái ghi danh.");
    setUpdatingEnrollmentId(null);
  }

  async function updateEnrollmentProjectField(enrollmentId: string, field: "project_score" | "project_url" | "assignment_score", value: number | string) {
    if (!enrollmentId) return;

    setUpdatingEnrollmentId(enrollmentId);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ [field]: value })
      .eq("id", enrollmentId);

    if (updateError) {
      setError(updateError.message);
      setUpdatingEnrollmentId(null);
      return;
    }

    setData((current) => ({
      ...current,
      enrollments: current.enrollments.map((enrollment) =>
        String(enrollment.id) === enrollmentId ? { ...enrollment, [field]: value } : enrollment,
      ),
    }));
    const messageFieldMap: Record<string, string> = {
      "project_score": "điểm đồ án",
      "project_url": "link đồ án",
      "assignment_score": "điểm bài tập",
    };
    setMessage(`Đã cập nhật ${messageFieldMap[field]}.`);
    setUpdatingEnrollmentId(null);
  }

  const exportClassDetailExcel = () => {
    if (!selectedClass) return;

    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ["Học viên", "Email", "Điểm chuyên cần", "Điểm bài tập", "Điểm đồ án", "Điểm tổng kết", "Trạng thái"]
    ];

    selectedClassEnrollments.forEach((enrollment) => {
      worksheetData.push([
        String(enrollment.name ?? ""),
        String(enrollment.email ?? ""),
        String(enrollment.attendanceScore ?? ""),
        String(enrollment.assignmentScore ?? ""),
        String(enrollment.projectScore ?? ""),
        String(enrollment.finalScore ?? ""),
        String(enrollment.status ?? "Chưa có")
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach lop");

    const fileName = `DanhSachLop_${selectedClass.classCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  function getAttendanceStatusClass(status: string) {
    if (attendanceStatusOptions.some((option) => option.value === status)) {
      return `attendance-${status}`;
    }

    return "attendance-empty";
  }

  async function updateAttendanceStatus(enrollment: { id: string }, status: string) {
    if (!selectedAttendanceClass || !enrollment.id) {
      setError("Không đủ dữ liệu để cập nhật điểm danh.");
      return;
    }

    setError("");
    setMessage("");

    const payload = {
      enrollment_id: enrollment.id,
      session_number: selectedAttendanceSession,
      status,
    };

    const { data: savedRows, error: saveError } = await supabase
      .from("attendance_records")
      .upsert(payload, { onConflict: "enrollment_id,session_number" })
      .select("*");

    if (saveError) {
      setError(saveError.message);
      return;
    }

    const savedRecord = savedRows?.[0] as AttendanceRecord | undefined;

    if (savedRecord) {
      setAttendanceRecords((current) => {
        const exists = current.some((record) => String(record.id) === String(savedRecord.id));

        if (exists) {
          return current.map((record) =>
            String(record.id) === String(savedRecord.id) ? savedRecord : record,
          );
        }

        return [...current, savedRecord];
      });
    } else {
      await loadAttendanceRecords(getAssistantAllowedEnrollmentIds());
    }

    setMessage("Đã cập nhật điểm danh.");
  }

  async function updateAssignmentScore(enrollment: { id: string }, assignmentNumber: number, scoreStr: string) {
    if (!selectedAttendanceClass || !enrollment.id) {
      setError("Không đủ dữ liệu để cập nhật điểm bài tập.");
      return;
    }

    const score = Number(scoreStr);
    if (isNaN(score)) return;

    setError("");
    setMessage("");

    const payload = {
      enrollment_id: enrollment.id,
      assignment_number: assignmentNumber,
      score,
    };

    const { data: savedRows, error: saveError } = await supabase
      .from("assignment_records")
      .upsert(payload, { onConflict: "enrollment_id,assignment_number" })
      .select("*");

    if (saveError) {
      setError(saveError.message);
      return;
    }

    const savedRecord = savedRows?.[0] as AssignmentRecord | undefined;

    if (savedRecord) {
      setAssignmentRecords((current) => {
        const exists = current.some((record) => String(record.id) === String(savedRecord.id));

        if (exists) {
          return current.map((record) =>
            String(record.id) === String(savedRecord.id) ? savedRecord : record,
          );
        }

        return [...current, savedRecord];
      });
    } else {
      await loadAssignmentRecords(getAssistantAllowedEnrollmentIds());
    }

    setMessage("Đã cập nhật điểm bài tập.");
  }

  function renderBarChart(items: ChartItem[], emptyText: string) {
    const maxValue = Math.max(...items.map((item) => item.value), 0);

    if (!items.length) {
      return <p className="empty-chart">{emptyText}</p>;
    }

    return (
      <div className="bar-chart">
        {items.map((item) => (
          <div className="bar-row" key={item.id}>
            <div className="bar-meta">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="bar-track" aria-label={`${item.label}: ${item.value} ghi danh`}>
              <span
                className="bar-fill"
                style={{
                  background: item.color,
                  width: `${maxValue ? Math.max((item.value / maxValue) * 100, 4) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderPieChart(items: ChartItem[], emptyText: string) {
    let cursor = 0;
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const segments = items.map((item, index) => {
      const start = cursor;
      cursor += total ? (item.value / total) * 100 : 0;
      const end = index === items.length - 1 ? 100 : cursor;
      return `${item.color} ${start}% ${end}%`;
    });

    if (!items.length) {
      return <p className="empty-chart">{emptyText}</p>;
    }

    return (
      <div className="pie-layout">
        <div
          aria-label="Biểu đồ tròn"
          className="pie-chart"
          role="img"
          style={{ background: `conic-gradient(${segments.join(", ")})` }}
        >
          <span>{items.length}</span>
        </div>
        <div className="pie-legend">
          {items.map((item) => (
            <div className="legend-row" key={item.id}>
              <span className="legend-dot" style={{ background: item.color }} />
              <span>{item.label}</span>
              <strong>{item.percent}%</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRelationPicker(field: FieldConfig) {
    const pickerKey = getRelationPickerKey(field);
    const selected = getSelectedRelation(field);
    const selectedLabel = selected ? getRelationLabel(field, selected) : "";
    const query = relationQueries[pickerKey] ?? selectedLabel;
    const normalizedQuery = query.trim().toLowerCase();
    const options = field.optionsKey ? data[field.optionsKey] : [];
    const matches = options
      .filter((row) => {
        if (!normalizedQuery) {
          return true;
        }

        return getRelationLabel(field, row).toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 12);

    return (
      <label className="relation-picker" key={field.name}>
        <span>{field.label}</span>
        <input
          autoComplete="off"
          onBlur={() => window.setTimeout(() => setOpenRelationPicker(null), 120)}
          onChange={(event) => {
            setRelationQueries((current) => ({ ...current, [pickerKey]: event.target.value }));
            updateFormValue(field.name, "");
            setOpenRelationPicker(pickerKey);
          }}
          onFocus={() => setOpenRelationPicker(pickerKey)}
          placeholder={`Tìm ${field.label.toLowerCase()}...`}
          required={field.required}
          value={query}
        />
        {openRelationPicker === pickerKey && (
          <div className="relation-options">
            {matches.length ? (
              matches.map((row) => {
                const label = getRelationLabel(field, row);
                return (
                  <button
                    className={String(row.id) === form[field.name] ? "selected" : ""}
                    key={String(row.id)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      updateFormValue(field.name, String(row.id));
                      setRelationQueries((current) => ({ ...current, [pickerKey]: label }));
                      setOpenRelationPicker(null);
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                );
              })
            ) : (
              <p>Không tìm thấy kết quả phù hợp.</p>
            )}
          </div>
        )}
      </label>
    );
  }

  const pageEyebrow = isDashboardView
    ? "Tổng quan"
    : isClassManagementView || isClassDetailView || isAssistantAssignmentsView
      ? "Học vụ"
      : isAttendanceView
        ? "Học vụ"
        : isProjectScoreView || isAssignmentScoreView
          ? "Học vụ"
          : "Quản trị dữ liệu";
  const pageTitle = isDashboardView
    ? "Dashboard"
    : isAdminsView
      ? "Quản trị viên"
    : isClassManagementView
      ? "Quản lý lớp"
      : isAssistantAssignmentsView
        ? "Phân công trợ giảng"
      : isClassDetailView
        ? selectedClass?.className ?? "Chi tiết lớp"
        : isAttendanceView
          ? "Điểm danh"
          : isAssignmentScoreView
            ? "Điểm bài tập"
            : isProjectScoreView
              ? "Điểm đồ án"
              : activeConfig?.label || "Đang tải...";
  const pageDescription = isDashboardView
    ? "Theo dõi ghi danh theo khoá học, giảng viên và tỉ lệ quay lại."
    : isAdminsView
      ? "Quản lý danh sách tài khoản đăng nhập vào hệ thống."
    : isClassManagementView
      ? "Theo dõi sĩ số từng lớp và mở trang riêng để xem danh sách ghi danh."
      : isAssistantAssignmentsView
        ? "Theo dõi trợ giảng đang phụ trách từng lớp và mở nhanh thao tác phân công."
      : isClassDetailView
        ? selectedClass
          ? `${selectedClass.courseName} · ${selectedClass.teacherName} · ${selectedClass.schedule} · ${selectedClass.studyTime} · Sĩ số ${selectedClass.enrollmentCount}`
          : "Không tìm thấy lớp trong dữ liệu hiện tại."
        : isAttendanceView
          ? "Chọn lớp, chọn buổi học và cập nhật trạng thái điểm danh cho từng học viên."
          : isAssignmentScoreView
            ? "Nhập điểm bài tập cho từng học viên trong lớp."
            : isProjectScoreView
              ? "Nhập điểm đồ án cho từng học viên trong lớp."
              : activeConfig?.description || "";

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", color: "var(--text-secondary)", fontFamily: "var(--font-geist-sans)" }}>
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (isAssistantUser && !isAssistantAllowedView(activeView)) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", color: "var(--text-secondary)", fontFamily: "var(--font-geist-sans)" }}>
        Đang chuyển về khu vực học vụ...
      </div>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <img alt="Dua-Edu" className="brand-logo" src={logoUrl} />
          <div>
            <h1>Quản trị đào tạo</h1>
            <button 
              onClick={() => supabase.auth.signOut()} 
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "12px", padding: 0, marginTop: "4px" }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="sidebar-nav">
          {!isAssistantUser && (
            <div className="nav-group">
              <button
                className="sidebar-group-trigger"
                onClick={() => toggleSidebarGroup("overview")}
                type="button"
              >
                <span>Tổng quan</span>
                <strong>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "overview" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </strong>
              </button>
              {openSidebarGroup === "overview" && (
                <nav className="nav-tabs" aria-label="Tổng quan">
                  <button
                    className={isDashboardView ? "active" : ""}
                    onClick={() => changeView("dashboard")}
                    type="button"
                  >
                    <span>Dashboard</span>
                    <strong>{data.enrollments.length}</strong>
                  </button>
                </nav>
              )}
            </div>
          )}

          <div className="nav-group">
            <button
              className="sidebar-group-trigger"
              onClick={() => toggleSidebarGroup("academic")}
              type="button"
            >
              <span>Học vụ</span>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "academic" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </strong>
            </button>
            {openSidebarGroup === "academic" && (
              <nav className="nav-tabs" aria-label="Nghiệp vụ học vụ">
                <button
                  className={isClassManagementView || isClassDetailView ? "active" : ""}
                  onClick={openClassManagement}
                  type="button"
                >
                  <span>Quản lý lớp</span>
                  <strong>{data.classes.length}</strong>
                </button>
                <button
                  className={activeView === "class_sessions" ? "active" : ""}
                  onClick={() => changeView("class_sessions")}
                  type="button"
                >
                  <span>Quản lý buổi học</span>
                  <strong>{data.class_sessions.length}</strong>
                </button>
                {currentUserRole === "assistant" && (
                  <button
                    className={activeView === "students" ? "active" : ""}
                    onClick={() => changeView("students")}
                    type="button"
                  >
                    <span>Học viên</span>
                    <strong>{data.students.length}</strong>
                  </button>
                )}
                {currentUserRole !== "assistant" && (
                  <button
                    className={isAssistantAssignmentsView ? "active" : ""}
                    onClick={() => changeView("assistantAssignments")}
                    type="button"
                  >
                    <span>Phân công trợ giảng</span>
                    <strong>{data.classes.length}</strong>
                  </button>
                )}
                <button
                  className={isAttendanceView ? "active" : ""}
                  onClick={openAttendanceView}
                  type="button"
                >
                  <span>Điểm danh</span>
                  <strong>{data.classes.length}</strong>
                </button>
                <button
                  className={isAssignmentScoreView ? "active" : ""}
                  onClick={() => changeView("assignmentScore")}
                  type="button"
                >
                  <span>Điểm bài tập</span>
                </button>
                <button
                  className={isProjectScoreView ? "active" : ""}
                  onClick={() => changeView("projectScore")}
                  type="button"
                >
                  <span>Điểm đồ án</span>
                </button>
              </nav>
            )}
          </div>

          {(isFullAdmin || !isAssistantUser) && (
          <div className="nav-group">
            <button
              className="sidebar-group-trigger"
              onClick={() => toggleSidebarGroup("coreData")}
              type="button"
            >
              <span>Dữ liệu lõi</span>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "coreData" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </strong>
            </button>
            {openSidebarGroup === "coreData" && (
              <nav className="nav-tabs" aria-label="Dữ liệu hệ thống">
                {tableConfigs.filter(c => ["courses", "classes", "teachers", "students"].includes(c.name)).map((config) => (
                  <button
                    className={config.name === activeView ? "active" : ""}
                    key={config.name}
                    onClick={() => changeView(config.name)}
                    type="button"
                  >
                    <span>{config.label}</span>
                    <strong>{data[config.name].length}</strong>
                  </button>
                ))}
              </nav>
            )}
          </div>
          )}

          {(isFullAdmin || !isAssistantUser) && (
          <div className="nav-group">
            <button
              className="sidebar-group-trigger"
              onClick={() => toggleSidebarGroup("extendedData")}
              type="button"
            >
              <span>Mở rộng</span>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "extendedData" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </strong>
            </button>
            {openSidebarGroup === "extendedData" && (
              <nav className="nav-tabs" aria-label="Dữ liệu mở rộng">
                {tableConfigs.filter(c => ["enrollments", "certificates"].includes(c.name)).map((config) => (
                  <button
                    className={config.name === activeView ? "active" : ""}
                    key={config.name}
                    onClick={() => changeView(config.name)}
                    type="button"
                  >
                    <span>{config.label}</span>
                    <strong>{data[config.name].length}</strong>
                  </button>
                ))}
              </nav>
            )}
          </div>
          )}

          {(isFullAdmin || !isAssistantUser) && (
          <div className="nav-group">
            <button
              className="sidebar-group-trigger"
              onClick={() => toggleSidebarGroup("system")}
              type="button"
            >
              <span>Hệ thống</span>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openSidebarGroup === "system" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </strong>
            </button>
            {openSidebarGroup === "system" && (
              <nav className="nav-tabs" aria-label="Hệ thống">
                <button
                  className={isAdminsView ? "active" : ""}
                  onClick={() => changeView("admins")}
                  type="button"
                >
                  <span>Quản trị viên</span>
                </button>
              </nav>
            )}
          </div>
          )}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{pageEyebrow}</p>
            <h2>{pageTitle}</h2>
            <p>{pageDescription}</p>
          </div>
          <div className="topbar-actions">
            <button
              className="secondary-button"
              onClick={() => isAssistantAssignmentsView ? void loadAssistantAssignmentOverview() : void loadAllTables()}
              type="button"
            >
              Làm mới
            </button>
            {isClassDetailView && (
              <button className="secondary-button" onClick={openClassManagement} type="button">
                Quay lại lớp
              </button>
            )}
            {isDataView && (
              <>
                <button className="secondary-button" onClick={() => void downloadTemplate()} type="button">
                  Tải file mẫu
                </button>
                <button className="secondary-button" onClick={exportData} type="button">
                  Export data
                </button>
                <button
                  className="primary-action"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Import data
                </button>
                <input
                  accept=".xlsx,.xls"
                  className="file-input"
                  onChange={(event) => void importExcel(event)}
                  ref={fileInputRef}
                  type="file"
                />
              </>
            )}
          </div>
        </header>

        {isDashboardView && (
          <section className="stats-grid" aria-label="Tổng quan">
            {stats.map((item) => (
              <article className="stat-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>
        )}

        {isDashboardView && (
          <section className="analytics-grid" aria-label="Dashboard phân tích">
            <article className="analytics-card wide">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Theo khoá học</p>
                  <h3>Số ghi danh của các khoá</h3>
                </div>
              </div>
              {renderBarChart(analytics.courseItems, "Chưa có dữ liệu ghi danh theo khoá.")}
            </article>

            <article className="analytics-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tỉ trọng</p>
                  <h3>% ghi danh các khoá</h3>
                </div>
              </div>
              {renderPieChart(analytics.courseItems, "Chưa có dữ liệu để vẽ biểu đồ tròn.")}
            </article>

            <article className="analytics-card wide">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Theo giảng viên</p>
                  <h3>Số ghi danh của mỗi giảng viên</h3>
                </div>
              </div>
              {renderBarChart(analytics.teacherItems, "Chưa có dữ liệu ghi danh theo giảng viên.")}
            </article>

            <article className="analytics-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tỉ trọng</p>
                  <h3>% ghi danh theo giảng viên</h3>
                </div>
              </div>
              {renderPieChart(analytics.teacherItems, "Chưa có dữ liệu để vẽ biểu đồ tròn.")}
            </article>

            <article className="analytics-card return-card">
              <p className="eyebrow">Quay lại học</p>
              <h3>Học viên ghi danh từ 2 lớp trở lên</h3>
              <strong>{analytics.returningStudents}</strong>
              <span>
                Tỉ lệ quay lại: {analytics.returnRate}% trên tổng {data.students.length} học viên
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
                        analytics.returningStudentItems.map((student) => (
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
        )}

        {isClassManagementView && (
          <section className="analytics-grid" aria-label="Quản lý lớp">
            <article className="analytics-card class-size-card wide" style={{ paddingTop: "24px" }}>
              <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên lớp, mã lớp, giảng viên..."
                  value={classManagementSearch}
                  onChange={(e) => setClassManagementSearch(e.target.value)}
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
                    {(classManagementSearch
                      ? visibleClassItems.filter((item) =>
                          item.className.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                          item.classCode.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                          item.courseName.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                          item.teacherName.toLowerCase().includes(classManagementSearch.toLowerCase())
                        )
                      : visibleClassItems
                    ).length ? (
                      (classManagementSearch
                        ? visibleClassItems.filter((item) =>
                            item.className.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                            item.classCode.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                            item.courseName.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                            item.teacherName.toLowerCase().includes(classManagementSearch.toLowerCase())
                          )
                        : visibleClassItems
                      ).map((item) => (
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
                          <td>
                            <button
                              className="secondary-button compact-button"
                              onClick={() => openClassDetail(item.id)}
                              type="button"
                            >
                              Xem
                            </button>
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
        )}

        {isAssistantAssignmentsView && (
          <section className="analytics-grid" aria-label="Phân công trợ giảng">
            <article className="analytics-card wide" style={{ paddingTop: "24px" }}>
              <div className="section-heading" style={{ alignItems: "flex-end", gap: "16px" }}>
                <div>
                  <p className="eyebrow">Trợ giảng</p>
                  <h3>{assignedAssistantTotal} lượt phân công</h3>
                  <p style={{ margin: "6px 0 0", color: "var(--text-secondary)" }}>
                    Theo dõi {visibleClassItems.length} lớp và cập nhật trợ giảng phụ trách.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <input
                    type="text"
                    placeholder="Tìm lớp, mã lớp, khoá học..."
                    value={assistantAssignmentSearch}
                    onChange={(e) => setAssistantAssignmentSearch(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      width: "280px",
                      maxWidth: "100%",
                    }}
                  />
                  <button
                    className="secondary-button compact-button"
                    onClick={() => void loadAssistantAssignmentOverview()}
                    type="button"
                  >
                    Làm mới
                  </button>
                </div>
              </div>

              <div className="class-table">
                <table>
                  <thead>
                    <tr>
                      <th>Lớp</th>
                      <th>Mã lớp</th>
                      <th>Khoá học</th>
                      <th>Giảng viên</th>
                      <th>Sĩ số</th>
                      <th>Trợ giảng hiện tại</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assistantAssignmentClassItems.length ? (
                      assistantAssignmentClassItems.map((item) => {
                        const assignments = assistantAssignmentsByClass[item.id] ?? [];

                        return (
                          <tr key={item.id}>
                            <td>{item.className}</td>
                            <td>{item.classCode}</td>
                            <td>{item.courseName}</td>
                            <td>{item.teacherName}</td>
                            <td>
                              <strong>{item.enrollmentCount}</strong>
                            </td>
                            <td>
                              {assignments.length ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  {assignments.map((assignment) => {
                                    const assistant = assistantUserByProfileId.get(String(assignment.assistant_id));
                                    return (
                                      <span key={assignment.id ?? assignment.assistant_id}>
                                        {assistant?.username || assistant?.email || assignment.assistant_id}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>Chưa phân công</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="secondary-button compact-button"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none" }}
                                onClick={() => void openAssignAssistantModal(item.id)}
                                type="button"
                              >
                                Phân công
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7}>Không có lớp phù hợp để phân công trợ giảng.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {isClassDetailView && (
          <section className="analytics-grid" aria-label="Chi tiết lớp">
            {isLoading ? (
              <article className="analytics-card detail-card wide">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Chi tiết lớp</p>
                    <h3>Đang tải danh sách ghi danh...</h3>
                    <p>Hệ thống đang lấy dữ liệu lớp từ Supabase.</p>
                  </div>
                </div>
              </article>
            ) : selectedClass ? (
              <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div className="class-detail-actions">
                    <label>
                      <span>Lọc trạng thái</span>
                      <select
                        className="status-filter-select"
                        onChange={(event) => setClassStatusFilter(event.target.value)}
                        value={classStatusFilter}
                      >
                        {selectedClassStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="primary-button" onClick={exportClassDetailExcel} type="button">
                      Xuất Excel
                    </button>
                    <button className="text-button" onClick={openClassManagement} type="button">
                      Quay lại
                    </button>
                  </div>
                </div>
                <p className="filter-summary">
                  {selectedClass.courseName} · {selectedClass.teacherName} · Lịch học{" "}
                  {selectedClass.schedule} · Thời gian {selectedClass.studyTime} · Đang hiển thị{" "}
                  {selectedClassEnrollments.length}/{selectedClass.enrollmentCount} ghi danh
                </p>
                <div className="class-table">
                  <table>
                    <thead>
                      <tr>
                        <th onClick={() => handleClassDetailSort("name")} style={{ cursor: "pointer" }}>Học viên {renderClassDetailSortIcon("name")}</th>
                        <th onClick={() => handleClassDetailSort("email")} style={{ cursor: "pointer" }}>Email {renderClassDetailSortIcon("email")}</th>
                        <th onClick={() => handleClassDetailSort("attendanceScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Điểm chuyên cần {renderClassDetailSortIcon("attendanceScore")}</th>
                        <th onClick={() => handleClassDetailSort("assignmentScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Điểm bài tập {renderClassDetailSortIcon("assignmentScore")}</th>
                        <th onClick={() => handleClassDetailSort("projectScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Điểm đồ án {renderClassDetailSortIcon("projectScore")}</th>
                        <th onClick={() => handleClassDetailSort("finalScore")} style={{ cursor: "pointer", borderLeft: "1px solid var(--border)", paddingLeft: "16px", color: "var(--accent)", fontSize: "15px" }}>Điểm tổng kết {renderClassDetailSortIcon("finalScore")}</th>
                        <th style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassEnrollments.length ? (
                        selectedClassEnrollments.map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td>{enrollment.name}</td>
                            <td>{enrollment.email}</td>
                            <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>{formatValue(enrollment.attendanceScore)}</td>
                            <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>{formatValue(enrollment.assignmentScore)}</td>
                            <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>{formatValue(enrollment.projectScore)}</td>
                            <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px", color: "var(--accent)" }}>
                              <strong>{formatValue(enrollment.finalScore)}</strong>
                            </td>
                            <td style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>
                              <select
                                className={`status-select ${getEnrollmentStatusClass(enrollment.status)}`}
                                disabled={updatingEnrollmentId === enrollment.id}
                                onChange={(event) =>
                                  void updateEnrollmentStatus(enrollment.id, event.target.value)
                                }
                                value={enrollment.status}
                              >
                                <option value="">Chưa có trạng thái</option>
                                {[
                                  ...enrollmentStatusOptions,
                                  ...(enrollment.status &&
                                  !enrollmentStatusOptions.some(
                                    (option) => option.value === enrollment.status,
                                  )
                                    ? [{ label: enrollment.status, value: enrollment.status }]
                                    : []),
                                ].map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7}>Không có ghi danh phù hợp với bộ lọc này.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ) : (
              <article className="analytics-card detail-card wide">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Chi tiết lớp</p>
                    <h3>Không tìm thấy lớp</h3>
                    <p>Lớp này có thể đã bị xoá hoặc chưa tải xong dữ liệu.</p>
                  </div>
                  <button className="text-button" onClick={openClassManagement} type="button">
                    Quay lại
                  </button>
                </div>
              </article>
            )}
          </section>
        )}

        {isAttendanceView && (
          <section className="analytics-grid" aria-label="Điểm danh theo buổi học">
            <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>

              <div className="attendance-toolbar" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <label style={{ maxWidth: "100%" }}>
                  <span>Lớp học</span>
                  <select
                    onChange={(event) => {
                      setSelectedAttendanceClassId(event.target.value || null);
                      setSelectedAttendanceSession(1);
                    }}
                    value={selectedAttendanceClassId ?? ""}
                  >
                    <option value="">Chọn lớp học</option>
                    {visibleClassItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.classCode} - {item.className}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
                  {attendanceMode === "session" ? (
                    <label style={{ flex: 1, minWidth: "200px", maxWidth: "300px" }}>
                      <span>Buổi học</span>
                      <select
                        onChange={(event) => setSelectedAttendanceSession(Number(event.target.value))}
                        value={selectedAttendanceSession}
                      >
                        {Array.from({ length: attendanceSessionCount }, (_, index) => index + 1).map(
                          (sessionNumber) => (
                            <option key={sessionNumber} value={sessionNumber}>
                              Buổi {sessionNumber}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : <div />}

                  <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                    <button
                      className="secondary-button"
                      onClick={() => setAttendanceMode("session")}
                      style={{ 
                        background: attendanceMode === "session" ? "var(--accent-soft)" : "transparent",
                        borderColor: attendanceMode === "session" ? "var(--accent)" : "var(--border)",
                        color: attendanceMode === "session" ? "var(--accent-dark)" : "var(--foreground)"
                      }}
                      type="button"
                    >
                      Điểm danh
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setAttendanceMode("summary")}
                      style={{ 
                        background: attendanceMode === "summary" ? "var(--accent-soft)" : "transparent",
                        borderColor: attendanceMode === "summary" ? "var(--accent)" : "var(--border)",
                        color: attendanceMode === "summary" ? "var(--accent-dark)" : "var(--foreground)"
                      }}
                      type="button"
                    >
                      Bảng tổng hợp
                    </button>
                  </div>
                </div>
              </div>

              {attendanceError && <div className="notice error">{attendanceError}</div>}

              {selectedAttendanceClass ? (
                <>
                  <p className="filter-summary">
                    {selectedAttendanceClass.courseName} · {selectedAttendanceClass.teacherName} ·{" "}
                    {selectedAttendanceClass.schedule} · {selectedAttendanceClass.studyTime} ·{" "}
                    {selectedAttendanceClass.enrollmentCount} học viên ghi danh
                  </p>
                  <div className={`class-table attendance-table ${attendanceMode === "summary" ? "table-wrap" : ""}`}>
                    <table>
                      <thead>
                        {attendanceMode === "summary" ? (
                          <tr>
                            <th>Học viên</th>
                            {Array.from({ length: attendanceSessionCount }, (_, i) => (
                              <th key={i} style={{ textAlign: "center" }}>B.{i + 1}</th>
                            ))}
                            <th style={{ textAlign: "center" }} title="Có mặt">CM</th>
                            <th style={{ textAlign: "center" }} title="Vắng">V</th>
                            <th style={{ textAlign: "center" }} title="Muộn">M</th>
                            <th style={{ textAlign: "center" }} title="Phép">P</th>
                            <th style={{ textAlign: "center" }}>Điểm CC</th>
                          </tr>
                        ) : (
                          <tr>
                            <th>Học viên</th>
                            <th>Email</th>
                            <th>Trạng thái điểm danh</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {selectedAttendanceClass.enrollments.length ? (
                          selectedAttendanceClass.enrollments.map((enrollment) => {
                            if (attendanceMode === "summary") {
                              let presentCount = 0;
                              let absentCount = 0;
                              let lateCount = 0;
                              let excusedCount = 0;

                              const sessionCells = Array.from({ length: attendanceSessionCount }, (_, i) => {
                                const record = attendanceRecords.find(
                                  (r) => String(r.enrollment_id) === enrollment.id && Number(r.session_number) === i + 1
                                );
                                const status = record?.status ? String(record.status) : "-";
                                const shortStatus = status === "present" ? "✓" : status === "absent" ? "V" : status === "late" ? "M" : status === "excused" ? "P" : "-";
                                
                                if (status === "present") presentCount++;
                                if (status === "absent") absentCount++;
                                if (status === "late") lateCount++;
                                if (status === "excused") excusedCount++;

                                let statusBg = "transparent";
                                let statusColor = "#667085";
                                if (status === "present") { statusBg = "#dcfce7"; statusColor = "#047857"; }
                                if (status === "absent") { statusBg = "#fee2e2"; statusColor = "#b42318"; }
                                if (status === "late") { statusBg = "#fef3c7"; statusColor = "#92400e"; }
                                if (status === "excused") { statusBg = "#e0f2fe"; statusColor = "#0369a1"; }

                                return (
                                  <td key={i} style={{ textAlign: "center" }}>
                                    <span 
                                      style={{ 
                                        display: "inline-grid", width: "24px", height: "24px", 
                                        placeItems: "center", borderRadius: "4px", 
                                        fontSize: "12px", fontWeight: "bold", 
                                        background: statusBg, color: statusColor 
                                      }} 
                                      title={status}
                                    >
                                      {shortStatus}
                                    </span>
                                  </td>
                                );
                              });

                              return (
                                <tr key={enrollment.id}>
                                  <td>{enrollment.name}</td>
                                  {sessionCells}
                                  <td style={{ textAlign: "center", fontWeight: "bold", color: "#047857" }}>{presentCount}</td>
                                  <td style={{ textAlign: "center", fontWeight: "bold", color: "#b91c1c" }}>{absentCount}</td>
                                  <td style={{ textAlign: "center", fontWeight: "bold", color: "#b45309" }}>{lateCount}</td>
                                  <td style={{ textAlign: "center", fontWeight: "bold", color: "#0369a1" }}>{excusedCount}</td>
                                  <td style={{ textAlign: "center", fontWeight: "bold" }}>{formatValue(enrollment.attendanceScore)}</td>
                                </tr>
                              );
                            }

                            const record = attendanceRecordsByEnrollment.get(enrollment.id);
                            const status = String(record?.status ?? "present");

                            return (
                              <tr key={enrollment.id}>
                                <td>{enrollment.name}</td>
                                <td>{enrollment.email}</td>
                                <td>
                                  <select
                                    className={`attendance-select ${getAttendanceStatusClass(status)}`}
                                    disabled={Boolean(attendanceError)}
                                    onChange={(event) =>
                                      void updateAttendanceStatus(enrollment, event.target.value)
                                    }
                                    value={status}
                                  >
                                    {attendanceStatusOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={attendanceMode === "summary" ? 6 + attendanceSessionCount : 4}>Lớp này chưa có học viên ghi danh.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="empty-chart">Chưa có lớp để điểm danh.</p>
              )}
            </article>
          </section>
        )}

        {isAssignmentScoreView && (
          <section className="analytics-grid" aria-label="Điểm bài tập">
            <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>
              <div className="attendance-toolbar" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                  <label style={{ flex: 1 }}>
                    <span>Lớp học</span>
                    <select
                      onChange={(event) => setSelectedAttendanceClassId(event.target.value || null)}
                      value={selectedAttendanceClassId ?? ""}
                    >
                      <option value="">Chọn lớp học</option>
                      {visibleClassItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.classCode} - {item.className}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {assignmentError && <div className="notice error">{assignmentError}</div>}

              {selectedAttendanceClass ? (
                <>
                  <p className="filter-summary">
                    {selectedAttendanceClass.courseName} · {selectedAttendanceClass.teacherName} ·{" "}
                    {selectedAttendanceClass.enrollmentCount} học viên ghi danh
                  </p>
                  <div className="class-table attendance-table" style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Học viên</th>
                          <th>Email</th>
                          {Array.from({ length: assignmentNumberCount }, (_, i) => i + 1).map((num) => (
                            <th key={num} style={{ textAlign: "center", borderLeft: "1px solid var(--border)" }}>Bài {num}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAttendanceClass.enrollments.length ? (
                          selectedAttendanceClass.enrollments.map((enrollment) => {
                            const studentRecords = assignmentRecordsByEnrollment.get(enrollment.id);

                            return (
                              <tr key={enrollment.id}>
                                <td>{enrollment.name}</td>
                                <td>{enrollment.email}</td>
                                {Array.from({ length: assignmentNumberCount }, (_, i) => i + 1).map((num) => {
                                  const record = studentRecords?.get(num);
                                  const currentScore = record?.score ? Number(record.score) : "";

                                  return (
                                    <td key={num} style={{ textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        defaultValue={currentScore}
                                        disabled={Boolean(assignmentError)}
                                        style={{
                                          width: "80px",
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          border: "1px solid var(--border)",
                                          textAlign: "center",
                                        }}
                                        onBlur={(event) => {
                                          const val = event.target.value;
                                          const numVal = Number(val);
                                          if (val && !isNaN(numVal) && numVal !== currentScore) {
                                            void updateAssignmentScore(enrollment, num, val);
                                          }
                                        }}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.currentTarget.blur();
                                          }
                                        }}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={2 + assignmentNumberCount}>Lớp này chưa có học viên ghi danh.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="empty-chart">Chưa có lớp để nhập điểm bài tập.</p>
              )}
            </article>
          </section>
        )}

        {isProjectScoreView && (
          <section className="analytics-grid" aria-label="Điểm đồ án">
            <article className="analytics-card detail-card wide" style={{ paddingTop: "24px" }}>
              <div className="attendance-toolbar" style={{ flexDirection: "column", alignItems: "stretch", marginBottom: "24px" }}>
                <label style={{ maxWidth: "100%" }}>
                  <span>Lớp học</span>
                  <select
                    onChange={(event) => setSelectedAttendanceClassId(event.target.value || null)}
                    value={selectedAttendanceClassId ?? ""}
                  >
                    <option value="">Chọn lớp học</option>
                    {visibleClassItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.classCode} - {item.className}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedAttendanceClass ? (
                <>
                  <p className="filter-summary">
                    {selectedAttendanceClass.courseName} · {selectedAttendanceClass.teacherName} ·{" "}
                    {selectedAttendanceClass.schedule} · {selectedAttendanceClass.studyTime} ·{" "}
                    {selectedAttendanceClass.enrollmentCount} học viên ghi danh
                  </p>
                  <div className="class-table attendance-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Học viên</th>
                          <th>Email</th>
                          <th>Điểm đồ án (Hệ 10)</th>
                          <th>Link đồ án</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAttendanceClass.enrollments.length ? (
                          selectedAttendanceClass.enrollments.map((enrollment) => (
                            <tr key={enrollment.id}>
                              <td>{enrollment.name}</td>
                              <td>{enrollment.email}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  defaultValue={enrollment.projectScore ?? ""}
                                  disabled={Boolean(updatingEnrollmentId === enrollment.id)}
                                  style={{
                                    width: "80px",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                  }}
                                  onBlur={(event) => {
                                    const val = event.target.value;
                                    const numVal = Number(val);
                                    if (val && !isNaN(numVal) && numVal !== enrollment.projectScore) {
                                      void updateEnrollmentProjectField(enrollment.id, "project_score", numVal);
                                    }
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.currentTarget.blur();
                                    }
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  defaultValue={enrollment.projectUrl ?? ""}
                                  disabled={Boolean(updatingEnrollmentId === enrollment.id)}
                                  style={{
                                    width: "100%",
                                    minWidth: "200px",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                  }}
                                  onBlur={(event) => {
                                    const val = event.target.value;
                                    if (val !== enrollment.projectUrl) {
                                      void updateEnrollmentProjectField(enrollment.id, "project_url", val);
                                    }
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.currentTarget.blur();
                                    }
                                  }}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5}>Lớp này chưa có học viên ghi danh.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="empty-chart">Chưa có lớp để nhập điểm đồ án.</p>
              )}
            </article>
          </section>
        )}

        {isAdminsView && (() => {
          const ROLES: { value: UserRole; label: string; desc: string; color: string; bg: string }[] = [
            { value: "admin",     label: "Admin",     desc: "Toàn quyền",  color: "#dc2626", bg: "#fef2f2" },
            { value: "operation", label: "Operation", desc: "Vận hành",    color: "#2563eb", bg: "#eff6ff" },
            { value: "assistant", label: "Assistant", desc: "Trợ lý",      color: "#7c3aed", bg: "#f5f3ff" },
            { value: "teacher",   label: "Teacher",   desc: "Giảng viên",  color: "#059669", bg: "#f0fdf4" },
            { value: "student",   label: "Student",   desc: "Học viên",    color: "#d97706", bg: "#fffbeb" },
          ];
          const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

          return (
            <div style={{ display: "grid", gap: "28px", padding: "4px 0" }}>

              {/* ── Create user card ── */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6366f1" }}>Tài khoản hệ thống</p>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>{adminForm.id ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}</h3>
                  </div>
                </div>

                <form style={{ padding: "20px 24px" }} onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setIsSaving(true); setError(""); setMessage("");
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    
                    if (adminForm.id) {
                      // Update existing user
                      await updateUser(session.access_token, adminForm.id, {
                        email: adminForm.email,
                        username: adminForm.username,
                        role: adminForm.role,
                        password: adminForm.password || undefined
                      });
                      setMessage(`✓ Cập nhật tài khoản "${adminForm.username}" thành công!`);
                    } else {
                      // Create new user
                      await createUser(session.access_token, adminForm.email, adminForm.password, adminForm.username, adminForm.role);
                      setMessage(`✓ Tạo tài khoản "${adminForm.username}" (${adminForm.role}) thành công! Mật khẩu: ${adminForm.password}`);
                    }
                    
                    setAdminForm({ email: "", password: "", username: "", role: "admin", id: "" });
                    await loadAdmins();
                  } catch(err: any) {
                    setError(err.message || "Có lỗi xảy ra");
                  } finally { setIsSaving(false); }
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Username</span>
                      <input
                        type="text" required placeholder="vd: nguyen_van_a"
                        value={adminForm.username}
                        onChange={(e) => setAdminForm(prev => ({...prev, username: e.target.value}))}
                        style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", outline: "none", transition: "border-color 0.2s", color: "var(--foreground)" }}
                      />
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Email đăng nhập</span>
                      <input
                        type="email" required
                        value={adminForm.email}
                        onChange={(e) => setAdminForm(prev => ({...prev, email: e.target.value}))}
                        style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", outline: "none", color: "var(--foreground)" }}
                      />
                    </label>
                  </div>

                  {/* Role selector */}
                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>Vai trò</span>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {ROLES.map(r => (
                        <button
                          key={r.value} type="button"
                          onClick={() => setAdminForm(prev => ({...prev, role: r.value}))}
                          style={{
                            padding: "8px 16px", borderRadius: "99px", border: `2px solid ${adminForm.role === r.value ? r.color : "var(--border)"}`,
                            background: adminForm.role === r.value ? r.bg : "transparent",
                            color: adminForm.role === r.value ? r.color : "var(--text-secondary)",
                            fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                            display: "flex", alignItems: "center", gap: "6px"
                          }}
                        >
                          {adminForm.role === r.value && <span>✓</span>}
                          {r.label}
                          <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.75 }}>— {r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password row */}
                  <div style={{ marginBottom: "20px" }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Mật khẩu</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <input
                          type="text" required={!adminForm.id} minLength={6} placeholder={adminForm.id ? "Để trống nếu không đổi mật khẩu" : "Ít nhất 6 ký tự"}
                          value={adminForm.password}
                          onChange={(e) => setAdminForm(prev => ({...prev, password: e.target.value}))}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--background)", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: adminForm.password ? "monospace" : "inherit", color: "var(--foreground)" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdminForm(prev => ({...prev, password: genPassword()}))}
                        style={{ padding: "10px 18px", borderRadius: "10px", border: "1px dashed var(--border)", background: "var(--surface-soft)", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: "var(--foreground)", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                        Tự tạo
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="submit" disabled={isSaving}
                      style={{ padding: "11px 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1, transition: "opacity 0.2s" }}
                    >
                      {isSaving ? "Đang xử lý..." : adminForm.id ? "Cập nhật tài khoản →" : "Tạo tài khoản →"}
                    </button>
                    {adminForm.id && (
                      <button
                        type="button"
                        onClick={() => setAdminForm({ email: "", password: "", username: "", role: "admin", id: "" })}
                        style={{ padding: "11px 28px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Huỷ chỉnh sửa
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* ── Users list card ── */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0ea5e9" }}>Danh sách</p>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>Người dùng hệ thống <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", background: "var(--surface-soft)", padding: "2px 10px", borderRadius: "99px", marginLeft: "6px" }}>{adminUsers.length}</span></h3>
                    </div>
                  </div>
                  <button onClick={() => void loadAdmins()} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", fontSize: "13px", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                    Làm mới
                  </button>
                </div>

                {adminUsers.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                    {isLoading ? (
                      <span>Đang tải...</span>
                    ) : (
                      <span>Chưa có người dùng nào. Thêm tài khoản đầu tiên bên trên!</span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid" }}>
                    {adminUsers.map((user, idx) => {
                      const roleInfo = roleMap[user.role] || { label: user.role || "—", color: "#64748b", bg: "#f8fafc" };
                      const initials = (user.username || user.email || "?").slice(0, 2).toUpperCase();
                      return (
                        <div
                          key={user.id}
                          style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 24px", borderBottom: idx < adminUsers.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                        >
                          {/* Avatar */}
                          <div style={{ width: 40, height: 40, borderRadius: "10px", background: `linear-gradient(135deg, ${roleInfo.color}22, ${roleInfo.color}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: roleInfo.color, flexShrink: 0 }}>
                            {initials}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                              <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--foreground)" }}>{user.username || "—"}</span>
                              <span style={{ padding: "1px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.color}33` }}>
                                {roleInfo.label}
                              </span>
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                          </div>

                          {/* Meta */}
                          <div style={{ textAlign: "right", flexShrink: 0, display: "grid", gap: "2px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              Tạo: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                            </span>
                            <span style={{ fontSize: "12px", color: user.last_sign_in_at ? "var(--text-secondary)" : "#94a3b8" }}>
                              {user.last_sign_in_at ? `Đăng nhập: ${new Date(user.last_sign_in_at).toLocaleDateString("vi-VN")}` : "Chưa đăng nhập"}
                            </span>
                          </div>

                           {/* Actions */}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-soft)", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}
                              onClick={() => setAdminForm({
                                id: user.id,
                                email: user.email || "",
                                username: user.username || "",
                                role: user.role as UserRole,
                                password: ""
                              })}
                            >
                              Sửa
                            </button>
                            <button
                              style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #fecaca", background: "transparent", fontSize: "12px", fontWeight: 600, color: "#dc2626", cursor: "pointer", whiteSpace: "nowrap" }}
                              onClick={async () => {
                                if (confirm(`Xoá tài khoản "${user.username || user.email}" vĩnh viễn?`)) {
                                  try {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) return;
                                    await deleteUser(session.access_token, user.id);
                                    await loadAdmins();
                                    setMessage("Đã xoá tài khoản thành công.");
                                  } catch(err: any) { setError(err.message); }
                                }
                              }}
                            >
                              Xoá
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {(message || error) && (
          <div className={error ? "notice error" : "notice"} role="status">
            {error || message}
          </div>
        )}

        {isDataView && activeTable === "students" && (
          <section className="student-account-panel">
            <div>
              <p className="eyebrow">Tài khoản học viên</p>
              <h3>Cấp tài khoản student</h3>
              <p>Tạo tài khoản đăng nhập bằng tên và email. Mật khẩu được random 6 ký tự và chỉ hiển thị khi học viên chưa đăng nhập.</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void createStudentLoginAccount(studentAccountForm);
              }}
            >
              <label>
                <span>Tên học viên</span>
                <input
                  onChange={(event) => setStudentAccountForm((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="Nguyễn Văn A"
                  required
                  type="text"
                  value={studentAccountForm.full_name}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  onChange={(event) => setStudentAccountForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="student@email.com"
                  required
                  type="email"
                  value={studentAccountForm.email}
                />
              </label>
              <button className="primary-button" disabled={isSaving} type="submit">
                {isSaving ? "Đang cấp..." : "Cấp tài khoản"}
              </button>
            </form>
          </section>
        )}

        {isDataView && (
        <section className="management-grid">
          <form className="editor" onSubmit={(event) => void saveRow(event)}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{editingRow ? "Chỉnh sửa" : "Tạo mới"}</p>
                <h3>{activeConfig.label}</h3>
              </div>
              {editingRow && (
                <button className="text-button" onClick={resetForm} type="button">
                  Huỷ
                </button>
              )}
            </div>

            <div className="form-grid">
              {activeConfig.fields.map((field) => (
                field.type === "select" && field.optionsKey ? (
                  renderRelationPicker(field)
                ) : (
                <label className={field.type === "textarea" ? "wide-field" : ""} key={field.name}>
                  <span>{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      onChange={(event) => updateFormValue(field.name, event.target.value)}
                      required={field.required}
                      rows={4}
                      value={form[field.name] ?? ""}
                    />
                  ) : field.type === "select" ? (
                    <select
                      onChange={(event) => updateFormValue(field.name, event.target.value)}
                      required={field.required}
                      value={form[field.name] ?? ""}
                    >
                      <option value="">Chọn {field.label.toLowerCase()}</option>
                      {field.options
                        ? field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))
                        : (field.optionsKey ? data[field.optionsKey] : []).map((option) => (
                            <option key={String(option.id)} value={String(option.id)}>
                              {getOptionLabel(field, option)}
                            </option>
                          ))}
                    </select>
                  ) : (
                    <input
                      onChange={(event) => updateFormValue(field.name, event.target.value)}
                      required={field.required}
                      step={field.type === "number" ? "0.01" : undefined}
                      type={field.type}
                      value={form[field.name] ?? ""}
                    />
                  )}
                </label>
                )
              ))}
            </div>

            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Đang lưu..." : editingRow ? "Cập nhật" : "Thêm mới"}
            </button>
          </form>

          <section className="table-panel">
            <div className="section-heading" style={{ flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p className="eyebrow">Dữ liệu</p>
                <h3>Danh sách {activeConfig.label.toLowerCase()}</h3>
              </div>
              <div className="table-controls">
                {activeTable === "class_sessions" && (
                  <select
                    className="search-input"
                    onChange={(e) => setClassSessionsFilterId(e.target.value)}
                    value={classSessionsFilterId ?? ""}
                  >
                    {data.classes.map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {String(c.class_name)} ({String(c.class_code)})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  aria-label="Tìm kiếm"
                  className="search-input"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm..."
                  type="search"
                  value={search}
                />
                <label className="page-size-control">
                  <span>Hiển thị</span>
                  <select
                    aria-label="Số dòng mỗi trang"
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    value={pageSize}
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="pagination-summary">
              <span>
                {filteredRows.length
                  ? `Hiển thị ${paginationStart}-${paginationEnd} trên ${filteredRows.length} ${activeConfig.label.toLowerCase()}`
                  : `0 ${activeConfig.label.toLowerCase()}`}
              </span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {activeConfig.columns.map((column) => (
                      <th key={column}>{formatLabel(column)}</th>
                    ))}
                    {activeTable === "students" && <th>Tài khoản</th>}
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={activeConfig.columns.length + (activeTable === "students" ? 2 : 1)}>Đang tải dữ liệu...</td>
                    </tr>
                  ) : paginatedRows.length ? (
                    paginatedRows.map((row) => (
                      <tr key={String(row.id)}>
                        {activeConfig.columns.map((column) => {
                          if (column === "time_range") {
                            const formatTime = (timeStr: unknown) => {
                              if (typeof timeStr !== "string" || !timeStr) return "";
                              const parts = timeStr.split(":");
                              if (parts.length < 2) return timeStr;
                              let hour = parseInt(parts[0], 10);
                              const ampm = hour >= 12 ? "PM" : "AM";
                              hour = hour % 12;
                              hour = hour ? hour : 12;
                              return `${hour.toString().padStart(2, "0")}:${parts[1]} ${ampm}`;
                            };
                            const s = formatTime(row.start_time);
                            const e = formatTime(row.end_time);
                            return <td key={column}>{s && e ? `${s} - ${e}` : s || e || "-"}</td>;
                          }
                          if (column === "session_title") {
                            return (
                              <td key={column}>
                                <button className="text-button" onClick={() => setSelectedSessionDetail(row)} style={{ padding: 0, fontWeight: 500, textAlign: "left", whiteSpace: "normal" }}>
                                  {resolveReference(column, row[column])}
                                </button>
                              </td>
                            );
                          }
                          return <td key={column}>{resolveReference(column, row[column])}</td>;
                        })}
                        {activeTable === "students" && (() => {
                          const email = String(row.email ?? "").toLowerCase();
                          const account = studentAccountByEmail.get(email);
                          const hasLoggedIn = Boolean(account?.last_sign_in_at);

                          return (
                            <td>
                              <div className="student-account-cell">
                                {account ? (
                                  <>
                                    <span className={hasLoggedIn ? "account-badge active" : "account-badge pending"}>
                                      {hasLoggedIn ? "Đã đăng nhập" : "Chưa đăng nhập"}
                                    </span>
                                    {!hasLoggedIn && account.initial_password && (
                                      <code>{account.initial_password}</code>
                                    )}
                                    <button
                                      className="secondary-button compact-button"
                                      disabled={isSaving}
                                      onClick={() => void resetStudentLoginPassword(String(account.id), String(account.email ?? email))}
                                      type="button"
                                    >
                                      Reset
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="secondary-button compact-button"
                                    disabled={isSaving || !email}
                                    onClick={() => void createStudentLoginAccount({
                                      email,
                                      full_name: String(row.full_name ?? ""),
                                      student_id: String(row.id),
                                    })}
                                    type="button"
                                  >
                                    Cấp tài khoản
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })()}
                        <td>
                          <div className="row-actions">
                            <button onClick={() => startEdit(row)} type="button">
                              Sửa
                            </button>
                            <button onClick={() => void deleteRow(row)} type="button">
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeConfig.columns.length + (activeTable === "students" ? 2 : 1)}>
                        {data[activeTable].length
                          ? `Không tìm thấy ${activeConfig.label.toLowerCase()} phù hợp với từ khoá "${search.trim()}".`
                          : "Chưa có dữ liệu cho bảng này."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination-bar" aria-label="Phân trang" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
                <span>Hiển thị:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none", cursor: "pointer", fontSize: "14px" }}
                >
                  <option value={20}>20 dòng</option>
                  <option value={50}>50 dòng</option>
                  <option value={100}>100 dòng</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                className="secondary-button compact-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                type="button"
              >
                Đầu
              </button>
              <button
                className="secondary-button compact-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                Trước
              </button>
              <span>
                Trang {currentPage}/{totalPages}
              </span>
              <button
                className="secondary-button compact-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                Sau
              </button>
              <button
                className="secondary-button compact-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                type="button"
              >
                Cuối
              </button>
              </div>
            </div>
          </section>
        </section>
        )}

        {/* ── Assign Assistant Modal ── */}
        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", padding: "0" }}>
              {/* Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6366f1" }}>Phân công lớp</p>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>
                    Trợ giảng của lớp — {analytics.classItems.find(c => c.id === showAssignModal)?.className ?? ""}
                  </h3>
                </div>
                <button onClick={() => setShowAssignModal(null)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1 }}>×</button>
              </div>

              {/* Current assistants */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-secondary)" }}>Đang phân công ({classAssistants.length})</p>
                {classAssistants.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>Chưa có trợ giảng nào được phân công.</p>
                ) : (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {classAssistants.map((a: any) => {
                      const assistantUser = adminUsers.find((user) => (user.profile_id ?? user.id) === a.assistant_id);

                      return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: "14px" }}>{assistantUser?.username || "—"}</span>
                          <span style={{ marginLeft: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>{assistantUser?.email || a.assistant_id}</span>
                        </div>
                        <button
                          style={{ padding: "4px 12px", borderRadius: "8px", border: "1px solid #fecaca", background: "transparent", color: "#dc2626", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                          onClick={async () => {
                            try {
                              await removeAssistantFromClass(showAssignModal, a.assistant_id);
                              const list = await loadClassAssistants(showAssignModal);
                              setClassAssistants(list);
                              setAssistantAssignmentsByClass((current) => ({ ...current, [showAssignModal]: list }));
                            } catch (err: any) { setError(err.message); }
                          }}
                        >Xoá</button>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add assistant */}
              <div style={{ padding: "16px 24px 20px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-secondary)" }}>Thêm trợ giảng</p>
                <div style={{ display: "grid", gap: "8px" }}>
                  {adminUsers.filter(u => u.role === "assistant" && !classAssistants.some((a: any) => a.assistant_id === (u.profile_id ?? u.id))).map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{u.username || "—"}</span>
                        <span style={{ marginLeft: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>{u.email}</span>
                      </div>
                      <button
                        style={{ padding: "4px 14px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        onClick={async () => {
                          try {
                            await assignAssistantToClass(showAssignModal, u.profile_id ?? u.id);
                            const list = await loadClassAssistants(showAssignModal);
                            setClassAssistants(list);
                            setAssistantAssignmentsByClass((current) => ({ ...current, [showAssignModal]: list }));
                          } catch (err: any) { setError(err.message); }
                        }}
                      >Phân công</button>
                    </div>
                  ))}
                  {adminUsers.filter(u => u.role === "assistant").length === 0 ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Chưa có tài khoản nào có vai trò Assistant. Tạo tài khoản trong mục Hệ thống → Quản trị viên.</p>
                  ) : adminUsers.filter(u => u.role === "assistant" && !classAssistants.some((a: any) => a.assistant_id === (u.profile_id ?? u.id))).length === 0 && (
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Tất cả assistant hiện có đã được phân công vào lớp này.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSessionDetail && (
          <div className="modal-overlay" onClick={() => setSelectedSessionDetail(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", padding: "24px" }}>
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>{String(selectedSessionDetail.session_title)}</h2>
                <button className="icon-button" onClick={() => setSelectedSessionDetail(null)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer", padding: "4px" }}>×</button>
              </div>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Buổi số</label>
                    <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{String(selectedSessionDetail.session_number || "-")}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ngày học</label>
                    <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{selectedSessionDetail.session_date ? new Intl.DateTimeFormat("vi-VN").format(new Date(String(selectedSessionDetail.session_date))) : "-"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Giờ bắt đầu</label>
                    <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{String(selectedSessionDetail.start_time || "-")}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Giờ kết thúc</label>
                    <p style={{ marginTop: 4, fontWeight: 500, fontSize: "16px" }}>{String(selectedSessionDetail.end_time || "-")}</p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedSessionDetail.meeting_url && (
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Link học online</label>
                      <p style={{ marginTop: 4 }}><a href={String(selectedSessionDetail.meeting_url)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>{String(selectedSessionDetail.meeting_url)}</a></p>
                    </div>
                  )}
                  {selectedSessionDetail.recording_url && (
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Link video xem lại</label>
                      <p style={{ marginTop: 4 }}><a href={String(selectedSessionDetail.recording_url)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>{String(selectedSessionDetail.recording_url)}</a></p>
                    </div>
                  )}
                  {selectedSessionDetail.slide_url && (
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Link slide</label>
                      <p style={{ marginTop: 4 }}><a href={String(selectedSessionDetail.slide_url)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>{String(selectedSessionDetail.slide_url)}</a></p>
                    </div>
                  )}
                  {selectedSessionDetail.reference_url && (
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tài liệu tham khảo</label>
                      <p style={{ marginTop: 4 }}><a href={String(selectedSessionDetail.reference_url)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>{String(selectedSessionDetail.reference_url)}</a></p>
                    </div>
                  )}
                  {selectedSessionDetail.assignment_url && (
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Link bài tập</label>
                      <p style={{ marginTop: 4 }}><a href={String(selectedSessionDetail.assignment_url)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>{String(selectedSessionDetail.assignment_url)}</a></p>
                    </div>
                  )}
                  {selectedSessionDetail.note && (
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ghi chú</label>
                      <p style={{ marginTop: 4, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{String(selectedSessionDetail.note)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
                <button className="primary-button" onClick={() => startEdit(selectedSessionDetail)}>Chỉnh sửa</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
