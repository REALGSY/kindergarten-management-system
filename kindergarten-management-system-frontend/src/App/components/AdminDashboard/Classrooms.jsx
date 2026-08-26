import React, { useEffect, useState } from "react";
import { adminDownload, adminFormRequest, adminRequest } from "./api";

function ClassroomsAdmin() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", teacher_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    Promise.all([adminRequest("/admin/classrooms"), adminRequest("/admin/teachers")])
      .then(([classroomData, teacherData]) => {
        setClassrooms(classroomData);
        setTeachers(teacherData);
      })
      .catch((err) => setMessage(err.message));
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function startEdit(classroom) {
    setEditingId(classroom.id);
    setForm({ name: classroom.name || "", teacher_id: classroom.teacher?.id || classroom.teacher_id || "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await adminRequest(editingId ? `/admin/classrooms/${editingId}` : "/admin/classrooms", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setMessage(editingId ? "班级已更新" : "班级已创建");
      setEditingId(null);
      setForm({ name: "", teacher_id: "" });
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await adminRequest(`/admin/classrooms/${id}`, { method: "DELETE" });
      setMessage("班级已删除");
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleTemplateDownload(format) {
    try {
      await adminDownload(`/admin/classroom_imports/template?format=${format}`, `班级导入模板.${format}`);
      setImportMessage("模板已下载");
    } catch (err) {
      setImportMessage(err.message);
    }
  }

  function handleImportFileChange(event) {
    setImportFile(event.target.files?.[0] || null);
    setImportPreview(null);
    setImportMessage("");
  }

  function buildImportFormData() {
    const data = new FormData();
    data.append("file", importFile);
    return data;
  }

  async function handlePreview(event) {
    event.preventDefault();
    if (!importFile) {
      setImportMessage("请先选择要导入的 Excel 或 CSV 文件");
      return;
    }

    setIsParsing(true);
    setImportMessage("");
    try {
      const preview = await adminFormRequest("/admin/classroom_imports/preview", buildImportFormData());
      setImportPreview(preview);
      setImportMessage(preview?.valid ? "解析成功，请确认后导入" : "解析完成，请修正表格中的问题后重新上传");
    } catch (err) {
      setImportPreview(err.data || null);
      setImportMessage(err.message);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleConfirmImport() {
    if (!importFile || !importPreview?.valid) return;

    setIsImporting(true);
    setImportMessage("");
    try {
      const result = await adminFormRequest("/admin/classroom_imports", buildImportFormData());
      setImportPreview(result);
      setImportMessage("班级和学生已导入");
      setImportFile(null);
      setFileInputKey((key) => key + 1);
      loadData();
    } catch (err) {
      setImportPreview(err.data || importPreview);
      setImportMessage(err.message);
    } finally {
      setIsImporting(false);
    }
  }

  function resetImport() {
    setImportFile(null);
    setImportPreview(null);
    setImportMessage("");
    setFileInputKey((key) => key + 1);
  }

  const importErrors = importPreview?.errors || [];
  const previewStudents = importPreview?.students || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">班级管理</h1>

      <form className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-3" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="name" placeholder="班级名称" value={form.name} onChange={handleChange} required />
        <select className="rounded border p-2" name="teacher_id" value={form.teacher_id} onChange={handleChange}>
          <option value="">暂不分配教师</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>{teacher.career_name} - {teacher.first_name} {teacher.last_name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">{editingId ? "保存" : "新增"}</button>
          {editingId ? (
            <button className="rounded border px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm({ name: "", teacher_id: "" }); }}>
              取消
            </button>
          ) : null}
        </div>
      </form>

      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}

      <section className="mt-6 rounded-md bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">导入班级与学生</h2>
            <p className="mt-1 text-sm text-gray-500">支持 .xlsx 和 .csv。每次导入一个班级，解析无误后再确认创建。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded border px-3 py-2 text-sm text-pink-700" type="button" onClick={() => handleTemplateDownload("xlsx")}>
              下载 XLSX 模板
            </button>
            <button className="rounded border px-3 py-2 text-sm text-pink-700" type="button" onClick={() => handleTemplateDownload("csv")}>
              下载 CSV 模板
            </button>
          </div>
        </div>

        <form className="mt-4 flex flex-col gap-3 md:flex-row md:items-center" onSubmit={handlePreview}>
          <input
            key={fileInputKey}
            className="w-full rounded border p-2 md:max-w-md"
            type="file"
            accept=".xlsx,.csv"
            onChange={handleImportFileChange}
          />
          <div className="flex gap-2">
            <button className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50" type="submit" disabled={isParsing}>
              {isParsing ? "解析中..." : "一键解析"}
            </button>
            <button className="rounded border px-4 py-2" type="button" onClick={resetImport}>
              清空
            </button>
          </div>
        </form>

        {importMessage ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{importMessage}</div> : null}

        {importPreview ? (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-gray-500">班级名称</p>
                <p className="font-medium text-gray-900">{importPreview.classroom?.name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">教师工号名</p>
                <p className="font-medium text-gray-900">{importPreview.classroom?.teacher_career_name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">教师姓名</p>
                <p className="font-medium text-gray-900">{importPreview.classroom?.teacher_name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">学生数量</p>
                <p className="font-medium text-gray-900">{previewStudents.length}</p>
              </div>
            </div>

            {importErrors.length ? (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {importErrors.map((error, index) => (
                  <div key={`${error.row || "global"}-${index}`}>
                    {error.row ? `第 ${error.row} 行：` : ""}
                    {error.messages?.join("，")}
                  </div>
                ))}
              </div>
            ) : null}

            {previewStudents.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2">行号</th>
                      <th className="p-2">学号</th>
                      <th className="p-2">姓名</th>
                      <th className="p-2">年龄</th>
                      <th className="p-2">学生描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewStudents.map((student) => (
                      <tr key={`${student.row_number}-${student.admission_number}`} className="border-t">
                        <td className="p-2">{student.row_number}</td>
                        <td className="p-2">{student.admission_number ?? "-"}</td>
                        <td className="p-2">{[student.first_name, student.second_name, student.surname].filter(Boolean).join(" ") || "-"}</td>
                        <td className="p-2">{student.age ?? "-"}</td>
                        <td className="p-2">{student.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {importFile && importPreview.valid && !importPreview.imported ? (
              <button className="mt-4 rounded bg-[#B124A3] px-4 py-2 text-white disabled:opacity-50" type="button" onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? "导入中..." : "确认导入"}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {classrooms.map((classroom) => (
          <div key={classroom.id} className="rounded-md bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{classroom.name}</h2>
            <p className="mt-2 text-sm text-gray-500">教师：{classroom.teacher?.career_name || "未分配"}</p>
            <p className="text-sm text-gray-500">学生：{classroom.students?.length || 0}</p>
            <div className="mt-4 flex gap-2">
              <button className="rounded border px-3 py-1 text-pink-700" onClick={() => startEdit(classroom)}>编辑</button>
              <button className="rounded border px-3 py-1 text-red-600" onClick={() => handleDelete(classroom.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClassroomsAdmin;
