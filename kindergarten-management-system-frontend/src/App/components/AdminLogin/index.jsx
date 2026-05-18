import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl, readJsonResponse } from "../Auth/apiClient";

function AdminLogin() {
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
      const response = await fetch(apiUrl("/admin_login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readJsonResponse(response, "管理员登录失败");
      if (!response.ok) {
        throw new Error(data.errors || data.error || "管理员账号或密码不正确");
      }

      localStorage.clear();
      localStorage.setItem("adminToken", data.jwt);
      localStorage.setItem("admin", `${data.admin.id}`);
      localStorage.setItem("admin_data", JSON.stringify(data.admin));
      navigate("/admin_dashboard");
    } catch (err) {
      setError(err.message || "管理员登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-md bg-white p-8 shadow">
        <div className="mb-6">
          <p className="text-sm font-medium text-pink-600">KinderJoy</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">管理员登录</h1>
          <p className="mt-2 text-sm text-gray-500">使用管理员账号进入全局管理台。</p>
        </div>

        {error ? <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="admin-email">
              邮箱
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="admin-password">
              密码
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
              required
            />
          </div>
          <button
            className="w-full rounded bg-[#B124A3] px-4 py-2 font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm">
          <Link className="text-pink-700" to="/login">教师登录</Link>
          <Link className="text-gray-500" to="/">返回首页</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
