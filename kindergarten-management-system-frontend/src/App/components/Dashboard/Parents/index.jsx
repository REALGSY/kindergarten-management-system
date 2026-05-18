import React, { useEffect, useState } from "react";
import { useMemo } from "react";
import axios from "axios";

function Parents() {
  const [parents, setParents] = useState([]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("teacherToken");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    axios
      .get("/parents", config)
      .then((res) => setParents(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMessage("家长列表加载失败"));
  }, [config]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">本班家长</h1>
      <p className="mt-2 text-sm text-gray-500">这里只显示已通过绑定审批、且孩子属于你班级的家长。</p>
      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">名</th><th className="p-3">姓</th><th className="p-3">电话</th></tr>
          </thead>
          <tbody>
            {parents.map((parent) => (
              <tr key={parent.id} className="border-t">
                <td className="p-3">{parent.first_name}</td>
                <td className="p-3">{parent.last_name}</td>
                <td className="p-3">{parent.phone_number}</td>
              </tr>
            ))}
            {parents.length === 0 ? <tr><td className="p-6 text-center text-gray-500" colSpan="3">暂无家长</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Parents;
