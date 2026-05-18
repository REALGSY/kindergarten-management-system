import React, { useEffect, useState } from "react";
import { adminRequest, fullName } from "./api";

const emptyDiscipline = { student_id: "", title: "", date: "", description: "" };

function DisciplinesAdmin() {
  const [disciplines, setDisciplines] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyDiscipline);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    Promise.all([adminRequest("/admin/disciplines"), adminRequest("/admin/students")])
      .then(([disciplineData, studentData]) => {
        setDisciplines(disciplineData);
        setStudents(studentData);
      })
      .catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await adminRequest("/admin/disciplines", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage("纪律记录已创建");
      setForm(emptyDiscipline);
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/disciplines/${id}`, { method: "DELETE" });
      setMessage("纪律记录已删除");
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">全局纪律记录</h1>
      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4" onSubmit={handleSubmit}>
        <select className="rounded border p-2" name="student_id" value={form.student_id} onChange={handleChange} required>
          <option value="">选择学生</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>{student.admission_number} - {fullName(student)}</option>
          ))}
        </select>
        <input className="rounded border p-2" name="title" placeholder="标题" value={form.title} onChange={handleChange} required />
        <input className="rounded border p-2" name="date" type="date" value={form.date} onChange={handleChange} required />
        <input className="rounded border p-2" name="description" placeholder="描述" value={form.description} onChange={handleChange} required />
        <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">新增记录</button>
      </form>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">标题</th><th className="p-3">日期</th><th className="p-3">学生ID</th><th className="p-3">描述</th><th className="p-3">操作</th></tr></thead>
          <tbody>
            {disciplines.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.title}</td>
                <td className="p-3">{item.date}</td>
                <td className="p-3">{item.student_id}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3"><button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(item.id)}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DisciplinesAdmin;
