import React, { useEffect, useState } from "react";
import { adminRequest, fullName } from "./api";

const emptyParent = { first_name: "", last_name: "", phone_number: "", password: "" };

function ParentsAdmin() {
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState(emptyParent);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadParents();
  }, []);

  function loadParents() {
    adminRequest("/admin/parents").then(setParents).catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(parent) {
    setEditingId(parent.id);
    setForm({ first_name: parent.first_name || "", last_name: parent.last_name || "", phone_number: parent.phone_number || "", password: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await adminRequest(editingId ? `/admin/parents/${editingId}` : "/admin/parents", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(editingId ? "家长信息已更新" : "家长账号已创建");
      setEditingId(null);
      setForm(emptyParent);
      loadParents();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/parents/${id}`, { method: "DELETE" });
      setMessage("家长账号已删除");
      loadParents();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">家长管理</h1>
      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="first_name" placeholder="名" value={form.first_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="last_name" placeholder="姓" value={form.last_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="phone_number" placeholder="电话" value={form.phone_number} onChange={handleChange} required />
        <input className="rounded border p-2" name="password" type="password" placeholder={editingId ? "留空则不修改密码" : "留空使用默认密码"} value={form.password} onChange={handleChange} />
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "新增"}</button>
          {editingId ? <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyParent); }}>取消</button> : null}
        </div>
      </form>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">姓名</th><th className="p-3">电话</th><th className="p-3">已批准孩子数</th><th className="p-3">操作</th></tr></thead>
          <tbody>
            {parents.map((parent) => (
              <tr key={parent.id} className="border-t">
                <td className="p-3">{fullName(parent)}</td>
                <td className="p-3">{parent.phone_number}</td>
                <td className="p-3">{parent.students?.length || 0}</td>
                <td className="p-3">
                  <button className="mr-2 rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(parent)}>编辑</button>
                  <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(parent.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ParentsAdmin;
