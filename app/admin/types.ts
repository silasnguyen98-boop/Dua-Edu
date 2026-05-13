import React from "react";
export type UserRole = "admin" | "operation" | "assistant" | "teacher" | "student";

export type AdminUser = {
  id: string;
  profile_id?: string;
  email?: string;
  initial_password?: string;
  student_id?: string;
  username: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
};

export type FieldType = "text" | "email" | "number" | "date" | "time" | "datetime-local" | "textarea" | "select";

export type FieldConfig = {
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

export type TableName =
  | "students"
  | "teachers"
  | "courses"
  | "classes"
  | "enrollments"
  | "certificates"
  | "class_sessions";

export type ViewName =
  | "dashboard"
  | "classDashboard"
  | "classManagement"
  | "classDetail"
  | "assistantAssignments"
  | "attendance"
  | "assignmentScore"
  | "projectScore"
  | "admins"
  | TableName;

export type SidebarGroup = "overview" | "academic" | "coreData" | "extendedData" | "system" | null;

export type TableConfig = {
  name: TableName;
  label: string;
  description: string;
  fields: FieldConfig[];
  columns: string[];
  searchFields: string[];
};

export type Row = Record<string, string | number | null>;
export type DataState = Record<TableName, Row[]>;
export type FormState = Record<string, string>;
export type AttendanceRecord = Row;
export type AssignmentRecord = Row;

export type ClassAssistant = {
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

export type ChartItem = {
  color: string;
  id: string;
  label: string;
  percent: number;
  value: number;
};

export interface UseAdminReturn {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  openSidebarGroup: SidebarGroup;
  setOpenSidebarGroup: React.Dispatch<React.SetStateAction<SidebarGroup>>;
  data: DataState;
  setData: React.Dispatch<React.SetStateAction<DataState>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  attendanceError: string;
  setAttendanceError: React.Dispatch<React.SetStateAction<string>>;
  assignmentRecords: AssignmentRecord[];
  setAssignmentRecords: React.Dispatch<React.SetStateAction<AssignmentRecord[]>>;
  assignmentError: string;
  setAssignmentError: React.Dispatch<React.SetStateAction<string>>;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editingRow: Row | null;
  setEditingRow: React.Dispatch<React.SetStateAction<Row | null>>;
  selectedClassId: string | null;
  setSelectedClassId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAttendanceClassId: string | null;
  setSelectedAttendanceClassId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAttendanceSession: number;
  setSelectedAttendanceSession: React.Dispatch<React.SetStateAction<number>>;
  attendanceMode: "session" | "summary";
  setAttendanceMode: React.Dispatch<React.SetStateAction<"session" | "summary">>;
  relationQueries: Record<string, string>;
  setRelationQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openRelationPicker: string | null;
  setOpenRelationPicker: React.Dispatch<React.SetStateAction<string | null>>;
  updatingEnrollmentId: string | null;
  setUpdatingEnrollmentId: React.Dispatch<React.SetStateAction<string | null>>;
  updatingCertificateEnrollmentId: string | null;
  setUpdatingCertificateEnrollmentId: React.Dispatch<React.SetStateAction<string | null>>;
  classStatusFilter: string;
  setClassStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  classDetailSortField: string;
  setClassDetailSortField: React.Dispatch<React.SetStateAction<string>>;
  classDetailSortDir: "asc" | "desc";
  setClassDetailSortDir: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  classSessionsFilterId: string | null;
  setClassSessionsFilterId: React.Dispatch<React.SetStateAction<string | null>>;
  assistantAssignmentSearch: string;
  setAssistantAssignmentSearch: React.Dispatch<React.SetStateAction<string>>;
  assistantAssignmentsByClass: Record<string, any[]>;
  setAssistantAssignmentsByClass: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isAuthenticated: boolean | null;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
  selectedSessionDetail: Row | null;
  setSelectedSessionDetail: React.Dispatch<React.SetStateAction<Row | null>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  activeTable: TableName;
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  adminForm: any;
  setAdminForm: React.Dispatch<React.SetStateAction<any>>;
  currentUserRole: UserRole | null;
  setCurrentUserRole: React.Dispatch<React.SetStateAction<UserRole | null>>;
  currentAccount: any;
  setCurrentAccount: React.Dispatch<React.SetStateAction<any>>;
  accountTab: "staff" | "student";
  setAccountTab: React.Dispatch<React.SetStateAction<"staff" | "student">>;
  classDashboardMode: "session" | "overall";
  setClassDashboardMode: React.Dispatch<React.SetStateAction<"session" | "overall">>;
  segmentCriteria: "attendance" | "assignment" | "project";
  setSegmentCriteria: React.Dispatch<React.SetStateAction<"attendance" | "assignment" | "project">>;
  selectedStudentForDetail: Row | null;
  setSelectedStudentForDetail: React.Dispatch<React.SetStateAction<Row | null>>;
  assignedClassIds: string[];
  setAssignedClassIds: React.Dispatch<React.SetStateAction<string[]>>;
  classAssistants: ClassAssistant[];
  setClassAssistants: React.Dispatch<React.SetStateAction<ClassAssistant[]>>;
  showAssignModal: string | null;
  setShowAssignModal: React.Dispatch<React.SetStateAction<string | null>>;
  showCertGuide: boolean;
  setShowCertGuide: React.Dispatch<React.SetStateAction<boolean>>;
  showAttendanceGuide: boolean;
  setShowAttendanceGuide: React.Dispatch<React.SetStateAction<boolean>>;
  activeConfig: TableConfig;
  visibleClassItems: any[];
  stats: any;
  analytics: any;
  selectedClass: any;
  selectedAttendanceClass: any;
  attendanceSessionCount: number;
  classDashboardMetrics: any;
  selectedClassEnrollments: any[];
  assistantAssignmentClassItems: any[];
  assistantUserByProfileId: Map<string, AdminUser>;
  assignedAssistantTotal: number;
  loadAdmins: () => Promise<void>;
  loadAllTables: () => Promise<void>;
  loadClassAssistants: (classId: string) => Promise<ClassAssistant[]>;
  assignAssistantToClass: (classId: string, assistantId: string) => Promise<void>;
  removeAssistantFromClass: (assignmentId: string) => Promise<void>;
  loadAssistantAssignmentOverview: () => Promise<void>;
  isAssistantUser: boolean;
  isAdminView: boolean;
  router: any;
  updateFormValue: (name: string, value: string) => void;
  saveRow: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  deleteRow: (row: Row) => Promise<void>;
  startEdit: (row: Row) => void;
  startEditClass: (row: Row) => void;
  resetForm: () => void;
  importExcel: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  downloadTemplate: () => Promise<void>;
  exportData: () => void;
  updateEnrollmentStatus: (enrollmentId: string, status: string) => Promise<void>;
  updateCertificateStatus: (enrollmentId: string, status: string) => Promise<void>;
  updateAttendance: (enrollmentId: string, session: number, status: string) => Promise<void>;
  updateProjectScore: (enrollmentId: string, session: number, score: string) => Promise<void>;
  updateAssignmentScore: (enrollmentId: string, session: number, score: string) => Promise<void>;
  syncCertificates: (targetId?: string, targetType?: "class" | "student") => Promise<void>;
  createStudentLoginAccount: (form: any) => Promise<void>;
  resetStudentLoginPassword: (authUserId: string, email: string) => Promise<void>;
  totalPages: number;
  paginatedRows: Row[];
  filteredRows: Row[];
  getOptionLabel: (field: FieldConfig, option: any) => string;
  getFieldValue: (row: Row, field: any) => any;
  getScoreClass: (score: any) => string;
  getRelationLabel: (field: FieldConfig, row: any) => string;
  genPassword: () => string;
  createUser: (token: string, email: string, pass: string, user: string, role: string) => Promise<void>;
  updateUser: (token: string, id: string, data: any) => Promise<void>;
  deleteUser: (token: string, id: string) => Promise<void>;
  supabase: any;
  isDataView: boolean;
  isClassDetailView: boolean;
  isAssistantAssignmentsView: boolean;
  pageEyebrow: string;
  pageTitle: string;
  pageDescription: string;
  roleLabels: Record<string, string>;
  onLogout: () => Promise<void>;
  formatValue: (value: Row[string]) => string;
  formatLabel: (value: string) => string;
  tableConfigs: TableConfig[];
  certificateStatusOptions: any[];
  attendanceRecordsByEnrollment: Map<string, AttendanceRecord>;
  assignmentRecordsByEnrollment: Map<string, Record<number, AssignmentRecord>>;
}
