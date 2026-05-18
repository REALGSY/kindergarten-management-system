import React from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function Dashboard() {
  const token = localStorage.getItem("teacherToken");

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded bg-white p-6 text-center shadow">
          <h1 className="text-xl font-semibold text-gray-900">请先登录教师账号</h1>
          <p className="mt-2 text-gray-600">教师端仅用于本班学生、考勤和纪律管理。</p>
          <Link className="mt-4 inline-block rounded bg-[#B124A3] px-4 py-2 text-white" to="/login">
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
