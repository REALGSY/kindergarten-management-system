import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../Home/Nav";
import { apiUrl, readJsonResponse } from "../Auth/apiClient";
import { paraKindergartenLogo, SYSTEM_LOGO_ALT, SYSTEM_NAME } from "../../brand";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { register, handleSubmit } = useForm();

  async function onSubmit(formData) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(apiUrl("/child_login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await readJsonResponse(response, "儿童登录失败");

      if (!response.ok) {
        throw new Error((data.errors || data.error || "学号或密码错误").toString());
      }

      localStorage.removeItem("childToken");
      localStorage.removeItem("child");
      localStorage.removeItem("child_data");
      localStorage.setItem("childToken", data.jwt);
      localStorage.setItem("child", `${data.student.id}`);
      localStorage.setItem("child_data", JSON.stringify(data.student));
      navigate("/child_dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Nav />
      <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-8">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-md bg-white shadow-sm md:grid-cols-[1fr_420px]">
          <div className="hidden bg-[#B124A3] p-8 text-white md:flex md:flex-col md:justify-between">
            <div>
              <img className="h-16 w-auto rounded bg-white p-2" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
              <h1 className="mt-8 text-3xl font-semibold">{SYSTEM_NAME} 儿童端</h1>
              <p className="mt-3 text-sm leading-6 text-pink-50">
                用学号和儿童端密码进入学习空间，观看早教视频并和 AI 陪伴老师对话。
              </p>
            </div>
            <p className="text-sm text-pink-100">默认密码为 123456，家长可在家长端为孩子修改。</p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-center md:hidden">
              <img className="h-14 w-auto" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">儿童登录</h2>
            <p className="mt-2 text-sm text-gray-500">请输入孩子学号和儿童端密码。</p>

            {message ? <div className="mt-4 rounded bg-pink-50 p-3 text-sm text-pink-700">{message}</div> : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="admission_number">学号</label>
                <input
                  id="admission_number"
                  className="mt-2 w-full rounded border p-3"
                  type="number"
                  placeholder="例如 2026001"
                  {...register("admission_number", { required: true })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="password">密码</label>
                <input
                  id="password"
                  className="mt-2 w-full rounded border p-3"
                  type="password"
                  placeholder="请输入儿童端密码"
                  {...register("password", { required: true })}
                />
              </div>
              <button className="w-full rounded bg-[#B124A3] px-4 py-3 text-white disabled:opacity-60" type="submit" disabled={loading}>
                {loading ? "登录中..." : "登录"}
              </button>
            </form>

            <div className="mt-5 text-sm text-gray-500">
              家长入口：<Link className="text-[#B124A3]" to="/parent_login">前往家长登录</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
