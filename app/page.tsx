"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";

type FieldType = "text" | "email" | "number" | "datetime-local" | "textarea" | "select";

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
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
type ViewName = "dashboard" | TableName;

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
type ChartItem = {
  color: string;
  id: string;
  label: string;
  percent: number;
  value: number;
};

const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";
const storageKeys = {
  search: "dua-edu-admin-search",
  scrollY: "dua-edu-admin-scroll-y",
  view: "dua-edu-admin-view",
};
const courseTypeOptions = [
  { label: "Offline", value: "offline" },
  { label: "Online", value: "online" },
  { label: "E-learning", value: "elearning" },
  { label: "Tự học", value: "self_study" },
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
    columns: ["class_name", "class_code", "course_id", "teacher_id", "created_at"],
    searchFields: ["class_name", "class_code"],
    fields: [
      {
        name: "course_id",
        label: "Khoá học",
        type: "select",
        required: true,
        optionsKey: "courses",
        optionLabel: "name",
      },
      {
        name: "teacher_id",
        label: "Giảng viên",
        type: "select",
        required: true,
        optionsKey: "teachers",
        optionLabel: "full_name",
      },
      { name: "class_name", label: "Tên lớp", type: "text", required: true },
      { name: "class_code", label: "Mã lớp", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "enrollments",
    label: "Ghi danh",
    description: "Quản lý học viên trong lớp và điểm số.",
    columns: ["student_id", "class_id", "status", "final_score", "project_url", "created_at"],
    searchFields: ["status", "project_url", "grade_note"],
    fields: [
      {
        name: "student_id",
        label: "Học viên",
        type: "select",
        required: true,
        optionsKey: "students",
        optionLabel: "full_name",
      },
      {
        name: "class_id",
        label: "Lớp học",
        type: "select",
        required: true,
        optionsKey: "classes",
        optionLabel: "class_name",
      },
      { name: "status", label: "Trạng thái", type: "text", required: true },
      { name: "attendance_score", label: "Điểm chuyên cần", type: "number" },
      { name: "assignment_score", label: "Điểm bài tập", type: "number" },
      { name: "project_score", label: "Điểm project", type: "number" },
      { name: "final_score", label: "Điểm cuối", type: "number" },
      { name: "project_url", label: "Project URL", type: "text" },
      { name: "grade_note", label: "Nhận xét điểm", type: "textarea" },
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

const isTableName = (value: string | null): value is TableName =>
  tableConfigs.some((config) => config.name === value);

const isViewName = (value: string | null): value is ViewName =>
  value === "dashboard" || isTableName(value);

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

export default function Home() {
  const [activeView, setActiveView] = useState<ViewName>(getInitialView);
  const [data, setData] = useState<DataState>(emptyData);
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(tableConfigs[0].fields));
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showReturningDetails, setShowReturningDetails] = useState(false);
  const [search, setSearch] = useState(getInitialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTable: TableName = isTableName(activeView) ? activeView : "students";
  const isDashboardView = activeView === "dashboard";

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
              createdAt: enrollment.created_at ? String(enrollment.created_at) : "",
              email: String(student?.email ?? "-"),
              id: String(enrollment.id ?? ""),
              name: String(student?.full_name ?? String(enrollment.student_id ?? "-")),
              phone: String(student?.phone ?? "-"),
              status: String(enrollment.status ?? "-"),
            };
          }),
          id: classId,
          teacherName: String(teacher?.full_name ?? "-"),
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
    setMessage("");
    setError("");
  }, [activeConfig]);

  useEffect(() => {
    if (!isDashboardView) {
      setSelectedClassId(null);
      setShowReturningDetails(false);
    }
  }, [isDashboardView]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.view, activeView);
    window.localStorage.setItem(storageKeys.search, search);

    const url = new URL(window.location.href);
    url.searchParams.set("view", activeView);
    url.searchParams.delete("table");

    if (!isDashboardView && search.trim()) {
      url.searchParams.set("q", search.trim());
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState(null, "", url);
  }, [activeView, isDashboardView, search]);

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
    }

    setIsLoading(false);
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
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingRow(null);
    setForm(buildEmptyForm(activeConfig.fields));
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

    return String(value).trim();
  }

  function buildExcelRows(rows: Row[]) {
    const exportColumns = [
      "id",
      ...activeConfig.fields.map((field) => field.name),
      "created_at",
    ];

    return rows.map((row) =>
      exportColumns.reduce<Record<string, string | number>>((excelRow, column) => {
        const value = row[column];
        excelRow[column] = value === null || value === undefined ? "" : String(value);
        return excelRow;
      }, {}),
    );
  }

  function downloadWorkbook(filename: string, rows: Record<string, string | number>[]) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeConfig.name);
    XLSX.writeFile(workbook, filename);
  }

  function getTemplateValue(field: FieldConfig) {
    if (field.type === "number") {
      return 0;
    }

    if (field.type === "datetime-local") {
      return "2026-05-10T09:00";
    }

    if (field.optionsKey) {
      return "paste_uuid_here";
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
    const fieldNames = activeConfig.fields.map((field) => field.name);

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
        key: field.name,
        width: Math.max(18, field.label.length + 8, field.name.length + 6),
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
            record[field.name] = normalizeImportValue(field, row[field.name]);
            return record;
          }, {}),
        )
        .filter((row) => Object.values(row).some((value) => value !== null && value !== ""));

      if (!payload.length) {
        throw new Error("File Excel không có dòng dữ liệu hợp lệ.");
      }

      const importData = await skipDuplicateStudentEmails(payload);

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
    setIsSaving(true);
    setError("");
    setMessage("");

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

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <img alt="Dua-Edu" className="brand-logo" src={logoUrl} />
          <div>
            <p className="eyebrow">Dua-Edu</p>
            <h1>Quản trị đào tạo</h1>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Bảng dữ liệu">
          <button
            className={isDashboardView ? "active" : ""}
            onClick={() => setActiveView("dashboard")}
            type="button"
          >
            <span>Dashboard</span>
            <strong>{data.enrollments.length}</strong>
          </button>
          {tableConfigs.map((config) => (
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
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isDashboardView ? "Tổng quan" : "Quản trị dữ liệu"}</p>
            <h2>{isDashboardView ? "Dashboard" : activeConfig.label}</h2>
            <p>
              {isDashboardView
                ? "Theo dõi ghi danh theo khoá học, giảng viên, sĩ số lớp và tỉ lệ quay lại."
                : activeConfig.description}
            </p>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" onClick={() => void loadAllTables()} type="button">
              Làm mới
            </button>
            {!isDashboardView && (
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

        <section className="stats-grid" aria-label="Tổng quan">
          {stats.map((item) => (
            <article className="stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

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

            <article className="analytics-card class-size-card wide">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Quản lý lớp</p>
                  <h3>Học viên từng lớp và sĩ số</h3>
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
                      <th>Danh sách</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.classItems.length ? (
                      analytics.classItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.className}</td>
                          <td>{item.classCode}</td>
                          <td>{item.courseName}</td>
                          <td>{item.teacherName}</td>
                          <td>
                            <strong>{item.enrollmentCount}</strong>
                          </td>
                          <td>
                            <button
                              className="secondary-button compact-button"
                              onClick={() =>
                                setSelectedClassId((current) =>
                                  current === item.id ? null : item.id,
                                )
                              }
                              type="button"
                            >
                              {selectedClassId === item.id ? "Ẩn" : "Xem"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>Chưa có dữ liệu lớp hoặc ghi danh.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            {selectedClass && (
              <article className="analytics-card detail-card wide">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Danh sách ghi danh</p>
                    <h3>{selectedClass.className}</h3>
                    <p>
                      {selectedClass.courseName} · {selectedClass.teacherName} · Sĩ số{" "}
                      {selectedClass.enrollmentCount}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setSelectedClassId(null)}
                    type="button"
                  >
                    Đóng
                  </button>
                </div>
                <div className="class-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Học viên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Trạng thái</th>
                        <th>Ngày ghi danh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.enrollments.length ? (
                        selectedClass.enrollments.map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td>{enrollment.name}</td>
                            <td>{enrollment.email}</td>
                            <td>{enrollment.phone}</td>
                            <td>{enrollment.status}</td>
                            <td>{formatValue(enrollment.createdAt)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>Lớp này chưa có ghi danh.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            )}
          </section>
        )}

        {(message || error) && (
          <div className={error ? "notice error" : "notice"} role="status">
            {error || message}
          </div>
        )}

        {!isDashboardView && (
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
