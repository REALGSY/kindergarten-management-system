import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { handleUnauthorizedResponse } from "../../Auth/session";

const emptyStudent = {
  first_name: "",
  second_name: "",
  surname: "",
  admission_number: "",
  age: "",
  description: "",
};

function fullName(student) {
  return [student.first_name, student.second_name, student.surname].filter(Boolean).join(" ");
}

export default function KidsList() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyStudent);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("teacherToken");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    loadStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadStudents() {
    setLoading(true);
    fetch("/students", { headers })
      .then((res) => {
        if (handleUnauthorizedResponse(res.status, "teacher")) return [];
        return res.json();
      })
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setMessage("学生列表加载失败"))
      .finally(() => setLoading(false));
  }

  function startEdit(student) {
    setEditing(student);
    setMessage("");
    setForm({
      first_name: student.first_name || "",
      second_name: student.second_name || "",
      surname: student.surname || "",
      admission_number: student.admission_number || "",
      age: student.age || "",
      description: student.description || "",
    });
  }

  function closeEdit() {
    setEditing(null);
    setForm(emptyStudent);
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleSave(event) {
    event.preventDefault();
    fetch(`/students/${editing.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        if (handleUnauthorizedResponse(res.status, "teacher")) return null;
        const data = await res.json();
        if (!res.ok) throw new Error((data.errors || data.error || "学生信息保存失败").toString());
        return data;
      })
      .then(() => {
        closeEdit();
        setMessage("学生信息已保存");
        loadStudents();
      })
      .catch((error) => setMessage(error.message));
  }

  function handleDelete(id) {
    fetch(`/students/${id}`, { method: "DELETE", headers })
      .then((res) => {
        if (handleUnauthorizedResponse(res.status, "teacher")) return;
        if (!res.ok) throw new Error("学生删除失败");
        setStudents((items) => items.filter((item) => item.id !== id));
        setMessage("学生已删除");
      })
      .catch((error) => setMessage(error.message));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">本班学生</h1>
          <p className="mt-2 text-sm text-gray-500">教师只能维护自己班级的学生基础信息，转班由管理员处理。</p>
        </div>
        <Link className="rounded bg-[#B124A3] px-4 py-2 text-white" to="/dashboard/add_kid">
          添加学生
        </Link>
      </div>

      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      {loading ? <p className="mt-6 text-gray-500">正在加载学生...</p> : null}

      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">学号</th><th className="p-3">姓名</th><th className="p-3">班级</th><th className="p-3">年龄</th><th className="p-3">操作</th></tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="p-3">{student.admission_number}</td>
                <td className="p-3">{fullName(student)}</td>
                <td className="p-3">{student.classroom?.name || "-"}</td>
                <td className="p-3">{student.age}</td>
                <td className="p-3">
                  <Link className="mr-2 inline-flex rounded border px-3 py-1 text-pink-700" to={`${student.id}`}>
                    <EyeIcon className="mr-1 h-4" /> 查看
                  </Link>
                  <button className="mr-2 inline-flex rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(student)}>
                    <PencilIcon className="mr-1 h-4" /> 编辑
                  </button>
                  <button className="inline-flex rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(student.id)}>
                    <TrashIcon className="mr-1 h-4" /> 删除
                  </button>
                </td>
              </tr>
            ))}
            {!loading && students.length === 0 ? (
              <tr><td className="p-6 text-center text-gray-500" colSpan="5">暂无学生</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <form className="w-full max-w-2xl rounded bg-white p-6 shadow-lg" onSubmit={handleSave}>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">编辑学生信息</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input className="rounded border p-2" name="first_name" value={form.first_name} onChange={handleChange} placeholder="名" required />
              <input className="rounded border p-2" name="second_name" value={form.second_name} onChange={handleChange} placeholder="第二名" required />
              <input className="rounded border p-2" name="surname" value={form.surname} onChange={handleChange} placeholder="姓" required />
              <input className="rounded border p-2" name="admission_number" value={form.admission_number} onChange={handleChange} placeholder="学号" required />
              <input className="rounded border p-2" name="age" value={form.age} onChange={handleChange} placeholder="年龄" required />
              <textarea className="rounded border p-2 md:col-span-2" name="description" value={form.description} onChange={handleChange} placeholder="学生描述" required />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded border px-4 py-2" onClick={closeEdit}>取消</button>
              <button type="submit" className="rounded bg-[#B124A3] px-4 py-2 text-white">保存</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
