import React, { useEffect, useState } from "react";
import { adminRequest, fullName } from "./api";

const emptyForm = {
  first_name: "",
  last_name: "",
  career_name: "",
  email: "",
  phone_number: "",
  gender: "",
  password: "",
};

function TeachersAdmin() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTeachers();
  }, []);

  function loadTeachers() {
    adminRequest("/admin/teachers").then(setTeachers).catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(teacher) {
    setEditingId(teacher.id);
    setForm({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      career_name: teacher.career_name || "",
      email: teacher.email || "",
      phone_number: teacher.phone_number || "",
      gender: teacher.gender || "",
      password: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await adminRequest(editingId ? `/admin/teachers/${editingId}` : "/admin/teachers", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setForm(emptyForm);
      setEditingId(null);
      setMessage(editingId ? "教师信息已更新" : "教师账号已创建");
      loadTeachers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/teachers/${id}`, { method: "DELETE" });
      setMessage("教师账号已删除");
      loadTeachers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">教师管理</h1>
      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="first_name" placeholder="名" value={form.first_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="last_name" placeholder="姓" value={form.last_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="career_name" placeholder="教师称呼" value={form.career_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="email" type="email" placeholder="邮箱" value={form.email} onChange={handleChange} required />
        <input className="rounded border p-2" name="phone_number" placeholder="电话" value={form.phone_number} onChange={handleChange} required />
        <input className="rounded border p-2" name="gender" placeholder="性别" value={form.gender} onChange={handleChange} required />
        <input className="rounded border p-2" name="password" type="password" placeholder={editingId ? "留空则不修改密码" : "留空使用默认密码"} value={form.password} onChange={handleChange} />
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "新增"}</button>
          {editingId ? <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>取消</button> : null}
        </div>
      </form>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">姓名</th><th className="p-3">称呼</th><th className="p-3">邮箱</th><th className="p-3">电话</th><th className="p-3">操作</th></tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="border-t">
                <td className="p-3">{fullName(teacher)}</td>
                <td className="p-3">{teacher.career_name}</td>
                <td className="p-3">{teacher.email}</td>
                <td className="p-3">{teacher.phone_number}</td>
                <td className="p-3">
                  <button className="mr-2 rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(teacher)}>编辑</button>
                  <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(teacher.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeachersAdmin;
