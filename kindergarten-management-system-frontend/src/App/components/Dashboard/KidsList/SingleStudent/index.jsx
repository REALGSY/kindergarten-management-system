import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import "./singlestudent.css";
import icon from "./student.svg";
import { useParams, Link } from "react-router-dom";

function SingleStudent() {
  const [student, setStudent] = useState({});
  const token = localStorage.getItem("teacherToken");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);
  const { id } = useParams();

  useEffect(() => {
    axios.get(`/students/${id}`, config).then((data) => setStudent(data.data));
  }, [id, config]);

  return (
    <div className="modal">
      <div className="kid-card">
        <div className="avatar">
          <img src={icon} alt="学生头像" border="0" />
        </div>
        <h2 className="header-name">{student.first_name}</h2>
        <div className="text-card">
          <label>姓名：</label>
          <h3 className="h3">
            {student.first_name} {student.second_name} {student.surname}
          </h3>
          <label>详情：</label>
          <p className="details">年龄：{student.age}</p>
          <p>学号：{student.admission_number}</p>
          <span style={{ display: "inline" }}>
            描述：{student.description}
          </span>
        </div>
        <div className="buttonContainer">
          <Link to="/dashboard/addcase">
            <button
              className="button-10"
              type="submit"
              onClick={() => localStorage.setItem("studentId", student.id)}>
              添加纪律记录
            </button>
          </Link>
          <Link to="..">
            <button className="button-11" type="submit">
              返回
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SingleStudent;
