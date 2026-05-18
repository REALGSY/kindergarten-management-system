import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../Modal/Modal";
import "./Classes.css";

function Classes() {
  const [classroom, setClassroom] = useState(undefined);
  const [modal, setModal] = useState(false);
  const [modalData, setModalData] = useState([]);
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

  function showStudents() {
    if (!classroom) return;
    axios
      .get(`/classrooms/${classroom.id}`, config)
      .then((res) => {
        setModalData(res.data.students || []);
        setModal(true);
      })
      .catch(() => setMessage("学生列表加载失败"));
  }

  if (classroom === undefined) {
    return <div className="mt-8 text-center text-pink-600">正在加载班级信息...</div>;
  }

  if (!classroom) {
    return (
      <div className="rounded-md bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">暂未分配班级</h1>
        <p className="mt-3 text-gray-600">教师不能自行认领或切换班级，请联系管理员完成分配。</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">我的班级</h1>
      {message ? <div className="mt-3 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}
      <div className="mt-6 max-w-sm rounded-md bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">当前负责班级</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#B124A3]">{classroom.name}</h2>
        <button className="mt-5 rounded bg-[#B124A3] px-4 py-2 text-white" onClick={showStudents}>
          查看学生
        </button>
      </div>
      {modal && <Modal setModal={setModal} modalData={modalData} />}
    </div>
  );
}

export default Classes;
