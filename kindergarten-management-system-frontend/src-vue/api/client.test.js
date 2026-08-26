// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, apiUrl, clearRoleSession, mediaUrl, request } from "./client";

describe("Vue API client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("uses the development API prefix when no base URL is configured", () => {
    expect(apiUrl("/admin/summary")).toBe("/__api/admin/summary");
    expect(apiUrl("students")).toBe("/__api/students");
  });

  it("resolves Rails media paths without changing absolute sources", () => {
    expect(mediaUrl("/rails/active_storage/blobs/redirect/example/video.mp4")).toBe("/rails/active_storage/blobs/redirect/example/video.mp4");
    expect(mediaUrl("https://cdn.example.test/video.mp4")).toBe("https://cdn.example.test/video.mp4");
    expect(mediaUrl("blob:https://example.test/video-id")).toBe("blob:https://example.test/video-id");
    expect(mediaUrl("")).toBe("");
  });

  it("serializes JSON and attaches the role token", async () => {
    localStorage.setItem("adminToken", "secret-token");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await api.post("/admin/teachers", { first_name: "A" }, "admin");

    expect(fetchMock).toHaveBeenCalledWith("/__api/admin/teachers", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ first_name: "A" }),
      headers: expect.objectContaining({ Authorization: "Bearer secret-token", "Content-Type": "application/json" }),
    }));
  });

  it("exposes backend errors and clears the role session on unauthorized responses", async () => {
    localStorage.setItem("teacherToken", "expired");
    localStorage.setItem("teacher", "3");
    localStorage.setItem("teacher_data", "{}");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: ["失效会话"] }), { status: 401, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(request("/students", { role: "teacher" })).rejects.toThrow("失效会话");
    expect(localStorage.getItem("teacherToken")).toBeNull();
    clearRoleSession("teacher");
  });

  it("emits the role-aware unauthorized event for the mounted auth store", async () => {
    localStorage.setItem("parent", "3");
    localStorage.setItem("jwt", "expired");
    const listener = vi.fn();
    window.addEventListener("parakindergarten:unauthorized", listener);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "expired" }), { status: 401, headers: { "content-type": "application/json" } })));

    await expect(request("/parent_students", { role: "parent" })).rejects.toThrow("expired");
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { role: "parent" } }));
    window.removeEventListener("parakindergarten:unauthorized", listener);
  });

  it("normalizes malformed JSON and network failures", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("not-json", { status: 502, headers: { "content-type": "application/json" } }))
      .mockRejectedValueOnce(new Error("offline")));
    await expect(request("/students")).rejects.toThrow("请求失败，请稍后重试");
    await expect(request("/students")).rejects.toThrow("offline");
  });

  it("flattens validation error objects into a readable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { email: ["邮箱格式不正确"], password: "密码不能为空" } }), { status: 422, headers: { "content-type": "application/json" } })));
    await expect(request("/parents", { method: "POST", body: {} })).rejects.toThrow("邮箱格式不正确，密码不能为空");
  });
});
