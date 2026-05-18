import React, { useEffect, useState } from "react";
import { adminRequest } from "./api";

function Overview() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminRequest("/admin/summary")
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  const cards = summary
    ? [
        ["教师", summary.teacher_count],
        ["班级", summary.classroom_count],
        ["学生", summary.student_count],
        ["家长", summary.parent_count],
        ["待审批绑定", summary.pending_parent_student_count],
        ["纪律记录", summary.discipline_count],
        ["今日考勤", summary.attendance_today?.total || 0],
        ["今日出勤", summary.attendance_today?.present || 0],
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">管理概览</h1>
      <p className="mt-2 text-sm text-gray-500">查看园所账号、班级、学生、考勤和审批状态。</p>
      {error ? <div className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</div> : null}
      {!summary && !error ? <div className="mt-6 text-gray-500">正在加载概览...</div> : null}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-pink-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Overview;
