import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../Home/Nav.jsx";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors || "教师账号或密码不正确");
      }

      localStorage.clear();
      localStorage.setItem("teacherToken", data.jwt);
      localStorage.setItem("teacher", `${data.teacher.id}`);
      localStorage.setItem("teacher_data", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Nav />
      <div className="flex justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-md bg-white p-8 shadow">
          <h1 className="text-2xl font-semibold text-gray-900">教师登录</h1>
          <p className="mt-2 text-sm text-gray-500">教师账号由管理员创建并分配班级。</p>
          {error ? <div className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</div> : null}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">邮箱</label>
              <input id="email" className="mt-1 w-full rounded border p-2" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">密码</label>
              <input id="password" className="mt-1 w-full rounded border p-2" type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
            <button className="w-full rounded bg-[#B124A3] px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">
            没有教师账号？请联系管理员。{" "}
            <Link className="text-pink-700" to="/admin_login">管理员入口</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
