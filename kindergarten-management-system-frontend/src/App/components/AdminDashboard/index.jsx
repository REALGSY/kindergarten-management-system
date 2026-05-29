import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { SYSTEM_NAME } from "../../brand";

const navigation = [
  { label: "概览", to: "/admin_dashboard" },
  { label: "教师", to: "/admin_dashboard/teachers" },
  { label: "班级", to: "/admin_dashboard/classrooms" },
  { label: "学生", to: "/admin_dashboard/students" },
  { label: "家长", to: "/admin_dashboard/parents" },
  { label: "绑定审批", to: "/admin_dashboard/parent_students" },
  { label: "考勤", to: "/admin_dashboard/attendances" },
  { label: "纪律", to: "/admin_dashboard/disciplines" },
  { label: "早教视频", to: "/admin_dashboard/educational_videos" },
  { label: "儿童聊天", to: "/admin_dashboard/child_chat_sessions" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_data");
    navigate("/admin_login");
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded bg-white p-6 text-center shadow">
          <p className="mb-4 text-gray-700">请先登录管理员账号。</p>
          <Link className="rounded bg-[#B124A3] px-4 py-2 text-white" to="/admin_login">
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 border-r bg-white p-5 md:block">
        <div className="mb-8">
          <p className="text-sm text-pink-600">{SYSTEM_NAME}</p>
          <h1 className="text-xl font-semibold text-gray-900">管理员端</h1>
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.to}
              className="block rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700"
              to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="mt-8 rounded border px-3 py-2 text-sm text-gray-600" onClick={handleLogout}>
          退出登录
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          {navigation.map((item) => (
            <Link key={item.to} className="rounded bg-white px-3 py-2 text-sm text-gray-700" to={item.to}>
              {item.label}
            </Link>
          ))}
          <button className="rounded bg-white px-3 py-2 text-sm text-gray-700" onClick={handleLogout}>
            退出
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminDashboard;
