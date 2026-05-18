import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleUnauthorizedResponse } from "../Auth/session";
import "./addcase.css";
function AddCase({ setView, setAddCase, setDisciplanes }) {
  const token = localStorage.getItem("teacherToken");
  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const [postCase, setPostCase] = useState({
    student_id: studentId,
    title: "",
    description: "",
    date: "",
  });
  function onSubmit(e) {
    e.preventDefault();
    fetch("/disciplines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postCase),
    })
      .then((res) => {
        if (handleUnauthorizedResponse(res.status, "teacher")) return null;
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error((data.errors || data.error || "纪律记录添加失败").toString());
          });
        }
        return res.json();
      })
      .then((res) => {
        if (setDisciplanes) {
          setDisciplanes((items) => [res, ...items]);
        }
        if (setAddCase) {
          setAddCase(false);
        } else {
          navigate("/dashboard/discipline");
        }
      })
      .catch((error) => alert(error.message));
  }

  function hideAddCase() {
    if (setAddCase) {
      setAddCase(false);
    } else {
      navigate(-1);
    }
  }

  function reopenView() {
    if (setView) {
      setView(true);
    }
    hideAddCase();
  }

  return (
    <div className="edit-modal">
      <div className="add-card">
        <div className="inputs">
          <form className="input-forms" onSubmit={onSubmit}>
            <label>标题：</label>
            <input
              type="text"
              className="title"
              onChange={(e) =>
                setPostCase({ ...postCase, title: e.target.value })
              }
            />
            <label>日期：</label>
            <input
              type="date"
              className="date"
              onChange={(e) =>
                setPostCase({ ...postCase, date: e.target.value })
              }
            />
            <label>描述：</label>
            <input
              type="text"
              className="description"
              onChange={(e) =>
                setPostCase({ ...postCase, description: e.target.value })
              }
            />
            <div className="btn-wrapper">
              <Link to="/dashboard/discipline">
                <button
                  className="button-12"
                  type="button"
                  onClick={reopenView}>
                  返回
                </button>
              </Link>
              <button className="button-13" type="submit">
                添加
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCase;
