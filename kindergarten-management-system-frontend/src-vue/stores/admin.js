import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "../api/client";

export const useAdminStore = defineStore("admin", () => {
  const summary = ref(null);
  const loading = ref(false);
  const error = ref("");

  async function loadSummary() {
    loading.value = true;
    error.value = "";
    try {
      summary.value = await api.get("/admin/summary", "admin");
      return summary.value;
    } catch (cause) {
      error.value = cause.message || "管理概览加载失败";
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  return { summary, loading, error, loadSummary };
});
