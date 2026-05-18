import axios from "axios";

const roleConfig = {
  admin: {
    tokenKeys: ["adminToken", "admin", "admin_data"],
    loginPath: "/admin_login",
  },
  teacher: {
    tokenKeys: ["teacherToken", "teacher", "teacher_data", "studentId"],
    loginPath: "/login",
  },
  parent: {
    tokenKeys: ["jwt", "parent", "parent_data"],
    loginPath: "/parent_login",
  },
};

function roleFromPath() {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/parent")) return "parent";
  return "teacher";
}

export function clearRoleSession(role) {
  roleConfig[role]?.tokenKeys.forEach((key) => localStorage.removeItem(key));
}

export function handleUnauthorized(role = roleFromPath()) {
  const loginPath = roleConfig[role]?.loginPath || "/login";
  clearRoleSession(role);
  if (window.location.pathname !== loginPath) {
    window.location.assign(loginPath);
  }
}

export function handleUnauthorizedResponse(status, role) {
  if (status === 401) {
    handleUnauthorized(role);
    return true;
  }
  return false;
}

export function configureAxiosUnauthorizedHandling() {
  if (window.__kindergartenAuthInterceptor) return;

  window.__kindergartenAuthInterceptor = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        handleUnauthorized();
      }
      return Promise.reject(error);
    }
  );
}
