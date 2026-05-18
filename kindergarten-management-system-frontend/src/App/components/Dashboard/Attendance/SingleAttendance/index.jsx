import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function SingleAttendance() {
  const [allAttendance, setAllAttendance] = useState([]);
  const [message, setMessage] = useState("");
  const { date } = useParams();
  const token = localStorage.getItem("teacherToken");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    axios
      .get(`/attendances?date=${date}`, config)
      .then((res) => setAllAttendance(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMessage("考勤记录加载失败"));
  }, [date, config]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{date} 考勤名单</h1>
      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 rounded-md bg-white shadow-sm">
        {allAttendance.length < 1 ? (
          <div className="p-6 text-gray-500">该日期暂无考勤记录</div>
        ) : (
          allAttendance.map((item, index) => (
            <div key={item.id} className="grid grid-cols-3 border-b p-4 text-sm">
              <span>{index + 1}</span>
              <span>{item.student_name}</span>
              <span>{item.status === "Present" ? "出勤" : item.status === "Absent" ? "缺勤" : item.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SingleAttendance;
