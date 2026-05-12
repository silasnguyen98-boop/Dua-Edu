import { storageKeys, tableConfigs } from "./constants";
import type { FieldConfig, FormState, Row, SidebarGroup, TableName, ViewName } from "./types";

export const formatLabel = (value: string) => {
  const mapping: Record<string, string> = {
    student_name: "Họ tên",
    student_email: "Email",
    certificate_type: "Loại",
    certificate_code: "Mã chứng chỉ",
    status: "Trạng thái",
    issued_at: "Ngày cấp",
    class_name: "Tên lớp",
    class_code: "Mã lớp",
    course_id: "Khóa học",
    teacher_id: "Giảng viên",
    enrollment_id: "ID Ghi danh",
    full_name: "Họ tên",
    course_type: "Loại khóa",
    start_date: "Ngày bắt đầu",
    total_sessions: "Số buổi",
    study_time: "Giờ học",
    schedule: "Lịch học",
  };
  if (mapping[value]) return mapping[value];
  
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatValue = (value: Row[string]) => {
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

export const buildEmptyForm = (fields: FieldConfig[]) =>
  fields.reduce<FormState>((form, field) => {
    form[field.name] = "";
    return form;
  }, {});

export const toInputValue = (field: FieldConfig, value: Row[string]) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (field.type === "datetime-local" && typeof value === "string") {
    return value.slice(0, 16);
  }

  return String(value);
};

export const getImportColumnName = (field: FieldConfig) => field.importKey ?? field.name;

export const isTableName = (value: string | null): value is TableName =>
  tableConfigs.some((config) => config.name === value);

export const isViewName = (value: string | null): value is ViewName =>
  value === "dashboard" ||
  value === "classDashboard" ||
  value === "classManagement" ||
  value === "classDetail" ||
  value === "assistantAssignments" ||
  value === "attendance" ||
  value === "assignmentScore" ||
  value === "projectScore" ||
  value === "admins" ||
  isTableName(value);

export const getInitialView = () => {
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

export const getInitialSearch = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const searchFromUrl = new URLSearchParams(window.location.search).get("q");
  return searchFromUrl ?? "";
};

export const getInitialClassId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    new URLSearchParams(window.location.search).get("classId") ??
    window.localStorage.getItem(storageKeys.classId)
  );
};

export const getInitialSession = () => {
  if (typeof window === "undefined") {
    return 1;
  }
  const val = Number(
    new URLSearchParams(window.location.search).get("session") ?? window.localStorage.getItem(storageKeys.session),
  );
  return Number.isFinite(val) && val > 0 ? val : 1;
};

export const getInitialAttendanceMode = (): "session" | "summary" => {
  if (typeof window === "undefined") {
    return "session";
  }
  const val =
    new URLSearchParams(window.location.search).get("mode") ?? window.localStorage.getItem(storageKeys.attendanceMode);
  return val === "summary" ? "summary" : "session";
};

export const getSidebarGroupForView = (view: ViewName): SidebarGroup => {
  if (view === "dashboard") return "overview";
  if (
    view === "classDashboard" ||
    view === "classManagement" ||
    view === "classDetail" ||
    view === "assistantAssignments" ||
    view === "classes" ||
    view === "class_sessions"
  ) {
    return "academic";
  }
  if (
    view === "students" ||
    view === "enrollments" ||
    view === "attendance" ||
    view === "assignmentScore" ||
    view === "projectScore" ||
    view === "certificates"
  ) {
    return "extendedData";
  }
  if (view === "courses" || view === "teachers") return "coreData";
  return "system";
};

export const isAssistantAllowedView = (view: ViewName) =>
  view === "classManagement" ||
  view === "classDashboard" ||
  view === "classDetail" ||
  view === "attendance" ||
  view === "assignmentScore" ||
  view === "projectScore" ||
  view === "students" ||
  view === "class_sessions";
