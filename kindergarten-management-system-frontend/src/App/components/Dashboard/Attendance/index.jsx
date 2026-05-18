import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Attendance() {
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("take");
  const [classroom, setClassroom] = useState(null);
  const [kids, setKids] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("teacherToken");
  const teacherId = localStorage.getItem("teacher");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    axios
      .get(`/teachers/${teacherId}`, config)
      .then((res) => {
        setClassroom(res.data.classroom);
        setKids(res.data.classroom?.students || []);
      })
      .catch(() => setMessage("班级信息加载失败"));
  }, [teacherId, config]);

  async function takeAttendance() {
    setMessage("");
    setPendingStudents([]);
    if (!classroom) {
      setMessage("你还没有分配班级，请联系管理员。");
      return;
    }
    if (!date) {
      setMessage("请选择日期");
      return;
    }

    const { data } = await axios.get(`/attendances?date=${date}`, config);
    const recordedIds = new Set(data.map((item) => item.student_id));
    const pending = kids.filter((kid) => !recordedIds.has(kid.id));
    setPendingStudents(pending);
    if (pending.length === 0) setMessage("该日期已完成考勤");
  }

  function recordAttendance(student, status) {
    axios
      .post("/attendances", { student_id: student.id, status, date }, config)
      .then(() => {
        setPendingStudents((items) => items.filter((item) => item.id !== student.id));
        setMessage(status === "Present" ? "已记录出勤" : "已记录缺勤");
      })
      .catch((error) => {
        const errors = error.response?.data?.errors || ["考勤记录失败"];
        setMessage(errors.toString());
      });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">本班考勤</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={`rounded px-4 py-2 ${mode === "take" ? "bg-[#B124A3] text-white" : "bg-white text-gray-700"}`} onClick={() => setMode("take")}>记录考勤</button>
        <button className={`rounded px-4 py-2 ${mode === "view" ? "bg-[#B124A3] text-white" : "bg-white text-gray-700"}`} onClick={() => setMode("view")}>查看考勤</button>
      </div>

      <div className="mt-4 rounded-md bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700" htmlFor="attendance-date">日期</label>
        <input id="attendance-date" className="mt-1 rounded border p-2" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        {mode === "take" ? (
          <button className="ml-3 rounded bg-[#B124A3] px-4 py-2 text-white" onClick={takeAttendance}>开始点名</button>
        ) : date ? (
          <Link className="ml-3 rounded bg-[#B124A3] px-4 py-2 text-white" to={`${date}`}>查看记录</Link>
        ) : null}
      </div>

      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 space-y-2">
        {pendingStudents.map((student) => (
          <div key={student.id} className="grid grid-cols-1 items-center gap-2 rounded-md bg-white p-4 shadow-sm md:grid-cols-3">
            <span>{student.first_name} {student.second_name} {student.surname}</span>
            <button className="rounded border px-3 py-2 text-sky-700" onClick={() => recordAttendance(student, "Present")}>出勤</button>
            <button className="rounded border px-3 py-2 text-red-600" onClick={() => recordAttendance(student, "Absent")}>缺勤</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Attendance;
