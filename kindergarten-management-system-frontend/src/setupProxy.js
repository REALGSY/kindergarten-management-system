const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.REACT_APP_API_PROXY_TARGET || "http://localhost:3000";

const apiPrefixes = [
  "/attendances",
  "/disciplines",
  "/parent_students",
  "/parents",
  "/students",
  "/teachers",
  "/classrooms",
  "/admin",
  "/child",
  "/parent",
  "/rails/active_storage",
  "/profile",
  "/teacher",
];

const authApiPaths = ["/login", "/parent_login", "/child_login", "/admin_login"];

function matchesPathSegment(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

module.exports = function setupProxy(app) {
  const apiProxy = createProxyMiddleware({
    target,
    changeOrigin: true,
  });

  app.use((req, res, next) => {
    const pathname = req.path || req.url.split("?")[0];
    const isAuthApiRequest = authApiPaths.includes(pathname) && req.method === "POST";
    const isResourceApiRequest = apiPrefixes.some((prefix) => matchesPathSegment(pathname, prefix));

    if (isAuthApiRequest || isResourceApiRequest) {
      return apiProxy(req, res, next);
    }

    return next();
  });
};
