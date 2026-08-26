const roleStorage = {
  admin: { token: "adminToken", id: "admin", data: "admin_data", login: "/admin_login" },
  teacher: { token: "teacherToken", id: "teacher", data: "teacher_data", login: "/login" },
  parent: { token: "jwt", id: "parent", data: "parent_data", login: "/parent_login" },
  child: { token: "childToken", id: "child", data: "child_data", login: "/child_login" },
};

function normalize(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (base) return `${base}${normalize(path)}`;
  return `${import.meta.env.DEV ? "/__api" : ""}${normalize(path)}`;
}

export function mediaUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(?:data:|blob:|https?:\/\/|\/\/)/i.test(value)) return value;

  const base = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  return base ? `${base}${normalize(value)}` : normalize(value);
}

export function tokenFor(role) {
  const config = roleStorage[role];
  return config ? window.localStorage.getItem(config.token) : null;
}

export function clearRoleSession(role) {
  const config = roleStorage[role];
  if (!config) return;
  [config.token, config.id, config.data].forEach((key) => window.localStorage.removeItem(key));
}

export function roleLoginPath(role) {
  return roleStorage[role]?.login || "/login";
}

function notifyUnauthorized(role) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return false;
  if (typeof window.CustomEvent === "function") {
    window.dispatchEvent(new window.CustomEvent("parakindergarten:unauthorized", { detail: { role } }));
    return true;
  }
  return false;
}

function errorMessage(payload, fallback) {
  const value = payload?.errors || payload?.error || payload?.message;
  if (Array.isArray(value)) return value.join("，");
  if (value && typeof value === "object") {
    const messages = Object.values(value).flatMap((entry) => Array.isArray(entry) ? entry : [entry]).filter(Boolean);
    if (messages.length) return messages.join("，");
  }
  return value ? String(value) : fallback;
}

async function parseResponse(response, fallback) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const raw = await response.text();
    let payload = raw;
    try { payload = raw ? JSON.parse(raw) : null; } catch { /* Fall back to the raw response below. */ }
    if (!response.ok) {
      const error = new Error(errorMessage(payload, fallback));
      error.status = response.status;
      error.data = payload;
      throw error;
    }
    return payload;
  }
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || fallback);
    error.status = response.status;
    throw error;
  }
  return text;
}

export async function request(path, options = {}) {
  const { role, body, headers = {}, ...rest } = options;
  const requestHeaders = { Accept: "application/json", ...headers };
  const token = role ? tokenFor(role) : null;
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let payload = body;
  if (body && !(body instanceof FormData) && typeof body !== "string") {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(apiUrl(path), { ...rest, body: payload, headers: requestHeaders });
  } catch (cause) {
    const error = new Error(cause?.message || "网络连接失败，请稍后重试");
    error.cause = cause;
    throw error;
  }
  if (response.status === 401 && role) {
    clearRoleSession(role);
    const handled = notifyUnauthorized(role);
    if (!handled && window.location.pathname !== roleLoginPath(role) && import.meta.env.MODE !== "test") window.location.assign(roleLoginPath(role));
  }
  return parseResponse(response, "请求失败，请稍后重试");
}

export const api = {
  get: (path, role, options = {}) => request(path, { ...options, method: "GET", role }),
  post: (path, body, role, options = {}) => request(path, { ...options, method: "POST", body, role }),
  patch: (path, body, role, options = {}) => request(path, { ...options, method: "PATCH", body, role }),
  put: (path, body, role, options = {}) => request(path, { ...options, method: "PUT", body, role }),
  delete: (path, role, options = {}) => request(path, { ...options, method: "DELETE", role }),
  form: (path, formData, role, method = "POST") => request(path, { method, body: formData, role }),
};

export async function download(path, filename, role) {
  const response = await fetch(apiUrl(path), {
    headers: { Authorization: `Bearer ${tokenFor(role)}` },
  });
  if (response.status === 401) {
    clearRoleSession(role);
    const handled = notifyUnauthorized(role);
    if (!handled && window.location.pathname !== roleLoginPath(role) && import.meta.env.MODE !== "test") window.location.assign(roleLoginPath(role));
    return;
  }
  if (!response.ok) await parseResponse(response, "下载失败");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export { roleStorage };
