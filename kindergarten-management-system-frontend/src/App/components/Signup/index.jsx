import React from "react";
import { Link } from "react-router-dom";
import Nav from "../Home/Nav";

function Signup() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Nav />
      <div className="mx-auto mt-16 max-w-xl rounded-md bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-gray-900">教师账号由管理员创建</h1>
        <p className="mt-3 text-gray-600">
          为了收敛教师端权限，系统已关闭公开教师注册。请联系管理员创建教师账号并分配班级。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="rounded bg-[#B124A3] px-4 py-2 text-white" to="/login">教师登录</Link>
          <Link className="rounded border px-4 py-2 text-gray-700" to="/admin_login">管理员登录</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
