import React, { useEffect, useState } from "react";
import { adminRequest } from "./api";

function ClassroomsAdmin() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", teacher_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    Promise.all([adminRequest("/admin/classrooms"), adminRequest("/admin/teachers")])
      .then(([classroomData, teacherData]) => {
        setClassrooms(classroomData);
        setTeachers(teacherData);
      })
      .catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(classroom) {
    setEditingId(classroom.id);
    setForm({ name: classroom.name || "", teacher_id: classroom.teacher?.id || classroom.teacher_id || "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await adminRequest(editingId ? `/admin/classrooms/${editingId}` : "/admin/classrooms", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setMessage(editingId ? "班级已更新" : "班级已创建");
      setEditingId(null);
      setForm({ name: "", teacher_id: "" });
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/classrooms/${id}`, { method: "DELETE" });
      setMessage("班级已删除");
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">班级管理</h1>
      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-3" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="name" placeholder="班级名称" value={form.name} onChange={handleChange} required />
        <select className="rounded border p-2" name="teacher_id" value={form.teacher_id} onChange={handleChange}>
          <option value="">暂不分配教师</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>{teacher.career_name} - {teacher.first_name} {teacher.last_name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "新增"}</button>
          {editingId ? <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm({ name: "", teacher_id: "" }); }}>取消</button> : null}
        </div>
      </form>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {classrooms.map((classroom) => (
          <div key={classroom.id} className="rounded-md bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{classroom.name}</h2>
            <p className="mt-2 text-sm text-gray-500">教师：{classroom.teacher?.career_name || "未分配"}</p>
            <p className="text-sm text-gray-500">学生：{classroom.students?.length || 0}</p>
            <div className="mt-4 flex gap-2">
              <button className="rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(classroom)}>编辑</button>
              <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(classroom.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClassroomsAdmin;
