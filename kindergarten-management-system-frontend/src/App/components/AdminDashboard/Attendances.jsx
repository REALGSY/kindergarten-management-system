import React, { useCallback, useEffect, useState } from "react";
import { adminRequest } from "./api";

function AttendancesAdmin() {
  const [attendances, setAttendances] = useState([]);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  const loadAttendances = useCallback((selectedDate = date) => {
    const query = selectedDate ? `?date=${selectedDate}` : "";
    adminRequest(`/admin/attendances${query}`).then(setAttendances).catch((err) => setMessage(err.message));
  }, [date]);

  useEffect(() => {
    loadAttendances();
  }, [loadAttendances]);

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/attendances/${id}`, { method: "DELETE" });
      setMessage("考勤记录已删除");
      loadAttendances();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">全局考勤</h1>
      <div className="mt-4 flex flex-wrap gap-2 rounded-md bg-white p-4 shadow-sm">
        <input className="rounded border p-2" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button className="rounded bg-[#B124A3] px-4 py-2 text-white" onClick={() => loadAttendances(date)}>筛选</button>
        <button className="rounded border px-4 py-2" onClick={() => { setDate(""); loadAttendances(""); }}>清空</button>
      </div>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">日期</th><th className="p-3">学生</th><th className="p-3">学生ID</th><th className="p-3">班级ID</th><th className="p-3">状态</th><th className="p-3">操作</th></tr></thead>
          <tbody>
            {attendances.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.date}</td>
                <td className="p-3">{item.student_name}</td>
                <td className="p-3">{item.student_id}</td>
                <td className="p-3">{item.classroom_id}</td>
                <td className="p-3">{item.status === "Present" ? "出勤" : "缺勤"}</td>
                <td className="p-3"><button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(item.id)}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendancesAdmin;
