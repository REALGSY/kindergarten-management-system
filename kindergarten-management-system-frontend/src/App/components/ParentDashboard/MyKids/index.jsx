import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const statusLabel = {
  pending: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
};

export default function MyKids() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [passwordInputs, setPasswordInputs] = useState({});
  const [savingPasswordId, setSavingPasswordId] = useState(null);
  const token = localStorage.getItem("jwt");
  const parentId = localStorage.getItem("parent");
  const config = useMemo(() => ({
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadData() {
    Promise.all([axios.get(`/parents/${parentId}`, config), axios.get("/parent_students", config)])
      .then(([parentRes, linkRes]) => {
        setStudents(parentRes.data.students || []);
        setApplications(Array.isArray(linkRes.data) ? linkRes.data : []);
      })
      .catch(() => setMessage("孩子信息加载失败"));
  }

  async function addKid(event) {
    event.preventDefault();
    setMessage("");
    try {
      await axios.post("/parent_students", { admission_number: admissionNumber }, config);
      setAdmissionNumber("");
      setMessage("绑定申请已提交，等待管理员审批。");
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.errors || "未找到该学号对应的孩子");
    }
  }

  async function updateChildPassword(studentId) {
    const password = (passwordInputs[studentId] || "").trim();
    if (!password) {
      setMessage("请输入新的儿童端密码。");
      return;
    }

    setSavingPasswordId(studentId);
    setMessage("");
    try {
      await axios.patch(`/parent/children/${studentId}/password`, { password }, config);
      setPasswordInputs((current) => ({ ...current, [studentId]: "" }));
      setMessage("儿童端密码已更新。");
    } catch (error) {
      setMessage(error.response?.data?.errors || error.response?.data?.error || "儿童端密码更新失败");
    } finally {
      setSavingPasswordId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">我的孩子</h1>
      <p className="mt-2 text-sm text-gray-500">提交学号后需要管理员审批，通过后才能查看孩子详情。儿童端默认密码为 123456。</p>
      <form className="mt-4 flex flex-wrap gap-2 rounded-md bg-white p-4 shadow-sm" onSubmit={addKid}>
        <input className="rounded border p-2" value={admissionNumber} onChange={(event) => setAdmissionNumber(event.target.value)} type="number" placeholder="请输入孩子学号" required />
        <button className="rounded bg-[#B124A3] px-4 py-2 text-white" type="submit">提交绑定申请</button>
      </form>
      {message ? <div className="mt-4 rounded bg-pink-50 p-2 text-pink-700">{message}</div> : null}

      <h2 className="mt-8 text-lg font-semibold text-gray-900">审批状态</h2>
      <div className="mt-3 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">孩子</th><th className="p-3">学号</th><th className="p-3">状态</th></tr></thead>
          <tbody>
            {applications.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.student_name}</td>
                <td className="p-3">{item.admission_number}</td>
                <td className="p-3">{statusLabel[item.status] || item.status}</td>
              </tr>
            ))}
            {applications.length === 0 ? <tr><td className="p-6 text-center text-gray-500" colSpan="3">暂无绑定申请</td></tr> : null}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">已通过的孩子</h2>
      <div className="mt-3 overflow-x-auto rounded-md bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">学号</th><th className="p-3">姓名</th><th className="p-3">儿童端密码</th><th className="p-3">操作</th></tr></thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="p-3">{student.admission_number}</td>
                <td className="p-3">{student.first_name} {student.second_name} {student.surname}</td>
                <td className="p-3">
                  <div className="flex min-w-[240px] flex-wrap gap-2">
                    <input
                      className="min-w-0 flex-1 rounded border p-2"
                      type="password"
                      placeholder="输入新密码"
                      value={passwordInputs[student.id] || ""}
                      onChange={(event) => setPasswordInputs((current) => ({ ...current, [student.id]: event.target.value }))}
                    />
                    <button
                      className="rounded border px-3 py-1 text-pink-700 disabled:opacity-50"
                      type="button"
                      onClick={() => updateChildPassword(student.id)}
                      disabled={savingPasswordId === student.id}>
                      {savingPasswordId === student.id ? "保存中" : "设置"}
                    </button>
                  </div>
                </td>
                <td className="p-3"><Link className="rounded border px-3 py-1 text-pink-700" to={`${student.id}`}>查看</Link></td>
              </tr>
            ))}
            {students.length === 0 ? <tr><td className="p-6 text-center text-gray-500" colSpan="4">暂无已通过的孩子</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
