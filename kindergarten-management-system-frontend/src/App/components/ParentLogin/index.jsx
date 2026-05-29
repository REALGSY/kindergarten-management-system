import React, { useState } from "react";
import "./ParentLogin.css";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../Home/Nav";
import kid from "./kids.svg";
import { apiUrl, readJsonResponse } from "../Auth/apiClient";
import { paraKindergartenLogo, SYSTEM_LOGO_ALT, SYSTEM_NAME } from "../../brand";

function ParentLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const { register, handleSubmit } = useForm();

  function handleNotification() {
    setModal(true);
    setTimeout(() => {
      setModal(false);
      navigate("/parent_dashboard");
    }, 2000);
  }

  async function onSubmit(data) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/parent_login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await readJsonResponse(response, "家长登录失败");

      if (!response.ok) {
        throw new Error(result.errors || result.error || "电话号码或密码不正确");
      }

      localStorage.setItem("jwt", result.jwt);
      localStorage.setItem("parent", `${result.parent.id}`);
      localStorage.setItem("parent_data", JSON.stringify(result.parent));
      handleNotification();
    } catch (err) {
      setError(err.message || "家长登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main min-h-screen bg-[#B124A3]">
      <Nav />
      <hr className="border border-1" />
      {modal ? (
        <div className="bg-pink-200 py-2 text-center">
          登录成功
        </div>
      ) : null}

      <main className="flex items-center justify-center px-4 py-10">
        <section className="flex w-full max-w-[980px] overflow-hidden rounded-[30px] bg-white">
          <div className="hidden h-[582px] w-[600px] shrink-0 bg-[#FFE6EE] sm:block">
            <div className="parent-login-illustration relative left-[120px] top-[73px] h-[314px] w-[357px]">
              <img src={kid} alt="家长和孩子" />
            </div>
            <h2 className="mx-auto mt-24 w-[362px] text-[40px] font-bold leading-[50px] text-pink-500">
              {SYSTEM_NAME} 家长
            </h2>
            <p className="mt-1 text-center text-xl leading-5 text-[#9FA2B4]">
              还没有账号？{" "}
              <Link to="/parent_signup" style={{ color: "#B124A3" }}>
                点击注册
              </Link>
            </p>
          </div>

          <div className="w-full bg-white sm:w-[380px]">
            <div className="mb-4 mt-12 flex items-center justify-center">
              <img className="h-16 w-auto" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
            </div>
            <div className="flex justify-center">
              <p className="text-2xl font-semibold">家长登录</p>
            </div>
            <div className="mb-7 mt-2 flex justify-center">
              <p className="text-[#9FA2B4]">请在下方输入登录信息</p>
            </div>

            <form
              className="m-10 grid grid-cols-1 gap-3"
              onSubmit={handleSubmit(onSubmit)}>
              {error ? <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
              <label htmlFor="phone_number">电话号码</label>
              <input
                id="phone_number"
                className="rounded-md border p-3"
                type="number"
                placeholder="电话号码"
                {...register("phone_number", {
                  required: true,
                })}
              />
              <label htmlFor="password">密码</label>
              <input
                id="password"
                className="rounded-md border p-3"
                type="password"
                placeholder="请输入密码..."
                {...register("password", {
                  required: true,
                })}
              />
              <button
                className="flex w-full cursor-pointer justify-center rounded-md bg-[#B124A3] px-3 py-2 text-white disabled:opacity-60"
                type="submit"
                disabled={loading}>
                {loading ? (
                  <svg
                    className="mr-1 h-5 w-5 animate-spin rounded-full outline outline-3"
                    viewBox="0 0 24 24"
                  />
                ) : null}
                <span>{loading ? "登录中..." : "登录"}</span>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ParentLogin;
