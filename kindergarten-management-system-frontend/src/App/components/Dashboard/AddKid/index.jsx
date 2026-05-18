import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleUnauthorizedResponse } from "../../Auth/session";

const emptyStudent = { first_name: "", second_name: "", surname: "", admission_number: "", age: "3", description: "" };

function AddKid() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(emptyStudent);
  const [classroom, setClassroom] = useState(null);
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
      .then((res) => setClassroom(res.data.classroom))
      .catch(() => setMessage("班级信息加载失败"));
  }, [teacherId, config]);

  function handleChange(event) {
    setStudent({ ...student, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!classroom) {
      setMessage("你还没有分配班级，请联系管理员。");
      return;
    }

    try {
      const response = await fetch("/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(student),
      });
      if (handleUnauthorizedResponse(response.status, "teacher")) return;
      const data = await response.json();
      if (!response.ok) {
        throw new Error((data.errors || data.error || "学生添加失败").toString());
      }
      setMessage("学生添加成功");
      setTimeout(() => navigate("/dashboard/kids_list"), 800);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900">添加本班学生</h1>
      <p className="mt-2 text-sm text-gray-500">学生会自动加入你的当前班级：{classroom?.name || "未分配"}</p>
      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <form className="mt-6 grid grid-cols-1 gap-4 rounded-md bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="rounded border p-2" name="first_name" placeholder="名" value={student.first_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="second_name" placeholder="第二名" value={student.second_name} onChange={handleChange} required />
        <input className="rounded border p-2" name="surname" placeholder="姓" value={student.surname} onChange={handleChange} required />
        <input className="rounded border p-2" name="admission_number" placeholder="学号" value={student.admission_number} onChange={handleChange} required />
        <select className="rounded border p-2" name="age" value={student.age} onChange={handleChange} required>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((age) => <option key={age} value={age}>{age}</option>)}
        </select>
        <textarea className="rounded border p-2 md:col-span-2" name="description" placeholder="学生描述" value={student.description} onChange={handleChange} required />
        <div className="flex gap-3 md:col-span-2">
          <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">保存</button>
          <Link className="rounded border px-4 py-2 text-gray-700" to="/dashboard/kids_list">返回</Link>
        </div>
      </form>
    </div>
  );
}

export default AddKid;
