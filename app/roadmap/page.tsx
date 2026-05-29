"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Course = {
  id: string;
  course_code: string | null;
  name: string;
};

type Roadmap = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  courses?: Course | null;
};

type Step = {
  id: string;
  roadmap_id: string;
  parent_step_id: string | null;
  order_index: number;
  step_type: "module" | "lesson" | "assignment" | "milestone";
  title: string;
  description: string | null;
  prerequisites: string[];
  resource_url: string | null;
  assignment_id: string | null;
  estimated_hours: number | null;
  duration_days: number | null;
  due_offset_days: number | null;
  is_required: boolean;
};

const STEP_TYPES: Step["step_type"][] = [
  "module",
  "lesson",
  "assignment",
  "milestone",
];

const TYPE_COLOR: Record<Step["step_type"], string> = {
  module: "#6366f1",
  lesson: "#10b981",
  assignment: "#f59e0b",
  milestone: "#ef4444",
};

export default function RoadmapPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(
    null,
  );
  const [steps, setSteps] = useState<Step[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create-roadmap form
  const [newCourseId, setNewCourseId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Create-step form
  const [stepDraft, setStepDraft] = useState<Partial<Step>>({
    step_type: "lesson",
    is_required: true,
  });

  const selectedRoadmap = useMemo(
    () => roadmaps.find((r) => r.id === selectedRoadmapId) ?? null,
    [roadmaps, selectedRoadmapId],
  );

  useEffect(() => {
    void loadCourses();
    void loadRoadmaps();
  }, []);

  useEffect(() => {
    if (selectedRoadmapId) {
      void loadSteps(selectedRoadmapId);
    } else {
      setSteps([]);
    }
  }, [selectedRoadmapId]);

  async function loadCourses() {
    const { data, error: e } = await supabase
      .from("courses")
      .select("id, course_code, name")
      .order("name", { ascending: true });
    if (e) {
      setError(e.message);
      return;
    }
    setCourses((data ?? []) as Course[]);
  }

  async function loadRoadmaps() {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/roadmap");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Load failed");
      setRoadmaps(json.roadmaps as Roadmap[]);
      if (!selectedRoadmapId && json.roadmaps?.[0]?.id) {
        setSelectedRoadmapId(json.roadmaps[0].id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadSteps(roadmapId: string) {
    setLoadingSteps(true);
    setError(null);
    try {
      const res = await fetch(`/api/roadmap/${roadmapId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Load failed");
      setSteps((json.steps ?? []) as Step[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSteps(false);
    }
  }

  async function createRoadmap(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourseId || !newTitle.trim()) return;
    setError(null);
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: newCourseId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Create failed");
      return;
    }
    setNewCourseId("");
    setNewTitle("");
    setNewDescription("");
    await loadRoadmaps();
    setSelectedRoadmapId(json.roadmap.id);
  }

  async function deleteRoadmap(id: string) {
    if (!confirm("Xoá roadmap này? Tất cả step bên trong cũng bị xoá.")) return;
    const res = await fetch(`/api/roadmap/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Delete failed");
      return;
    }
    if (selectedRoadmapId === id) setSelectedRoadmapId(null);
    await loadRoadmaps();
  }

  async function toggleActive(r: Roadmap) {
    const res = await fetch(`/api/roadmap/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !r.is_active }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Update failed");
      return;
    }
    await loadRoadmaps();
  }

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoadmapId || !stepDraft.title?.trim()) return;
    setError(null);
    const body: Record<string, unknown> = {
      title: stepDraft.title.trim(),
      step_type: stepDraft.step_type ?? "lesson",
      description: stepDraft.description ?? null,
      order_index: stepDraft.order_index ?? steps.length,
      resource_url: stepDraft.resource_url ?? null,
      estimated_hours: stepDraft.estimated_hours ?? null,
      duration_days: stepDraft.duration_days ?? null,
      due_offset_days: stepDraft.due_offset_days ?? null,
      is_required: stepDraft.is_required ?? true,
    };
    const res = await fetch(`/api/roadmap/${selectedRoadmapId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Add step failed");
      return;
    }
    setStepDraft({ step_type: "lesson", is_required: true });
    await loadSteps(selectedRoadmapId);
  }

  async function deleteStep(stepId: string) {
    if (!confirm("Xoá step này?")) return;
    const res = await fetch(`/api/roadmap/steps/${stepId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Delete failed");
      return;
    }
    if (selectedRoadmapId) await loadSteps(selectedRoadmapId);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: "#1e293b",
        padding: "32px 24px 80px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap"
        rel="stylesheet"
      />

      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <Link href="/admin" style={{ color: "#64748b", fontSize: 13 }}>
            ← Admin
          </Link>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              margin: "6px 0 0",
              color: "#0f172a",
            }}
          >
            Lộ trình học theo khóa
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
            Quản lý roadmap và các bước học (modules / lessons / assignments /
            milestones).
          </p>
        </div>
      </header>

      {error && (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto 16px",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left: list + create */}
        <section
          style={{
            background: "white",
            borderRadius: 20,
            padding: 20,
            border: "1px solid #f1f5f9",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>
            Tạo roadmap mới
          </h2>
          <form
            onSubmit={createRoadmap}
            style={{ display: "grid", gap: 10, marginBottom: 20 }}
          >
            <select
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">— Chọn khóa học —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code ? `[${c.course_code}] ` : ""}
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Tiêu đề roadmap"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={inputStyle}
            />
            <textarea
              placeholder="Mô tả (tuỳ chọn)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <button type="submit" style={primaryBtn}>
              + Tạo roadmap
            </button>
          </form>

          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>
            Danh sách ({roadmaps.length})
          </h2>
          {loadingList ? (
            <div style={{ color: "#64748b" }}>Đang tải...</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {roadmaps.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoadmapId(r.id)}
                  style={{
                    textAlign: "left",
                    background:
                      r.id === selectedRoadmapId ? "#ecfdf5" : "white",
                    border: `1px solid ${
                      r.id === selectedRoadmapId ? "#10b98155" : "#e2e8f0"
                    }`,
                    borderRadius: 14,
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>{r.title}</strong>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: r.is_active ? "#dcfce7" : "#f1f5f9",
                        color: r.is_active ? "#15803d" : "#64748b",
                      }}
                    >
                      v{r.version} {r.is_active ? "· active" : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {r.courses?.course_code
                      ? `[${r.courses.course_code}] `
                      : ""}
                    {r.courses?.name ?? r.course_id}
                  </div>
                </button>
              ))}
              {roadmaps.length === 0 && (
                <div style={{ color: "#94a3b8", fontSize: 14 }}>
                  Chưa có roadmap nào.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: detail */}
        <section
          style={{
            background: "white",
            borderRadius: 20,
            padding: 24,
            border: "1px solid #f1f5f9",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)",
            minHeight: 400,
          }}
        >
          {!selectedRoadmap ? (
            <div style={{ color: "#94a3b8", padding: "60px 0", textAlign: "center" }}>
              Chọn hoặc tạo một roadmap để bắt đầu.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#10b981", fontWeight: 800 }}>
                    {selectedRoadmap.courses?.name ?? "KHÓA HỌC"}
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: "4px 0" }}>
                    {selectedRoadmap.title}
                  </h2>
                  {selectedRoadmap.description && (
                    <p style={{ color: "#64748b", margin: 0 }}>
                      {selectedRoadmap.description}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => toggleActive(selectedRoadmap)}
                    style={secondaryBtn}
                  >
                    {selectedRoadmap.is_active ? "Tắt active" : "Đặt active"}
                  </button>
                  <button
                    onClick={() => deleteRoadmap(selectedRoadmap.id)}
                    style={{ ...secondaryBtn, color: "#b91c1c" }}
                  >
                    Xoá
                  </button>
                </div>
              </div>

              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#475569",
                  margin: "20px 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Các bước ({steps.length})
              </h3>

              {loadingSteps ? (
                <div style={{ color: "#64748b" }}>Đang tải...</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {steps.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        border: "1px solid #f1f5f9",
                        borderRadius: 14,
                        padding: "12px 16px",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: `${TYPE_COLOR[s.step_type]}22`,
                          color: TYPE_COLOR[s.step_type],
                          fontSize: 12,
                          fontWeight: 800,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>{s.title}</strong>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 100,
                              background: `${TYPE_COLOR[s.step_type]}11`,
                              color: TYPE_COLOR[s.step_type],
                              textTransform: "uppercase",
                            }}
                          >
                            {s.step_type}
                          </span>
                          {!s.is_required && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "#94a3b8",
                                fontWeight: 700,
                              }}
                            >
                              tuỳ chọn
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#475569",
                              marginTop: 4,
                            }}
                          >
                            {s.description}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {s.estimated_hours != null && (
                            <span>⏱ {s.estimated_hours}h</span>
                          )}
                          {s.duration_days != null && (
                            <span>📅 {s.duration_days} ngày</span>
                          )}
                          {s.due_offset_days != null && (
                            <span>⏰ deadline +{s.due_offset_days}d</span>
                          )}
                          {s.resource_url && (
                            <a
                              href={s.resource_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#10b981",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              🔗 tài nguyên
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStep(s.id)}
                        style={{
                          ...secondaryBtn,
                          color: "#b91c1c",
                          padding: "6px 10px",
                          fontSize: 12,
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  ))}
                  {steps.length === 0 && (
                    <div style={{ color: "#94a3b8", fontSize: 14 }}>
                      Chưa có bước nào.
                    </div>
                  )}
                </div>
              )}

              {/* Add step form */}
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#475569",
                  margin: "24px 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Thêm step
              </h3>
              <form
                onSubmit={addStep}
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <input
                  placeholder="Tiêu đề step *"
                  value={stepDraft.title ?? ""}
                  onChange={(e) =>
                    setStepDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  required
                  style={{ ...inputStyle, gridColumn: "1 / -1" }}
                />
                <textarea
                  placeholder="Mô tả"
                  value={stepDraft.description ?? ""}
                  onChange={(e) =>
                    setStepDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  rows={2}
                  style={{
                    ...inputStyle,
                    gridColumn: "1 / -1",
                    resize: "vertical",
                  }}
                />
                <select
                  value={stepDraft.step_type ?? "lesson"}
                  onChange={(e) =>
                    setStepDraft((d) => ({
                      ...d,
                      step_type: e.target.value as Step["step_type"],
                    }))
                  }
                  style={inputStyle}
                >
                  {STEP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  placeholder="Resource URL"
                  value={stepDraft.resource_url ?? ""}
                  onChange={(e) =>
                    setStepDraft((d) => ({
                      ...d,
                      resource_url: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Estimated hours"
                  value={stepDraft.estimated_hours ?? ""}
                  onChange={(e) =>
                    setStepDraft((d) => ({
                      ...d,
                      estimated_hours:
                        e.target.value === ""
                          ? null
                          : Number(e.target.value),
                    }))
                  }
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Duration (days)"
                  value={stepDraft.duration_days ?? ""}
                  onChange={(e) =>
                    setStepDraft((d) => ({
                      ...d,
                      duration_days:
                        e.target.value === ""
                          ? null
                          : Number(e.target.value),
                    }))
                  }
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Due offset (days)"
                  value={stepDraft.due_offset_days ?? ""}
                  onChange={(e) =>
                    setStepDraft((d) => ({
                      ...d,
                      due_offset_days:
                        e.target.value === ""
                          ? null
                          : Number(e.target.value),
                    }))
                  }
                  style={inputStyle}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: "#475569",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={stepDraft.is_required ?? true}
                    onChange={(e) =>
                      setStepDraft((d) => ({
                        ...d,
                        is_required: e.target.checked,
                      }))
                    }
                  />
                  Bắt buộc
                </label>
                <button
                  type="submit"
                  style={{ ...primaryBtn, gridColumn: "1 / -1" }}
                >
                  + Thêm step
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  color: "#0f172a",
  background: "white",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 16px",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 12px",
  background: "white",
  color: "#475569",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
