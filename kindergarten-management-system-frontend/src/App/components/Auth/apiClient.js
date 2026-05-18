const API_PORT = "3000";

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function apiUrl(path) {
  const normalizedPath = normalizePath(path);
  const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return `${trimTrailingSlash(configuredBaseUrl)}${normalizedPath}`;
  }

  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    const { hostname, port } = window.location;

    if (hostname && port !== API_PORT) {
      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      return `${protocol}//${hostname}:${API_PORT}${normalizedPath}`;
    }
  }

  return normalizedPath;
}

export async function readJsonResponse(response, fallbackMessage = "请求失败") {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  await response.text();
  throw new Error(
    `${fallbackMessage}：后端没有返回 JSON，请确认 Rails API 已启动，并且前端 API 地址配置正确。`
  );
}
