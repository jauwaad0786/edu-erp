// src/pages/SubjectsPage.jsx

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import toast from "react-hot-toast";

const SUBJECT_TYPES = ["Theory", "Practical", "Both"];
const SUBJECT_STATUS = ["Active", "Pending"];

export default function SubjectsPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    class_id: "",
    teacher_id: "",
    type: "Theory",
    credits: "",
    weekly_periods: "",
    description: "",
    status: "Active",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [classRes, teacherRes, subjectRes] = await Promise.all([
        api.get("/principal/classes"),
        api.get("/principal/teachers"),
        api.get("/principal/subjects"),
      ]);

      setClasses(classRes.data || []);
      setTeachers(teacherRes.data || []);
      setSubjects(subjectRes.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function set(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.code || !form.class_id) {
      toast.error("Required fields missing");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/principal/subjects", form);

      toast.success("Subject created successfully");

      setSubjects((prev) => [res.data, ...prev]);

      setForm({
        name: "",
        code: "",
        class_id: "",
        teacher_id: "",
        type: "Theory",
        credits: "",
        weekly_periods: "",
        description: "",
        status: "Active",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Subject create nahi hua"
      );
    }

    setLoading(false);
  }

  function getClassName(id) {
    const found = classes.find((c) => c.id === id);
    return found ? `${found.name} - ${found.section}` : "-";
  }

  function getTeacherName(id) {
    const found = teachers.find((t) => t.id === id);
    return found ? found.name : "-";
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-content">
        <Navbar title="Subjects Management" />

        <div className="page-body">

          {/* PAGE HEADER */}
          <div className="page-header">
            <div>
              <h2 className="page-title">📚 Subjects Management</h2>

              <p className="page-subtitle">
                Create and manage academic subjects professionally
              </p>
            </div>
          </div>

          {/* ANALYTICS CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <AnalyticsCard
              title="Total Subjects"
              value={subjects.length}
              icon="📘"
              color="#0176d3"
            />

            <AnalyticsCard
              title="Classes Covered"
              value={classes.length}
              icon="🏫"
              color="#7c3aed"
            />

            <AnalyticsCard
              title="Teachers Assigned"
              value={
                subjects.filter((s) => s.teacher_id).length
              }
              icon="👨‍🏫"
              color="#059669"
            />

            <AnalyticsCard
              title="Pending Subjects"
              value={
                subjects.filter(
                  (s) => s.status === "Pending"
                ).length
              }
              icon="⏳"
              color="#ea580c"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "420px 1fr",
              gap: 24,
              alignItems: "start",
            }}
          >

            {/* LEFT FORM */}
            <div className="card">

              <div className="card-header">
                <h4>➕ Create Subject</h4>
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  className="card-body"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >

                  {/* Subject Name */}
                  <div className="form-group">
                    <label className="form-label">
                      Subject Name *
                    </label>

                    <input
                      className="form-input"
                      placeholder="e.g. Mathematics"
                      value={form.name}
                      onChange={(e) =>
                        set("name", e.target.value)
                      }
                    />
                  </div>

                  {/* Subject Code */}
                  <div className="form-group">
                    <label className="form-label">
                      Subject Code *
                    </label>

                    <input
                      className="form-input"
                      placeholder="e.g. MATH101"
                      value={form.code}
                      onChange={(e) =>
                        set("code", e.target.value)
                      }
                    />
                  </div>

                  {/* Class */}
                  <div className="form-group">
                    <label className="form-label">
                      Assign Class *
                    </label>

                    <select
                      className="form-select"
                      value={form.class_id}
                      onChange={(e) =>
                        set("class_id", e.target.value)
                      }
                    >
                      <option value="">
                        -- Select Class --
                      </option>

                      {classes.map((cls) => (
                        <option
                          key={cls.id}
                          value={cls.id}
                        >
                          {cls.name} - {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div className="form-group">
                    <label className="form-label">
                      Assign Teacher
                    </label>

                    <select
                      className="form-select"
                      value={form.teacher_id}
                      onChange={(e) =>
                        set("teacher_id", e.target.value)
                      }
                    >
                      <option value="">
                        -- Select Teacher --
                      </option>

                      {teachers.map((teacher) => (
                        <option
                          key={teacher.id}
                          value={teacher.id}
                        >
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TYPE */}
                  <div className="form-group">
                    <label className="form-label">
                      Subject Type
                    </label>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      {SUBJECT_TYPES.map((type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => set("type", type)}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: 8,
                            border:
                              form.type === type
                                ? "2px solid #0176d3"
                                : "1px solid #e2e8f0",
                            background:
                              form.type === type
                                ? "#e8f4fd"
                                : "#fff",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* credits */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">
                        Credits
                      </label>

                      <input
                        type="number"
                        className="form-input"
                        placeholder="4"
                        value={form.credits}
                        onChange={(e) =>
                          set("credits", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Weekly Periods
                      </label>

                      <input
                        type="number"
                        className="form-input"
                        placeholder="5"
                        value={form.weekly_periods}
                        onChange={(e) =>
                          set(
                            "weekly_periods",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* description */}
                  <div className="form-group">
                    <label className="form-label">
                      Description
                    </label>

                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="Subject details..."
                      value={form.description}
                      onChange={(e) =>
                        set(
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* status */}
                  <div className="form-group">
                    <label className="form-label">
                      Status
                    </label>

                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) =>
                        set("status", e.target.value)
                      }
                    >
                      {SUBJECT_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div
                  className="modal-footer"
                  style={{
                    padding: 20,
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: 12,
                    }}
                  >
                    {loading
                      ? "⏳ Creating..."
                      : "📚 Create Subject"}
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT TABLE */}
            <div className="card">

              <div className="card-header">
                <h4>📖 Subject Directory</h4>
              </div>

              <div
                className="card-body"
                style={{ padding: 0 }}
              >

                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Code</th>
                      <th>Class</th>
                      <th>Teacher</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {subjects.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            padding: 40,
                            color: "#94a3b8",
                          }}
                        >
                          No subjects created yet
                        </td>
                      </tr>
                    )}

                    {subjects.map((subject) => (
                      <tr key={subject.id}>

                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            {subject.name}
                          </div>
                        </td>

                        <td>{subject.code}</td>

                        <td>
                          {getClassName(
                            subject.class_id
                          )}
                        </td>

                        <td>
                          {getTeacherName(
                            subject.teacher_id
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              background:
                                subject.status ===
                                "Active"
                                  ? "#dcfce7"
                                  : "#fef3c7",
                              color:
                                subject.status ===
                                "Active"
                                  ? "#166534"
                                  : "#92400e",
                              padding:
                                "4px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {subject.status}
                          </span>
                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ANALYTICS CARD */

function AnalyticsCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
