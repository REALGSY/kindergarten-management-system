import React, { useEffect, useState } from "react";
import { adminRequest } from "./api";

const statusLabel = {
  pending: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
};

function ParentStudentsAdmin() {
  const [links, setLinks] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadLinks();
  }, []);

  function loadLinks() {
    adminRequest("/admin/parent_students").then(setLinks).catch((err) => setMessage(err.message));
  }

  async function updateStatus(id, status) {
    try {
      await adminRequest(`/admin/parent_students/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage("审批状态已更新");
      loadLinks();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/parent_students/${id}`, { method: "DELETE" });
      setMessage("绑定记录已删除");
      loadLinks();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">家长绑定审批</h1>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">家长</th><th className="p-3">电话</th><th className="p-3">孩子</th><th className="p-3">学号</th><th className="p-3">状态</th><th className="p-3">操作</th></tr></thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-t">
                <td className="p-3">{link.parent_name}</td>
                <td className="p-3">{link.parent_phone_number}</td>
                <td className="p-3">{link.student_name}</td>
                <td className="p-3">{link.admission_number}</td>
                <td className="p-3">{statusLabel[link.status] || link.status}</td>
                <td className="p-3">
                  <button className="mr-2 rounded border px-3 py-1 text-green-700" onClick={() => updateStatus(link.id, "approved")}>通过</button>
                  <button className="mr-2 rounded border px-3 py-1 text-amber-700" onClick={() => updateStatus(link.id, "rejected")}>拒绝</button>
                  <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(link.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ParentStudentsAdmin;
