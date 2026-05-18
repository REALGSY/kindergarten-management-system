import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function SingleKid() {
  const [kid, setKid] = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("jwt");
  const { id } = useParams();
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    axios
      .get(`/students/${id}`, config)
      .then((res) => setKid(res.data))
      .catch(() => setMessage("没有权限查看该孩子，或孩子不存在。"));

    axios
      .get(`/disciplines?student_id=${id}`, config)
      .then((res) => setDisciplines(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDisciplines([]));

    axios
      .get(`/attendances?student_id=${id}`, config)
      .then((res) => setAttendances(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAttendances([]));
  }, [id, config]);

  const presentCount = attendances.filter((item) => item.status === "Present").length;
  const absentCount = attendances.filter((item) => item.status === "Absent").length;

  if (message) return <div className="rounded bg-pink-50 p-4 text-center text-pink-700">{message}</div>;
  if (!kid) return <div className="p-6 text-center text-pink-600">正在加载孩子信息...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{kid.first_name} {kid.second_name} {kid.surname}</h1>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-md bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">学号</p><p className="text-2xl font-semibold text-pink-700">{kid.admission_number}</p></div>
        <div className="rounded-md bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">班级</p><p className="text-2xl font-semibold text-pink-700">{kid.classroom?.name || "-"}</p></div>
        <div className="rounded-md bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">出勤 / 缺勤</p><p className="text-2xl font-semibold text-pink-700">{presentCount} / {absentCount}</p></div>
        <div className="rounded-md bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">纪律记录</p><p className="text-2xl font-semibold text-pink-700">{disciplines.length}</p></div>
      </div>

      <div className="mt-6 rounded-md bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">学生描述</h2>
        <p className="mt-2 text-gray-600">{kid.description || "暂无描述"}</p>
      </div>

      <div className="mt-6 rounded-md bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">考勤明细</h2>
        {attendances.length === 0 ? <p className="mt-3 text-gray-500">暂无考勤记录</p> : (
          <table className="mt-3 min-w-full text-sm">
            <thead className="text-left"><tr><th className="p-2">日期</th><th className="p-2">状态</th></tr></thead>
            <tbody>{attendances.map((item) => <tr key={item.id} className="border-t"><td className="p-2">{item.date}</td><td className="p-2">{item.status === "Present" ? "出勤" : "缺勤"}</td></tr>)}</tbody>
          </table>
        )}
      </div>

      <div className="mt-6 rounded-md bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">纪律明细</h2>
        {disciplines.length === 0 ? <p className="mt-3 text-gray-500">暂无纪律记录</p> : (
          <table className="mt-3 min-w-full text-sm">
            <thead className="text-left"><tr><th className="p-2">标题</th><th className="p-2">日期</th><th className="p-2">描述</th></tr></thead>
            <tbody>{disciplines.map((item) => <tr key={item.id} className="border-t"><td className="p-2">{item.title}</td><td className="p-2">{item.date}</td><td className="p-2">{item.description}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SingleKid;
