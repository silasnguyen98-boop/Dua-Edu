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
