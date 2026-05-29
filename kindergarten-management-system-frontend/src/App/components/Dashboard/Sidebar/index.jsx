import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { paraKindergartenLogo, SYSTEM_LOGO_ALT } from "../../../brand";

const links = [
  { to: "/dashboard", label: "控制台" },
  { to: "/dashboard/classes", label: "我的班级" },
  { to: "/dashboard/kids_list", label: "学生" },
  { to: "/dashboard/attendance", label: "考勤" },
  { to: "/dashboard/discipline", label: "纪律记录" },
  { to: "/dashboard/parents", label: "家长" },
  { to: "/dashboard/profile", label: "个人资料" },
];

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacher");
    localStorage.removeItem("teacher_data");
    navigate("/login");
  }

  return (
    <aside className="hidden min-h-screen w-60 shrink-0 border-r bg-white p-5 md:block">
      <img className="mx-auto mb-6 h-14" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
      <nav className="space-y-1">
        {links.map((link) => (
          <Link key={link.to} className="block rounded px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-[#B124A3]" to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
      <button className="mt-8 rounded border px-3 py-2 text-sm text-gray-600" onClick={handleLogout}>
        退出登录
      </button>
    </aside>
  );
}

export default Sidebar;
