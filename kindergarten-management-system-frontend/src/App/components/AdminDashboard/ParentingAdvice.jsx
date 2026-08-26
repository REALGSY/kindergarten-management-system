import React, { useEffect, useMemo, useState } from "react";
import { adminRequest } from "./api";

const emptyScheduleForm = {
  source_type: "custom",
  title: "",
  body: "",
  recurrence: "daily",
  immediate_send: false,
  scheduled_at: "",
  send_time: "08:00",
  weekday: "1",
};

const recurrenceLabel = {
  one_time: "单次",
  daily: "每天",
  weekly: "每周",
};

const sourceTypeLabel = {
  custom: "自定义邮件",
  whitelist: "白名单自动内容",
};

const statusLabel = {
  active: "启用",
  paused: "暂停",
  completed: "已完成",
  deleted: "已删除",
};

const deliveryStatusLabel = {
  running: "发送中",
  succeeded: "成功",
  partial: "部分失败",
  failed: "失败",
};

const weekdayLabel = {
  1: "周一",
  2: "周二",
  3: "周三",
  4: "周四",
  5: "周五",
  6: "周六",
  7: "周日",
};

function formatBeijingTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function scheduleTimeLabel(schedule) {
  if (!schedule) return "-";
  if (schedule.recurrence === "one_time") return formatBeijingTime(schedule.scheduled_at);
  if (schedule.recurrence === "daily") return `每天 ${schedule.send_time}`;
  if (schedule.recurrence === "weekly") return `${weekdayLabel[schedule.weekday] || "每周"} ${schedule.send_time}`;
  return "-";
}

function ToggleCheckbox({ checked, label, meta, onChange }) {
  return (
    <label className="flex min-h-[56px] items-start gap-3 rounded border bg-white p-3 text-sm">
      <input className="mt-1" type="checkbox" checked={checked} onChange={onChange} />
      <span className="min-w-0">
        <span className="block font-medium text-gray-900">{label}</span>
        <span className="block break-all text-gray-500">{meta}</span>
      </span>
    </label>
  );
}

