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

export function fullName(person) {
  return [person?.first_name, person?.second_name, person?.surname || person?.last_name]
    .filter(Boolean)
    .join(" ");
}
