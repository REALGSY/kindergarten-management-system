import { handleUnauthorizedResponse } from "../Auth/session";
import { apiUrl, readJsonResponse } from "../Auth/apiClient";

export function adminHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function adminRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...adminHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await readJsonResponse(response, "管理员请求失败");
  if (handleUnauthorizedResponse(response.status, "admin")) return null;

  if (!response.ok) {
    throw new Error((data.errors || data.error || "操作失败").toString());
  }

  return data;
}

export async function adminFormRequest(path, formData, method = "POST") {
  const headers = adminHeaders();
  delete headers["Content-Type"];

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: formData,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await readJsonResponse(response, "管理员请求失败");
  if (handleUnauthorizedResponse(response.status, "admin")) return null;

  if (!response.ok) {
    const error = new Error((data.errors || data.error || "操作失败").toString());
    error.data = data;
    throw error;
  }

  return data;
}

export async function adminDownload(path, filename) {
  const headers = adminHeaders();
  delete headers["Content-Type"];

  const response = await fetch(apiUrl(path), { headers });
  if (handleUnauthorizedResponse(response.status, "admin")) return;

  if (!response.ok) {
    const data = await readJsonResponse(response, "管理员请求失败");
    throw new Error((data.errors || data.error || "下载失败").toString());
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function fullName(person) {
  return [person?.first_name, person?.second_name, person?.surname || person?.last_name]
    .filter(Boolean)
    .join(" ");
}
