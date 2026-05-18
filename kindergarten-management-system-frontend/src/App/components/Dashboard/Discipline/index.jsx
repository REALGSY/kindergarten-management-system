import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { handleUnauthorizedResponse } from "../../Auth/session";

const emptyCase = { student_id: "", title: "", date: "", description: "" };

function Discipline() {
  const [disciplines, setDisciplines] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyCase);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("teacherToken");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadData() {
    Promise.all([axios.get("/disciplines", config), axios.get("/students", config)])
      .then(([disciplineRes, studentRes]) => {
        setDisciplines(Array.isArray(disciplineRes.data) ? disciplineRes.data : []);
        setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      })
      .catch(() => setMessage("纪律记录加载失败"));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      student_id: item.student_id,
      title: item.title || "",
      date: item.date || "",
      description: item.description || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await axios.patch(`/disciplines/${editingId}`, { title: form.title, description: form.description }, config);
        setMessage("纪律记录已更新");
      } else {
        await axios.post("/disciplines", form, config);
        setMessage("纪律记录已新增");
      }
      setEditingId(null);
      setForm(emptyCase);
      loadData();
    } catch (err) {
      const errors = err.response?.data?.errors || err.response?.data?.error || "纪律记录保存失败";
      setMessage(errors.toString());
    }
  }

  function handleDelete(id) {
    fetch(`/disciplines/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (handleUnauthorizedResponse(res.status, "teacher")) return;
      if (res.ok) {
        setDisciplines((items) => items.filter((item) => item.id !== id));
        setMessage("纪律记录已删除");
      } else {
        setMessage("纪律记录删除失败");
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">本班纪律记录</h1>
      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4" onSubmit={handleSubmit}>
        <select className="rounded border p-2" name="student_id" value={form.student_id} onChange={handleChange} required disabled={Boolean(editingId)}>
          <option value="">选择学生</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>{student.admission_number} - {student.first_name} {student.surname}</option>
          ))}
        </select>
        <input className="rounded border p-2" name="title" placeholder="标题" value={form.title} onChange={handleChange} required />
        <input className="rounded border p-2" name="date" type="date" value={form.date} onChange={handleChange} required disabled={Boolean(editingId)} />
        <input className="rounded border p-2" name="description" placeholder="描述" value={form.description} onChange={handleChange} required />
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "新增"}</button>
          {editingId ? <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyCase); }}>取消</button> : null}
        </div>
      </form>
      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">标题</th><th className="p-3">日期</th><th className="p-3">学生ID</th><th className="p-3">描述</th><th className="p-3">操作</th></tr>
          </thead>
          <tbody>
            {disciplines.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.title}</td>
                <td className="p-3">{item.date}</td>
                <td className="p-3">{item.student_id}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3">
                  <button className="mr-2 rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(item)}>编辑</button>
                  <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(item.id)}>删除</button>
                </td>
              </tr>
            ))}
            {disciplines.length === 0 ? <tr><td className="p-6 text-center text-gray-500" colSpan="5">暂无纪律记录</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Discipline;
