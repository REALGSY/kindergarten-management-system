import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { paraKindergartenLogo, SYSTEM_LOGO_ALT } from "../../brand";

function authConfig(token) {
  return {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
}

function studentName(student) {
  return [student?.first_name, student?.second_name, student?.surname].filter(Boolean).join(" ");
}

export default function ChildDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("childToken");
  const [student, setStudent] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [sending, setSending] = useState(false);
  const config = useMemo(() => authConfig(token), [token]);

  const subjects = Array.from(new Set(videos.map((video) => video.subject).filter(Boolean)));
  const visibleVideos = selectedSubject ? videos.filter((video) => video.subject === selectedSubject) : videos;

  useEffect(() => {
    if (!token) return;
    setStatusMessage("");

    Promise.all([
      axios.get("/child/profile", config),
      axios.get("/child/videos", config),
      axios.get("/child/chat_sessions", config),
    ])
      .then(([studentRes, videoRes, sessionRes]) => {
        setStudent(studentRes.data);
        localStorage.setItem("child", `${studentRes.data.id}`);
        localStorage.setItem("child_data", JSON.stringify(studentRes.data));
        setVideos(Array.isArray(videoRes.data) ? videoRes.data : []);
        const nextSessions = Array.isArray(sessionRes.data) ? sessionRes.data : [];
        setSessions(nextSessions);
        setActiveSession(nextSessions[0] || null);
      })
      .catch(() => setStatusMessage("儿童端信息加载失败，请重新登录。"));
  }, [token, config]);

  async function startNewSession() {
    setStatusMessage("");
    try {
      const res = await axios.post(
        "/child/chat_sessions",
        { title: `${studentName(student) || "孩子"} 的陪伴对话` },
        config
      );
      setSessions((current) => [res.data, ...current]);
      setActiveSession(res.data);
    } catch (error) {
      setStatusMessage(error.response?.data?.error || "新建聊天失败。");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = messageText.trim();
    if (!content || !activeSession || sending) return;

    setSending(true);
    setStatusMessage("");
    setMessageText("");
    try {
      const res = await axios.post(`/child/chat_sessions/${activeSession.id}/messages`, { content }, config);
      const nextMessages = [
        ...(activeSession.messages || []),
        res.data.user_message,
        res.data.assistant_message,
      ].filter(Boolean);
      const updatedSession = { ...activeSession, messages: nextMessages, updated_at: new Date().toISOString() };
      setActiveSession(updatedSession);
      setSessions((current) => [updatedSession, ...current.filter((session) => session.id !== activeSession.id)]);
    } catch (error) {
      setStatusMessage(error.response?.data?.error || "AI 回复失败，请稍后重试。");
      setMessageText(content);
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("childToken");
    localStorage.removeItem("child");
    localStorage.removeItem("child_data");
    navigate("/child_login");
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-md bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-gray-700">请先登录儿童端。</p>
          <Link className="rounded bg-[#B124A3] px-4 py-2 text-white" to="/child_login">前往儿童登录</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img className="h-12 w-auto" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
            <div>
              <p className="text-sm text-pink-600">KinderJoy 儿童端</p>
              <h1 className="text-2xl font-semibold text-gray-900">陪伴学习空间</h1>
            </div>
          </div>
          <button className="rounded border px-3 py-2 text-sm text-gray-700" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-md bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">当前孩子</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">{studentName(student) || "加载中..."}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="rounded bg-slate-50 p-3">
                <p className="text-xs text-gray-500">学号</p>
                <p className="font-medium text-gray-900">{student?.admission_number || "-"}</p>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <p className="text-xs text-gray-500">年龄</p>
                <p className="font-medium text-gray-900">{student?.age ? `${student.age} 岁` : "-"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">陪伴对话</h2>
              <button className="rounded bg-[#B124A3] px-3 py-1 text-sm text-white" onClick={startNewSession}>
                新对话
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className={`block w-full rounded border px-3 py-2 text-left text-sm ${activeSession?.id === session.id ? "border-pink-600 bg-pink-50 text-pink-700" : "text-gray-700"}`}
                  onClick={() => setActiveSession(session)}>
                  {session.title || "儿童陪伴对话"}
                </button>
              ))}
              {sessions.length === 0 ? <p className="text-sm text-gray-500">还没有对话，点击“新对话”开始。</p> : null}
            </div>
          </section>
        </aside>

        <div className="space-y-5">
          {statusMessage ? <div className="rounded bg-pink-50 p-3 text-pink-700">{statusMessage}</div> : null}

          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI 早教陪伴</h2>
                <p className="text-sm text-gray-500">用简短、温和的中文陪孩子聊天和学习。</p>
              </div>
            </div>
            <div className="mt-4 h-80 overflow-y-auto rounded border bg-slate-50 p-3">
              {!activeSession ? <p className="text-sm text-gray-500">请选择或新建一个对话。</p> : null}
              {(activeSession?.messages || []).map((item) => (
                <div key={item.id || `${item.role}-${item.created_at}`} className={`mb-3 flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${item.role === "user" ? "bg-pink-600 text-white" : "bg-white text-gray-800 shadow-sm"}`}>
                    {item.content}
                  </div>
                </div>
              ))}
              {sending ? <p className="text-sm text-pink-600">正在等待 AI 回复...</p> : null}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
              <input
                className="min-w-0 flex-1 rounded border p-3"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="和陪伴老师说点什么..."
                disabled={!activeSession || sending}
              />
              <button className="rounded bg-[#B124A3] px-5 py-2 text-white disabled:opacity-50" type="submit" disabled={!activeSession || sending || !messageText.trim()}>
                发送
              </button>
            </form>
          </section>

          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">早教视频</h2>
                <p className="text-sm text-gray-500">根据当前孩子年龄推荐，可按学科筛选。</p>
              </div>
              <select className="rounded border p-2" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                <option value="">全部学科</option>
                {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {visibleVideos.map((video) => (
                <article key={video.id} className="rounded-md border p-3">
                  <video className="aspect-video w-full rounded bg-black" controls src={video.video_url} />
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{video.subject}</span>
                    <span>{video.stage}</span>
                    <span>{video.level}</span>
                    <span>{video.min_age}-{video.max_age} 岁</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900">{video.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{video.description || "暂无简介"}</p>
                </article>
              ))}
              {visibleVideos.length === 0 ? <p className="text-sm text-gray-500">暂无匹配的已发布视频。</p> : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
