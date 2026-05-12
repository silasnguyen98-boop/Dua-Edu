"use client";

import React from "react";
import type { FieldConfig, Row } from "../types";

interface RelationPickerProps {
  field: FieldConfig;
  form: Record<string, any>;
  updateFormValue: (name: string, value: string) => void;
  data: Record<string, Row[]>;
  relationQueries: Record<string, string>;
  setRelationQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openRelationPicker: string | null;
  setOpenRelationPicker: (key: string | null) => void;
  getRelationLabel: (field: FieldConfig, row: Row) => string;
  activeTable: string;
}

export const RelationPicker: React.FC<RelationPickerProps> = ({
  field,
  form,
  updateFormValue,
  data,
  relationQueries,
  setRelationQueries,
  openRelationPicker,
  setOpenRelationPicker,
  getRelationLabel,
  activeTable,
}) => {
  const pickerKey = `${activeTable}.${field.name}`;
  const isOpen = openRelationPicker === pickerKey;
  const query = relationQueries[pickerKey] ?? "";
  
  const options = React.useMemo(() => {
    if (!field.optionsKey) return [];
    const rows = data[field.optionsKey] || [];
    const q = query.toLowerCase().trim();
    if (!q) return rows.slice(0, 50);
    return rows.filter(row => getRelationLabel(field, row).toLowerCase().includes(q)).slice(0, 50);
  }, [field, data, query, getRelationLabel]);

  const selectedId = form[field.name];
  const selectedRow = React.useMemo(() => {
    if (!selectedId || !field.optionsKey) return null;
    return data[field.optionsKey]?.find(r => String(r.id) === String(selectedId)) || null;
  }, [selectedId, field, data]);

  return (
    <div className="relation-picker-container" key={field.name}>
      <label>
        <span>{field.label}</span>
        <div className="relation-input-wrapper">
          <input
            readOnly
            onClick={() => setOpenRelationPicker(isOpen ? null : pickerKey)}
            placeholder={`Chọn ${field.label.toLowerCase()}...`}
            required={field.required}
            type="text"
            value={selectedRow ? getRelationLabel(field, selectedRow) : ""}
            className="relation-input-trigger"
          />
          {selectedId && (
            <button
              className="clear-relation"
              onClick={(e) => {
                e.stopPropagation();
                updateFormValue(field.name, "");
              }}
              type="button"
            >
              ×
            </button>
          )}
        </div>
      </label>

      {isOpen && (
        <div className="relation-dropdown">
          <div className="relation-search">
            <input
              autoFocus
              onChange={(e) => setRelationQueries(prev => ({ ...prev, [pickerKey]: e.target.value }))}
              placeholder="Tìm kiếm nhanh..."
              type="text"
              value={query}
            />
          </div>
          <div className="relation-options">
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  className={`relation-option ${String(option.id) === String(selectedId) ? "selected" : ""}`}
                  key={String(option.id)}
                  onClick={() => {
                    updateFormValue(field.name, String(option.id));
                    setOpenRelationPicker(null);
                  }}
                >
                  {getRelationLabel(field, option)}
                </div>
              ))
            ) : (
              <div className="relation-no-results">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
