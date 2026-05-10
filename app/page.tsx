"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type FieldType = "text" | "email" | "number" | "datetime-local" | "textarea" | "select";

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
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
    columns: ["full_name", "email", "phone", "current_job", "previous_job", "created_at"],
    searchFields: ["full_name", "email", "phone", "current_job"],
    fields: [
      { name: "full_name", label: "Họ tên", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
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
    columns: ["name", "course_type", "note", "created_at"],
    searchFields: ["name", "course_type"],
    fields: [
      { name: "name", label: "Tên khoá học", type: "text", required: true },
      { name: "course_type", label: "Loại khoá", type: "text" },
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

export default function Home() {
  const [activeTable, setActiveTable] = useState<TableName>("students");
  const [data, setData] = useState<DataState>(emptyData);
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(tableConfigs[0].fields));
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setSearch("");
    setMessage("");
    setError("");
  }, [activeConfig]);

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

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Dua-Edu</p>
          <h1>Quản trị đào tạo</h1>
        </div>

        <nav className="nav-tabs" aria-label="Bảng dữ liệu">
          {tableConfigs.map((config) => (
            <button
              className={config.name === activeTable ? "active" : ""}
              key={config.name}
              onClick={() => setActiveTable(config.name)}
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
            <p className="eyebrow">Dashboard</p>
            <h2>{activeConfig.label}</h2>
            <p>{activeConfig.description}</p>
          </div>
          <button className="secondary-button" onClick={() => void loadAllTables()} type="button">
            Làm mới
          </button>
        </header>

        <section className="stats-grid" aria-label="Tổng quan">
          {stats.map((item) => (
            <article className="stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        {(message || error) && (
          <div className={error ? "notice error" : "notice"} role="status">
            {error || message}
          </div>
        )}

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
                      {(field.optionsKey ? data[field.optionsKey] : []).map((option) => (
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
      </section>
    </main>
  );
}
