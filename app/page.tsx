"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";

type FieldType = "text" | "email" | "number" | "date" | "datetime-local" | "textarea" | "select";

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
  | "certificates";
type ViewName = "dashboard" | "classManagement" | "classDetail" | "attendance" | "assignmentScore" | "projectScore" | TableName;

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
  { label: "Chờ xử lý", value: "pending" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Tạm dừng", value: "paused" },
  { label: "Đã huỷ", value: "cancelled" },
];
const attendanceStatusOptions = [
  { label: "Có mặt", value: "present" },
  { label: "Vắng", value: "absent" },
  { label: "Đi muộn", value: "late" },
  { label: "Có phép", value: "excused" },
];
const chartColors = ["#059669", "#22c55e", "#14b8a6", "#84cc16", "#0f766e", "#65a30d"];

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
];

const emptyData: DataState = {
  students: [],
  teachers: [],
  courses: [],
  classes: [],
  enrollments: [],
  certificates: [],
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
  value === "attendance" ||
  value === "assignmentScore" ||
  value === "projectScore" ||
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
  return searchFromUrl ?? window.localStorage.getItem(storageKeys.search) ?? "";
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

export default function Home() {
  const [activeView, setActiveView] = useState<ViewName>(getInitialView);
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
  const [classManagementSearch, setClassManagementSearch] = useState("");
  const [search, setSearch] = useState(getInitialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTable: TableName = isTableName(activeView) ? activeView : "students";
  const isDashboardView = activeView === "dashboard";
  const isClassManagementView = activeView === "classManagement";
  const isClassDetailView = activeView === "classDetail";
  const isAttendanceView = activeView === "attendance";
  const isAssignmentScoreView = activeView === "assignmentScore";
  const isProjectScoreView = activeView === "projectScore";
  const isDataView = isTableName(activeView);

  const activeConfig = useMemo(
    () => tableConfigs.find((config) => config.name === activeTable) ?? tableConfigs[0],
    [activeTable],
  );

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

  const selectedClass = useMemo(
    () => analytics.classItems.find((item) => item.id === selectedClassId) ?? null,
    [analytics.classItems, selectedClassId],
  );

  const selectedAttendanceClass = useMemo(
    () => analytics.classItems.find((item) => item.id === selectedAttendanceClassId) ?? null,
    [analytics.classItems, selectedAttendanceClassId],
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
    const rows = data[activeTable];
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
  }, [activeConfig.searchFields, activeTable, data, search]);

  useEffect(() => {
    void loadAllTables();
  }, []);

  useEffect(() => {
    setEditingRow(null);
    setForm(buildEmptyForm(activeConfig.fields));
    setRelationQueries({});
    setOpenRelationPicker(null);
    setMessage("");
    setError("");
  }, [activeConfig]);

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
    if (!isAttendanceView || selectedAttendanceClassId || !analytics.classItems.length) {
      return;
    }

    setSelectedAttendanceClassId(analytics.classItems[0].id);
  }, [analytics.classItems, isAttendanceView, selectedAttendanceClassId]);

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
    setIsLoading(true);
    setError("");

    const entries = await Promise.all(
      tableConfigs.map(async (config) => {
        const { data: rows, error: tableError } = await supabase
          .from(config.name)
          .select("*")
          .order("created_at", { ascending: false });

        if (tableError) {
          throw new Error(`${config.label}: ${tableError.message}`);
        }

        return [config.name, rows ?? []] as const;
      }),
    ).catch((loadError: Error) => {
      setError(loadError.message);
      return null;
    });

    if (entries) {
      setData(Object.fromEntries(entries) as DataState);
      await loadAttendanceRecords();
      await loadAssignmentRecords();
    }

    setIsLoading(false);
  }

  async function loadAttendanceRecords() {
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

    setAttendanceRecords(rows ?? []);
  }

  async function loadAssignmentRecords() {
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

    setAssignmentRecords(rows ?? []);
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
    setForm(buildEmptyForm(activeConfig.fields));
    setRelationQueries({});
    setOpenRelationPicker(null);
    setMessage("");
    setError("");
  }

  function buildPayload() {
    return activeConfig.fields.reduce<Record<string, string | number | null>>((payload, field) => {
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

  async function skipDuplicateStudentEmails(
    payload: Record<string, string | number | null>[],
  ) {
    if (activeTable !== "students") {
      return { duplicateCount: 0, payload };
    }

    const seenEmails = new Set<string>();
    let duplicateCount = 0;
    const uniqueRows = payload.filter((row) => {
      const email = String(row.email ?? "").trim().toLowerCase();

      if (!email) {
        return true;
      }

      if (seenEmails.has(email)) {
        duplicateCount += 1;
        return false;
      }

      seenEmails.add(email);
      return true;
    });
    const emails = Array.from(seenEmails);

    if (!emails.length) {
      return { duplicateCount, payload: uniqueRows };
    }

    const { data: existingStudents, error: emailCheckError } = await supabase
      .from("students")
      .select("email")
      .in("email", emails);

    if (emailCheckError) {
      throw new Error(emailCheckError.message);
    }

    const existingEmails = new Set(
      (existingStudents ?? []).map((student) => String(student.email ?? "").trim().toLowerCase()),
    );
    const filteredPayload = uniqueRows.filter((row) => {
      const email = String(row.email ?? "").trim().toLowerCase();

      if (email && existingEmails.has(email)) {
        duplicateCount += 1;
        return false;
      }

      return true;
    });

    return { duplicateCount, payload: filteredPayload };
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

      const resolvedPayload = await resolveImportReferences(payload);
      const importData = await skipDuplicateStudentEmails(resolvedPayload);

      if (!importData.payload.length) {
        setMessage(
          importData.duplicateCount
            ? `Không có dòng mới để import. Đã bỏ qua ${importData.duplicateCount} email trùng.`
            : "Không có dòng mới để import.",
        );
        return;
      }

      const { error: importError } = await supabase.from(activeTable).insert(importData.payload);

      if (importError) {
        throw new Error(importError.message);
      }

      setMessage(
        `Đã import ${importData.payload.length} dòng vào ${activeConfig.label}.` +
          (importData.duplicateCount
            ? ` Đã bỏ qua ${importData.duplicateCount} email trùng.`
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
    setActiveView("classDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openClassManagement() {
    setClassStatusFilter("all");
    setActiveView("classManagement");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAttendanceView() {
    setSelectedAttendanceClassId((current) => current ?? analytics.classItems[0]?.id ?? null);
    setActiveView("attendance");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      await loadAttendanceRecords();
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
      await loadAssignmentRecords();
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
    : isClassManagementView || isClassDetailView
      ? "Học vụ"
      : isAttendanceView
        ? "Học vụ"
        : isProjectScoreView || isAssignmentScoreView
          ? "Học vụ"
          : "Quản trị dữ liệu";
  const pageTitle = isDashboardView
    ? "Dashboard"
    : isClassManagementView
      ? "Quản lý lớp"
      : isClassDetailView
        ? selectedClass?.className ?? "Chi tiết lớp"
        : isAttendanceView
          ? "Điểm danh"
          : isAssignmentScoreView
            ? "Điểm bài tập"
            : isProjectScoreView
              ? "Điểm đồ án"
              : activeConfig.label;
  const pageDescription = isDashboardView
    ? "Theo dõi ghi danh theo khoá học, giảng viên và tỉ lệ quay lại."
    : isClassManagementView
      ? "Theo dõi sĩ số từng lớp và mở trang riêng để xem danh sách ghi danh."
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
              : activeConfig.description;

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <img alt="Dua-Edu" className="brand-logo" src={logoUrl} />
          <div>
            <h1>Quản trị đào tạo</h1>
          </div>
        </div>

        <div className="nav-group">
          <p className="eyebrow">Tổng quan</p>
          <nav className="nav-tabs" aria-label="Tổng quan">
            <button
              className={isDashboardView ? "active" : ""}
              onClick={() => setActiveView("dashboard")}
              type="button"
            >
              <span>Dashboard</span>
              <strong>{data.enrollments.length}</strong>
            </button>
          </nav>
        </div>

        <div className="nav-group">
          <p className="eyebrow">Học vụ</p>
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
              className={isAttendanceView ? "active" : ""}
              onClick={openAttendanceView}
              type="button"
            >
              <span>Điểm danh</span>
              <strong>{data.classes.length}</strong>
            </button>
            <button
              className={isAssignmentScoreView ? "active" : ""}
              onClick={() => setActiveView("assignmentScore")}
              type="button"
            >
              <span>Điểm bài tập</span>
            </button>
            <button
              className={isProjectScoreView ? "active" : ""}
              onClick={() => setActiveView("projectScore")}
              type="button"
            >
              <span>Điểm đồ án</span>
            </button>
          </nav>
        </div>

        <div className="nav-group">
          <p className="eyebrow">Dữ liệu lõi</p>
          <nav className="nav-tabs" aria-label="Dữ liệu hệ thống">
            {tableConfigs.filter(c => ["courses", "classes", "teachers", "students"].includes(c.name)).map((config) => (
              <button
                className={config.name === activeView ? "active" : ""}
                key={config.name}
                onClick={() => setActiveView(config.name)}
                type="button"
              >
                <span>{config.label}</span>
                <strong>{data[config.name].length}</strong>
              </button>
            ))}
          </nav>
        </div>

        <div className="nav-group">
          <p className="eyebrow">Mở rộng</p>
          <nav className="nav-tabs" aria-label="Dữ liệu mở rộng">
            {tableConfigs.filter(c => ["enrollments", "certificates"].includes(c.name)).map((config) => (
              <button
                className={config.name === activeView ? "active" : ""}
                key={config.name}
                onClick={() => setActiveView(config.name)}
                type="button"
              >
                <span>{config.label}</span>
                <strong>{data[config.name].length}</strong>
              </button>
            ))}
          </nav>
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
            <button className="secondary-button" onClick={() => void loadAllTables()} type="button">
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
                      ? analytics.classItems.filter((item) =>
                          item.className.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                          item.classCode.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                          item.courseName.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                          item.teacherName.toLowerCase().includes(classManagementSearch.toLowerCase())
                        )
                      : analytics.classItems
                    ).length ? (
                      (classManagementSearch
                        ? analytics.classItems.filter((item) =>
                            item.className.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                            item.classCode.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                            item.courseName.toLowerCase().includes(classManagementSearch.toLowerCase()) ||
                            item.teacherName.toLowerCase().includes(classManagementSearch.toLowerCase())
                          )
                        : analytics.classItems
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
                        <td colSpan={10}>Chưa có dữ liệu lớp hoặc ghi danh.</td>
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
                    {analytics.classItems.map((item) => (
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
                      {analytics.classItems.map((item) => (
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
                    {analytics.classItems.map((item) => (
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

        {(message || error) && (
          <div className={error ? "notice error" : "notice"} role="status">
            {error || message}
          </div>
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
            <div className="section-heading">
              <div>
                <p className="eyebrow">Dữ liệu</p>
                <h3>Danh sách {activeConfig.label.toLowerCase()}</h3>
              </div>
              <input
                aria-label="Tìm kiếm"
                className="search-input"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm..."
                type="search"
                value={search}
              />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {activeConfig.columns.map((column) => (
                      <th key={column}>{formatLabel(column)}</th>
                    ))}
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={activeConfig.columns.length + 1}>Đang tải dữ liệu...</td>
                    </tr>
                  ) : filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={String(row.id)}>
                        {activeConfig.columns.map((column) => (
                          <td key={column}>{resolveReference(column, row[column])}</td>
                        ))}
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
                      <td colSpan={activeConfig.columns.length + 1}>
                        Chưa có dữ liệu cho bảng này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
        )}
      </section>
    </main>
  );
}