function ParentingAdviceAdmin() {
  const [schedules, setSchedules] = useState([]);
  const [recipientOptions, setRecipientOptions] = useState({ parents: [], external_email_recipients: [] });
  const [externalRecipients, setExternalRecipients] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [externalForm, setExternalForm] = useState({ name: "", email: "" });
  const [selectedParentIds, setSelectedParentIds] = useState([]);
  const [selectedExternalIds, setSelectedExternalIds] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const activeExternalRecipients = useMemo(
    () => externalRecipients.filter((recipient) => recipient.active),
    [externalRecipients]
  );

  async function loadAll() {
    try {
      const [scheduleData, optionData, externalData] = await Promise.all([
        adminRequest("/admin/parenting_advice_schedules"),
        adminRequest("/admin/parenting_advice/recipient_options"),
        adminRequest("/admin/external_email_recipients"),
      ]);
      setSchedules(scheduleData || []);
      setRecipientOptions(optionData || { parents: [], external_email_recipients: [] });
      setExternalRecipients(externalData || []);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadSchedules() {
    const scheduleData = await adminRequest("/admin/parenting_advice_schedules");
    setSchedules(scheduleData || []);
  }

  async function loadRecipientData() {
    const [optionData, externalData] = await Promise.all([
      adminRequest("/admin/parenting_advice/recipient_options"),
      adminRequest("/admin/external_email_recipients"),
    ]);
    setRecipientOptions(optionData || { parents: [], external_email_recipients: [] });
    setExternalRecipients(externalData || []);
  }

  function updateScheduleForm(event) {
    const { name, type, checked, value } = event.target;
    if (name === "source_type" && value === "whitelist") {
      setScheduleForm({
        ...scheduleForm,
        source_type: value,
        title: scheduleForm.title || "本期育儿精选",
        body: "",
      });
      return;
    }

    if (name === "recurrence") {
      setScheduleForm({
        ...scheduleForm,
        recurrence: value,
        immediate_send: value === "one_time" ? scheduleForm.immediate_send : false,
      });
      return;
    }

    setScheduleForm({ ...scheduleForm, [name]: type === "checkbox" ? checked : value });
  }

  function updateExternalForm(event) {
    setExternalForm({ ...externalForm, [event.target.name]: event.target.value });
  }

  function toggleSelected(values, setValues, id) {
    const value = String(id);
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function handleCreateExternal(event) {
    event.preventDefault();
    try {
      const created = await adminRequest("/admin/external_email_recipients", {
        method: "POST",
        body: JSON.stringify(externalForm),
      });
      setMessage("外部邮箱成员已新增");
      setExternalForm({ name: "", email: "" });
      await loadRecipientData();
      if (created?.id) {
        setSelectedExternalIds((values) => [...new Set([...values, String(created.id)])]);
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deactivateExternalRecipient(id) {
    try {
      await adminRequest(`/admin/external_email_recipients/${id}`, { method: "DELETE" });
      setMessage("外部邮箱成员已停用");
      setSelectedExternalIds((values) => values.filter((value) => value !== String(id)));
      await loadRecipientData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleCreateSchedule(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        source_type: scheduleForm.source_type,
        title: scheduleForm.title || (scheduleForm.source_type === "whitelist" ? "本期育儿精选" : ""),
        body: scheduleForm.source_type === "whitelist" ? "" : scheduleForm.body,
        recurrence: scheduleForm.recurrence,
        parent_ids: selectedParentIds,
        external_email_recipient_ids: selectedExternalIds,
      };

      if (scheduleForm.recurrence === "one_time") {
        payload.immediate_send = scheduleForm.immediate_send;
        if (!scheduleForm.immediate_send) payload.scheduled_at = scheduleForm.scheduled_at;
      } else {
        payload.send_time = scheduleForm.send_time;
      }

      if (scheduleForm.recurrence === "weekly") {
        payload.weekday = scheduleForm.weekday;
      }

      const created = await adminRequest("/admin/parenting_advice_schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const immediateDelivery = scheduleForm.immediate_send ? created?.deliveries?.[0] : null;
      if (immediateDelivery?.status === "succeeded") {
        setMessage("邮件已立即发送");
      } else if (immediateDelivery?.status === "partial") {
        setMessage("立即发送已完成，部分收件人发送失败，请查看发送记录");
      } else if (scheduleForm.immediate_send) {
        setMessage("立即发送未成功，请查看发送记录中的错误信息");
      } else {
        setMessage("育儿建议推送计划已创建");
      }
      setScheduleForm(emptyScheduleForm);
      setSelectedParentIds([]);
      setSelectedExternalIds([]);
      setSelectedSchedule(created);
      await loadSchedules();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadScheduleDetail(id) {
    try {
      const detail = await adminRequest(`/admin/parenting_advice_schedules/${id}`);
      setSelectedSchedule(detail);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function updateScheduleStatus(id, action) {
    try {
      await adminRequest(`/admin/parenting_advice_schedules/${id}/${action}`, { method: "PATCH" });
      setMessage(action === "pause" ? "推送计划已暂停" : "推送计划已恢复");
      await loadSchedules();
      if (selectedSchedule?.id === id) await loadScheduleDetail(id);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteSchedule(id) {
    try {
      await adminRequest(`/admin/parenting_advice_schedules/${id}`, { method: "DELETE" });
      setMessage("推送计划已删除");
      if (selectedSchedule?.id === id) setSelectedSchedule(null);
      await loadSchedules();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">育儿建议推送</h1>
          <p className="mt-1 text-sm text-gray-500">创建单次、每日或每周邮件推送计划。</p>
        </div>
        <button className="rounded border bg-white px-3 py-2 text-sm text-gray-700" type="button" onClick={loadAll}>
          刷新
        </button>
      </div>

      {message ? <div className="mt-4 rounded bg-pink-50 p-3 text-sm text-pink-700">{message}</div> : null}

      <section className="mt-6 rounded-md bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">新建推送计划</h2>
        <form className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3" onSubmit={handleCreateSchedule}>
          <select className="rounded border p-2" name="source_type" value={scheduleForm.source_type} onChange={updateScheduleForm}>
            <option value="custom">自定义邮件</option>
            <option value="whitelist">白名单自动内容</option>
          </select>
          <input
            className="rounded border p-2"
            name="title"
            placeholder="邮件标题"
            value={scheduleForm.title}
            onChange={updateScheduleForm}
            required
          />
          <select className="rounded border p-2" name="recurrence" value={scheduleForm.recurrence} onChange={updateScheduleForm}>
            <option value="one_time">单次</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
          </select>
          {scheduleForm.recurrence === "one_time" ? (
            <div className="flex min-h-[42px] flex-wrap items-center gap-3 rounded border bg-white px-3 py-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <input
                  name="immediate_send"
                  type="checkbox"
                  checked={scheduleForm.immediate_send}
                  onChange={updateScheduleForm}
                />
                立即发送
              </label>
              {!scheduleForm.immediate_send ? (
                <input
                  className="min-w-[220px] flex-1 rounded border p-2"
                  name="scheduled_at"
                  type="datetime-local"
                  value={scheduleForm.scheduled_at}
                  onChange={updateScheduleForm}
                  required
                />
              ) : (
                <span className="text-sm text-gray-500">创建后立即执行并记录发送结果</span>
              )}
            </div>
          ) : (
            <input
              className="rounded border p-2"
              name="send_time"
              type="time"
              value={scheduleForm.send_time}
              onChange={updateScheduleForm}
              required
            />
          )}
          {scheduleForm.recurrence === "weekly" ? (
            <select className="rounded border p-2" name="weekday" value={scheduleForm.weekday} onChange={updateScheduleForm}>
              {Object.entries(weekdayLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          ) : null}
          {scheduleForm.source_type === "custom" ? (
            <textarea
              className="min-h-[120px] rounded border p-2 lg:col-span-3"
              name="body"
              placeholder="育儿建议正文"
              value={scheduleForm.body}
              onChange={updateScheduleForm}
              required
            />
          ) : (
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800 lg:col-span-3">
              将从 UNICEF 中国、国家卫健委妇幼健康司、中国疾控中心、中国营养学会、CDC 自动筛选 3 条白名单内容。
            </div>
          )}

          <div className="lg:col-span-3">
            <p className="mb-2 text-sm font-medium text-gray-700">勾选家长绑定邮箱</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {recipientOptions.parents.length ? recipientOptions.parents.map((parent) => (
                <ToggleCheckbox
                  key={parent.id}
                  checked={selectedParentIds.includes(String(parent.id))}
                  label={parent.name || `家长 #${parent.id}`}
                  meta={`${parent.email} · ${parent.phone_number || ""}`}
                  onChange={() => toggleSelected(selectedParentIds, setSelectedParentIds, parent.id)}
                />
              )) : <div className="rounded border border-dashed p-3 text-sm text-gray-500">暂无已绑定邮箱的家长</div>}
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="mb-2 text-sm font-medium text-gray-700">勾选外部邮箱成员</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {activeExternalRecipients.length ? activeExternalRecipients.map((recipient) => (
                <ToggleCheckbox
                  key={recipient.id}
                  checked={selectedExternalIds.includes(String(recipient.id))}
                  label={recipient.name}
                  meta={recipient.email}
                  onChange={() => toggleSelected(selectedExternalIds, setSelectedExternalIds, recipient.id)}
                />
              )) : <div className="rounded border border-dashed p-3 text-sm text-gray-500">暂无外部邮箱成员</div>}
            </div>
          </div>

          <div className="lg:col-span-3">
            <button className="rounded bg-[#B124A3] px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? (scheduleForm.immediate_send ? "发送中..." : "创建中...") : (scheduleForm.immediate_send ? "立即发送" : "创建计划")}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-md bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">外部邮箱通讯录</h2>
        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateExternal}>
          <input className="rounded border p-2" name="name" placeholder="姓名" value={externalForm.name} onChange={updateExternalForm} required />
          <input className="rounded border p-2" name="email" type="email" placeholder="邮箱" value={externalForm.email} onChange={updateExternalForm} required />
          <button className="rounded border px-4 py-2 text-pink-700" type="submit">新增成员</button>
        </form>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">姓名</th><th className="p-3">邮箱</th><th className="p-3">状态</th><th className="p-3">操作</th></tr>
            </thead>
            <tbody>
              {externalRecipients.map((recipient) => (
                <tr key={recipient.id} className="border-t">
                  <td className="p-3">{recipient.name}</td>
                  <td className="p-3">{recipient.email}</td>
                  <td className="p-3">{recipient.active ? "启用" : "停用"}</td>
                  <td className="p-3">
                    {recipient.active ? (
                      <button className="rounded border px-3 py-1 text-red-600" type="button" onClick={() => deactivateExternalRecipient(recipient.id)}>
                        停用
                      </button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-md bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">推送计划</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">标题</th><th className="p-3">类型</th><th className="p-3">周期</th><th className="p-3">发送时间</th><th className="p-3">下次发送</th><th className="p-3">状态</th><th className="p-3">最近结果</th><th className="p-3">操作</th></tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-t align-top">
                  <td className="p-3 font-medium text-gray-900">{schedule.title}</td>
                  <td className="p-3">{sourceTypeLabel[schedule.source_type] || schedule.source_type}</td>
                  <td className="p-3">{recurrenceLabel[schedule.recurrence] || schedule.recurrence}</td>
                  <td className="p-3">{scheduleTimeLabel(schedule)}</td>
                  <td className="p-3">{formatBeijingTime(schedule.next_run_at)}</td>
                  <td className="p-3">{statusLabel[schedule.status] || schedule.status}</td>
                  <td className="p-3">
                    {schedule.last_delivery
                      ? `${deliveryStatusLabel[schedule.last_delivery.status] || schedule.last_delivery.status}，成功 ${schedule.last_delivery.sent_count} / 失败 ${schedule.last_delivery.failed_count}`
                      : "-"}
                  </td>
                  <td className="space-x-2 p-3">
                    <button className="rounded border px-3 py-1 text-pink-700" type="button" onClick={() => loadScheduleDetail(schedule.id)}>详情</button>
                    {schedule.status === "active" ? (
                      <button className="rounded border px-3 py-1 text-amber-700" type="button" onClick={() => updateScheduleStatus(schedule.id, "pause")}>暂停</button>
                    ) : null}
                    {schedule.status === "paused" ? (
                      <button className="rounded border px-3 py-1 text-green-700" type="button" onClick={() => updateScheduleStatus(schedule.id, "resume")}>恢复</button>
                    ) : null}
                    <button className="rounded border px-3 py-1 text-red-600" type="button" onClick={() => deleteSchedule(schedule.id)}>删除</button>
                  </td>
                </tr>
              ))}
              {!schedules.length ? (
                <tr><td className="p-4 text-center text-gray-500" colSpan="8">暂无推送计划</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSchedule ? (
        <section className="mt-6 rounded-md bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">计划详情：{selectedSchedule.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{sourceTypeLabel[selectedSchedule.source_type] || selectedSchedule.source_type}</p>
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">收件人</p>
              <div className="mt-2 space-y-2">
                {selectedSchedule.recipients?.map((recipient) => (
                  <div key={recipient.id} className="rounded border p-3 text-sm">
                    <p className="font-medium text-gray-900">{recipient.name}</p>
                    <p className="break-all text-gray-500">{recipient.email}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">最近发送记录</p>
              <div className="mt-2 space-y-3">
                {selectedSchedule.deliveries?.length ? selectedSchedule.deliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded border p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium text-gray-900">{formatBeijingTime(delivery.scheduled_run_at)}</span>
                      <span>{deliveryStatusLabel[delivery.status] || delivery.status}</span>
                    </div>
                    <p className="mt-1 text-gray-500">成功 {delivery.sent_count}，失败 {delivery.failed_count}</p>
                    {delivery.email_subject ? <p className="mt-1 text-gray-700">邮件标题：{delivery.email_subject}</p> : null}
                    {delivery.error_message ? <p className="mt-1 break-all text-red-600">{delivery.error_message}</p> : null}
                    {delivery.content_items?.length ? (
                      <div className="mt-3 space-y-2">
                        {delivery.content_items.map((item) => (
                          <div key={item.id} className="rounded bg-gray-50 p-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-gray-900">{item.position}. {item.title}</span>
                              <span className="text-gray-500">{item.source}</span>
                            </div>
                            <p className="mt-1 text-gray-500">{item.date} · {item.topic} · {item.age_group}</p>
                            <p className="mt-1 text-gray-700">{item.summary}</p>
                            <a className="mt-1 inline-block break-all text-pink-700" href={item.url} target="_blank" rel="noreferrer">原链接</a>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {delivery.ai_analysis ? (
                      <div className="mt-3 rounded bg-green-50 p-2 text-green-900">
                        <p className="font-medium">AI 综合分析</p>
                        <p className="mt-1">{delivery.ai_analysis}</p>
                      </div>
                    ) : null}
                    <div className="mt-2 space-y-1">
                      {delivery.recipients?.map((recipient) => (
                        <div key={recipient.id} className="flex flex-wrap justify-between gap-2 rounded bg-gray-50 px-2 py-1">
                          <span className="break-all">{recipient.email}</span>
                          <span className={recipient.status === "succeeded" ? "text-green-700" : "text-red-600"}>
                            {recipient.status === "succeeded" ? "成功" : `失败：${recipient.error_message || ""}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : <div className="rounded border border-dashed p-3 text-sm text-gray-500">暂无发送记录</div>}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ParentingAdviceAdmin;
