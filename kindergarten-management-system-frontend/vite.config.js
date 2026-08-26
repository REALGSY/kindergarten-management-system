import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": "/src-vue",
      },
    },
    server: {
      host: "127.0.0.1",
      port: 4000,
      strictPort: true,
      allowedHosts: ["kindergarten.bjtu.cc"],
      proxy: {
        "/__api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__api/, ""),
        },
        "/rails/active_storage": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 4000,
      strictPort: true,
    },
    define: {
      __APP_MODE__: JSON.stringify(mode),
    },
    test: {
      environment: "jsdom",
      include: ["src-vue/**/*.test.{js,ts}"],
    },
  };
});
