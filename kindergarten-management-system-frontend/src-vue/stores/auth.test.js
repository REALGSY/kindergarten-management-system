// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "./auth";

const rolePayloads = {
  admin: { admin: { id: 1, first_name: "管理员" }, jwt: "admin-jwt" },
  teacher: { teacher: { id: 2, first_name: "教师" }, jwt: "teacher-jwt" },
  parent: { parent: { id: 3, first_name: "家长" }, jwt: "parent-jwt" },
  child: { student: { id: 4, first_name: "儿童" }, jwt: "child-jwt" },
};

describe("role authentication persistence", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists and clears all four role sessions", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const auth = useAuthStore();

    for (const [role, payload] of Object.entries(rolePayloads)) {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } }));
      await auth.login(role, { password: "secret" });
      const tokenKey = { admin: "adminToken", teacher: "teacherToken", parent: "jwt", child: "childToken" }[role];
      const idKey = { admin: "admin", teacher: "teacher", parent: "parent", child: "child" }[role];
      const dataKey = { admin: "admin_data", teacher: "teacher_data", parent: "parent_data", child: "child_data" }[role];
      expect(localStorage.getItem(tokenKey)).toBe(payload.jwt);
      expect(localStorage.getItem(idKey)).toBe(String(payload[role === "child" ? "student" : role].id));
      expect(JSON.parse(localStorage.getItem(dataKey))).toMatchObject({ id: payload[role === "child" ? "student" : role].id });
      auth.logout(role);
      expect(localStorage.getItem(tokenKey)).toBeNull();
    }
  });

  it("hydrates legacy response-shaped teacher data after a refresh", () => {
    localStorage.setItem("teacherToken", "teacher-jwt");
    localStorage.setItem("teacher_data", JSON.stringify({ jwt: "teacher-jwt", teacher: { id: 8, first_name: "旧教师" } }));

    const auth = useAuthStore();
    expect(auth.hydrate("teacher")).toBe(true);
    expect(auth.profile).toMatchObject({ id: 8, first_name: "旧教师" });
    expect(auth.token).toBe("teacher-jwt");
  });

  it("clears the role session through the explicit unauthorized action", () => {
    localStorage.setItem("parentToken", "unused");
    localStorage.setItem("jwt", "expired");
    localStorage.setItem("parent", "3");
    localStorage.setItem("parent_data", "{}");

    const auth = useAuthStore();
    auth.hydrate("parent");
    expect(auth.redirectUnauthorized("parent")).toBe(true);
    expect(localStorage.getItem("jwt")).toBeNull();
    expect(auth.currentRole).toBe("");
  });
});
