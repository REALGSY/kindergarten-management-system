import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, Outlet, useNavigate } from "react-router-dom";
import ParentContext from "../ParentContext";
import { paraKindergartenLogo, SYSTEM_LOGO_ALT } from "../../brand";

const navigation = [
  { name: "控制台", href: "/parent_dashboard" },
  { name: "我的孩子", href: "/parent_dashboard/my_kids" },
  { name: "聊天记录", href: "/parent_dashboard/chat_records" },
  { name: "个人资料", href: "/parent_dashboard/profile" },
];

export default function ParentDashboard() {
  const [parent, setParent] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt");
  const parentId = localStorage.getItem("parent");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    if (!token || !parentId) return;
    axios.get(`/parents/${parentId}`, config).then((res) => {
      localStorage.setItem("parent_data", JSON.stringify(res.data));
      setParent(res.data);
    });
  }, [token, parentId, config]);

  function handleLogout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("parent");
    localStorage.removeItem("parent_data");
    navigate("/parent_login");
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded bg-white p-6 text-center shadow">
          <p className="mb-4 text-gray-700">请先登录家长账号。</p>
          <Link className="rounded bg-[#B124A3] px-4 py-2 text-white" to="/parent_login">前往登录</Link>
        </div>
      </div>
    );
  }

  return (
    <ParentContext.Provider value={{ parent }}>
      <div className="flex min-h-screen bg-slate-100">
        <aside className="hidden w-64 shrink-0 border-r bg-white p-5 md:block">
          <img className="mb-6 h-16 w-auto" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link key={item.href} className="block rounded px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-[#B124A3]" to={item.href}>
                {item.name}
              </Link>
            ))}
          </nav>
          <button className="mt-8 rounded border px-3 py-2 text-sm text-gray-600" onClick={handleLogout}>退出登录</button>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mb-4 flex flex-wrap gap-2 md:hidden">
            {navigation.map((item) => (
              <Link key={item.href} className="rounded bg-white px-3 py-2 text-sm text-gray-700" to={item.href}>{item.name}</Link>
            ))}
            <button className="rounded bg-white px-3 py-2 text-sm text-gray-700" onClick={handleLogout}>退出</button>
          </div>
          <Outlet />
        </main>
      </div>
    </ParentContext.Provider>
  );
}
