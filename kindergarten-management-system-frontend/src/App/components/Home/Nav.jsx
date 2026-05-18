import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Home/assets/pre-logo.png";

function Navbar() {
  const links = [
    { to: "/", label: "首页" },
    { to: "/admin_login", label: "管理员登录" },
    { to: "/login", label: "教师登录" },
    { to: "/parent_login", label: "家长登录" },
    { to: "/parent_signup", label: "家长注册" },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-5">
      <Link className="flex items-center gap-3" to="/">
        <img className="h-10 w-auto" src={Logo} alt="KinderJoy" />
        <div>
          <h1 className="text-2xl font-bold text-[#B124A3]">KinderJoy</h1>
          <p className="text-xs text-[#B124A3]">幼儿园管理系统</p>
        </div>
      </Link>
      <nav className="flex flex-wrap gap-2 rounded-md bg-[#B124A3] p-2 text-sm text-white">
        {links.map((link) => (
          <Link key={link.to} className="rounded px-3 py-2 hover:bg-white hover:text-[#B124A3]" to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
