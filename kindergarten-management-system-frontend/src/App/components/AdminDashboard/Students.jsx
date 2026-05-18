import React, { useEffect, useState } from "react";
import { adminRequest, fullName } from "./api";

const emptyStudent = { first_name: "", second_name: "", surname: "", admission_number: "", age: "", description: "", classroom_id: "" };

function StudentsAdmin() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState(emptyStudent);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    Promise.all([adminRequest("/admin/students"), adminRequest("/admin/classrooms")])
      .then(([studentData, classroomData]) => {
        setStudents(studentData);
        setClassrooms(classroomData);
      })
      .catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(student) {
    setEditingId(student.id);
    setForm({
      first_name: student.first_name || "",
      second_name: student.second_name || "",
      surname: student.surname || "",
      admission_number: student.admission_number || "",
      age: student.age || "",
      description: student.description || "",
      classroom_id: student.classroom?.id || student.classroom_id || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await adminRequest(editingId ? `/admin/students/${editingId}` : "/admin/students", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setMessage(editingId ? "学生信息已更新" : "学生已创建");
      setEditingId(null);
      setForm(emptyStudent);
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/students/${id}`, { method: "DELETE" });
      setMessage("学生已删除");
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">学生管理</h1>
      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="first_name" placeholder="名" value={form.first_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="second_name" placeholder="第二名" value={form.second_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="surname" placeholder="姓" value={form.surname} onChange={handleChange} required />
        <input className="rounded border p-2" name="admission_number" placeholder="学号" value={form.admission_number} onChange={handleChange} required />
        <input className="rounded border p-2" name="age" placeholder="年龄" value={form.age} onChange={handleChange} required />
        <select className="rounded border p-2" name="classroom_id" value={form.classroom_id} onChange={handleChange} required>
          <option value="">选择班级</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
        </select>
        <input className="rounded border p-2 md:col-span-2" name="description" placeholder="学生描述" value={form.description} onChange={handleChange} required />
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "新增"}</button>
          {editingId ? <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyStudent); }}>取消</button> : null}
        </div>
      </form>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">学号</th><th className="p-3">姓名</th><th className="p-3">班级</th><th className="p-3">年龄</th><th className="p-3">操作</th></tr></thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="p-3">{student.admission_number}</td>
                <td className="p-3">{fullName(student)}</td>
                <td className="p-3">{student.classroom?.name || "-"}</td>
                <td className="p-3">{student.age}</td>
                <td className="p-3">
                  <button className="mr-2 rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(student)}>编辑</button>
                  <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(student.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentsAdmin;
