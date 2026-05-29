import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

function studentName(student) {
  return [student?.first_name, student?.second_name, student?.surname].filter(Boolean).join(" ");
}

export default function ParentChatRecords() {
  const token = localStorage.getItem("jwt");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [message, setMessage] = useState("");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    axios
      .get("/parent/children", config)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setStudents(data);
        if (data.length > 0) setSelectedStudentId(`${data[0].id}`);
      })
      .catch(() => setMessage("聊天记录加载失败。"));
  }, [config]);

  useEffect(() => {
    if (!selectedStudentId) return;
    axios
      .get(`/parent/children/${selectedStudentId}/chat_sessions`, config)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSessions(data);
        setSelectedSession(data[0] || null);
      })
      .catch(() => setMessage("聊天记录加载失败。"));
  }, [selectedStudentId, config]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">儿童聊天记录</h1>
      <p className="mt-2 text-sm text-gray-500">查看已绑定孩子在儿童端的 AI 陪伴对话。</p>
      {message ? <div className="mt-4 rounded bg-pink-50 p-3 text-pink-700">{message}</div> : null}

      <div className="mt-4 rounded-md bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-gray-700" htmlFor="child-record-student">选择孩子</label>
        <select
          id="child-record-student"
          className="mt-2 w-full max-w-sm rounded border p-2"
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}>
          {students.map((student) => (
            <option key={student.id} value={student.id}>{studentName(student)}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">对话列表</h2>
          <div className="mt-3 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                className={`block w-full rounded border px-3 py-2 text-left text-sm ${selectedSession?.id === session.id ? "border-pink-600 bg-pink-50 text-pink-700" : "text-gray-700"}`}
                onClick={() => setSelectedSession(session)}>
                {session.title || "儿童陪伴对话"}
              </button>
            ))}
            {sessions.length === 0 ? <p className="text-sm text-gray-500">暂无聊天记录。</p> : null}
          </div>
        </div>

        <div className="rounded-md bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">对话内容</h2>
          <div className="mt-3 space-y-3">
            {(selectedSession?.messages || []).map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-xs text-gray-500">{item.role === "user" ? "孩子" : "AI 陪伴老师"} · {new Date(item.created_at).toLocaleString()}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{item.content}</p>
              </div>
            ))}
            {!selectedSession ? <p className="text-sm text-gray-500">请选择一个对话。</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
