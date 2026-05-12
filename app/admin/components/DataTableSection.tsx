"use client";

import React from "react";
import { RelationPicker } from "./RelationPicker";
import { formatLabel } from "../helpers";

interface DataTableSectionProps {
  activeTable: string;
  isAssistantUser: boolean;
  activeConfig: any;
  editingRow: any;
  resetForm: () => void;
  form: any;
  updateFormValue: (key: string, val: any) => void;
  data: any;
  getOptionLabel: (field: any, option: any) => string;
  saveRow: (e: React.FormEvent) => void;
  classSessionsFilterId: string | null;
  setClassSessionsFilterId: (id: string | null) => void;
  search: string;
  setSearch: (val: string) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  currentPage: number;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
  totalPages: number;
  isSaving: boolean;
  startEdit: (row: any) => void;
  deleteRow: (row: any) => Promise<void>;
  setSelectedStudentForDetail: (row: any) => void;
  getFieldValue: (row: any, field: any) => any;
  getScoreClass: (score: any) => string;
  relationQueries: Record<string, string>;
  setRelationQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openRelationPicker: string | null;
  setOpenRelationPicker: (key: string | null) => void;
  getRelationLabel: (field: any, row: any) => string;
}

export const DataTableSection: React.FC<DataTableSectionProps & { 
  studentAccountForm: any;
  setStudentAccountForm: (val: any) => void;
  createStudentLoginAccount: (form: any) => Promise<void>;
}> = ({
  activeTable,
  isAssistantUser,
  activeConfig,
  editingRow,
  resetForm,
  form,
  updateFormValue,
  data,
  getOptionLabel,
  saveRow,
  classSessionsFilterId,
  setClassSessionsFilterId,
  search,
  setSearch,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
  isSaving,
  startEdit,
  deleteRow,
  setSelectedStudentForDetail,
  getFieldValue,
  getScoreClass,
  studentAccountForm,
  setStudentAccountForm,
  createStudentLoginAccount,
  relationQueries,
  setRelationQueries,
  openRelationPicker,
  setOpenRelationPicker,
  getRelationLabel,
}) => {
  const columns = React.useMemo(
    () =>
      (activeConfig.columns ?? []).map((column: any) =>
        typeof column === "string" ? { key: column, label: formatLabel(column) } : column,
      ),
    [activeConfig.columns],
  );

  const paginatedData = React.useMemo(() => {
    let filtered = data[activeTable] || [];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((row: any) =>
        Object.values(row).some(
          (val) => val && String(val).toLowerCase().includes(q)
        )
      );
    }
    if (activeTable === "class_sessions" && classSessionsFilterId) {
      filtered = filtered.filter((row: any) => String(row.class_id) === classSessionsFilterId);
    }
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [data, activeTable, search, classSessionsFilterId, currentPage, pageSize]);

  return (
    <>
      {activeTable === "students" && !isAssistantUser && (
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
                onChange={(event) => setStudentAccountForm((current: any) => ({ ...current, full_name: event.target.value }))}
                placeholder="Nguyễn Văn A"
                required
                type="text"
                value={studentAccountForm.full_name}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                onChange={(event) => setStudentAccountForm((current: any) => ({ ...current, email: event.target.value }))}
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

      <section className={(isAssistantUser && activeTable === "students") || activeTable === "certificates" ? "full-width-panel" : "management-grid"}>
        {!(isAssistantUser && activeTable === "students") && activeTable !== "certificates" && (
          <form className="editor" onSubmit={saveRow}>
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
              {activeConfig.fields.map((field: any) => (
                field.type === "select" && field.optionsKey ? (
                  <RelationPicker
                    activeTable={activeTable}
                    data={data}
                    field={field}
                    form={form}
                    getRelationLabel={getRelationLabel}
                    key={field.name}
                    openRelationPicker={openRelationPicker}
                    relationQueries={relationQueries}
                    setOpenRelationPicker={setOpenRelationPicker}
                    setRelationQueries={setRelationQueries}
                    updateFormValue={updateFormValue}
                  />
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
                          ? field.options.map((option: any) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))
                          : (field.optionsKey ? data[field.optionsKey] : []).map((option: any) => (
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
        )}

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
                  <option value="">Tất cả lớp</option>
                  {data.classes.map((c: any) => (
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
            </div>
          </div>

          <div className="class-table">
            <table>
              <thead>
                <tr>
                  {columns.map((column: any) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length ? (
                  paginatedData.map((row: any) => (
                    <tr className={editingRow?.id === row.id ? "editing" : ""} key={row.id}>
                      {columns.map((column: any) => (
                        <td className={column.key === "score" || column.key === "project_score" || column.key === "attendance_score" || column.key === "assignment_score" ? getScoreClass(row[column.key]) : ""} key={column.key}>
                          {getFieldValue(row, column)}
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          {activeTable === "students" && (
                            <button
                              className="secondary-button compact-button"
                              onClick={() => setSelectedStudentForDetail(row)}
                              type="button"
                            >
                              Chi tiết
                            </button>
                          )}
                          {activeTable === "certificates" ? (
                            <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>Tự động</span>
                          ) : !(isAssistantUser && activeTable === "students") ? (
                            <>
                              <button onClick={() => startEdit(row)} type="button">
                                Sửa
                              </button>
                              <button onClick={() => void deleteRow(row)} type="button">
                                Xoá
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Chỉ xem</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1}>
                      {data[activeTable].length
                        ? `Không tìm thấy ${activeConfig.label.toLowerCase()} phù hợp.`
                        : "Chưa có dữ liệu."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
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
                onClick={() => setCurrentPage((page: number) => Math.max(1, page - 1))}
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
                onClick={() => setCurrentPage((page: number) => Math.min(totalPages, page + 1))}
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
    </>
  );
};
