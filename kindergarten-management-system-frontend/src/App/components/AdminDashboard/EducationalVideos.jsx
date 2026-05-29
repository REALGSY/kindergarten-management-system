import React, { useEffect, useState } from "react";
import { adminHeaders, adminRequest } from "./api";
import { apiUrl, readJsonResponse } from "../Auth/apiClient";

const emptyForm = {
  title: "",
  description: "",
  stage: "",
  level: "",
  subject: "",
  min_age: "3",
  max_age: "6",
  status: "draft",
  video_file: null,
};

async function adminFormRequest(path, formData, method = "POST") {
  const tokenHeaders = adminHeaders();
  delete tokenHeaders["Content-Type"];

  const response = await fetch(apiUrl(path), {
    method,
    headers: tokenHeaders,
    body: formData,
  });

  if (response.status === 204) return null;
  const data = await readJsonResponse(response, "管理员请求失败");
  if (!response.ok) {
    throw new Error((data.errors || data.error || "操作失败").toString());
  }
  return data;
}

function buildFormData(form, includeFile) {
  const data = new FormData();
  ["title", "description", "stage", "level", "subject", "min_age", "max_age", "status"].forEach((key) => {
    data.append(key, form[key] || "");
  });
  if (includeFile && form.video_file) {
    data.append("video_file", form.video_file);
  }
  return data;
}

export default function EducationalVideosAdmin() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  function loadVideos() {
    adminRequest("/admin/educational_videos")
      .then(setVideos)
      .catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    const { name, value, files } = event.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  }

  function startEdit(video) {
    setEditingId(video.id);
    setForm({
      title: video.title || "",
      description: video.description || "",
      stage: video.stage || "",
      level: video.level || "",
      subject: video.subject || "",
      min_age: `${video.min_age ?? ""}`,
      max_age: `${video.max_age ?? ""}`,
      status: video.status || "draft",
      video_file: null,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const formData = buildFormData(form, !editingId || !!form.video_file);
      await adminFormRequest(
        editingId ? `/admin/educational_videos/${editingId}` : "/admin/educational_videos",
        formData,
        editingId ? "PATCH" : "POST"
      );
      setMessage(editingId ? "早教视频已更新" : "早教视频已上传");
      setEditingId(null);
      setForm(emptyForm);
      loadVideos();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/educational_videos/${id}`, { method: "DELETE" });
      setMessage("早教视频已删除");
      loadVideos();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function toggleStatus(video) {
    try {
      await adminRequest(`/admin/educational_videos/${video.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: video.status === "published" ? "draft" : "published" }),
      });
      loadVideos();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">早教视频管理</h1>
      <p className="mt-2 text-sm text-gray-500">上传视频并标注年龄、阶段、级别和学科。草稿不会出现在儿童端。</p>

      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="title" placeholder="视频标题" value={form.title} onChange={handleChange} required />
        <input className="rounded border p-2" name="stage" placeholder="阶段，如小班" value={form.stage} onChange={handleChange} required />
        <input className="rounded border p-2" name="level" placeholder="级别，如入门" value={form.level} onChange={handleChange} required />
        <input className="rounded border p-2" name="subject" placeholder="学科，如语言" value={form.subject} onChange={handleChange} required />
        <input className="rounded border p-2" name="min_age" type="number" min="0" placeholder="最小年龄" value={form.min_age} onChange={handleChange} required />
        <input className="rounded border p-2" name="max_age" type="number" min="0" placeholder="最大年龄" value={form.max_age} onChange={handleChange} required />
        <select className="rounded border p-2" name="status" value={form.status} onChange={handleChange}>
          <option value="draft">草稿</option>
          <option value="published">发布</option>
        </select>
        <input className="rounded border p-2" name="video_file" type="file" accept="video/*" onChange={handleChange} required={!editingId} />
        <textarea className="rounded border p-2 md:col-span-3" name="description" placeholder="视频简介" value={form.description} onChange={handleChange} />
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "上传"}</button>
          {editingId ? <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>取消</button> : null}
        </div>
      </form>

      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}

      <div className="mt-6 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">标题</th><th className="p-3">学科</th><th className="p-3">阶段/级别</th><th className="p-3">年龄</th><th className="p-3">状态</th><th className="p-3">操作</th></tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium text-gray-900">{video.title}</div>
                  <div className="text-xs text-gray-500">{video.video_filename || "无文件名"}</div>
                </td>
                <td className="p-3">{video.subject}</td>
                <td className="p-3">{video.stage} / {video.level}</td>
                <td className="p-3">{video.min_age}-{video.max_age} 岁</td>
                <td className="p-3">{video.status === "published" ? "已发布" : "草稿"}</td>
                <td className="p-3">
                  <button className="mr-2 rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(video)}>编辑</button>
                  <button className="mr-2 rounded border px-3 py-1 text-gray-700" onClick={() => toggleStatus(video)}>
                    {video.status === "published" ? "设为草稿" : "发布"}
                  </button>
                  <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(video.id)}>删除</button>
                </td>
              </tr>
            ))}
            {videos.length === 0 ? <tr><td className="p-6 text-center text-gray-500" colSpan="6">暂无早教视频</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
