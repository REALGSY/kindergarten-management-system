const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.REACT_APP_API_PROXY_TARGET || "http://localhost:3000";

module.exports = function setupProxy(app) {
  app.use(
    [
      "/attendances",
      "/disciplines",
      "/parent_students",
      "/parents",
      "/students",
      "/teachers",
      "/classrooms",
      "/login",
      "/parent_login",
      "/admin_login",
      "/admin",
      "/profile",
      "/teacher",
    ],
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
