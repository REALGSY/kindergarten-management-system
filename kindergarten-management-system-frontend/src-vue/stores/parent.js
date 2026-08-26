import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "../api/client";

export const useParentStore = defineStore("parent", () => {
  const profile = ref(null);
  const children = ref([]);
  const applications = ref([]);
  const loading = ref(false);
  const error = ref("");

  async function loadFamily() {
    loading.value = true;
    error.value = "";
    try {
      const parentId = localStorage.getItem("parent");
      const [parent, links] = await Promise.all([
        parentId ? api.get(`/parents/${parentId}`, "parent") : Promise.resolve(null),
        api.get("/parent_students", "parent"),
      ]);
      profile.value = parent;
      children.value = Array.isArray(parent?.students) ? parent.students : [];
      applications.value = Array.isArray(links) ? links : [];
      if (parent) localStorage.setItem("parent_data", JSON.stringify(parent));
      return { profile: profile.value, children: children.value, applications: applications.value };
    } catch (cause) {
      error.value = cause.message || "家庭数据加载失败";
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  return { profile, children, applications, loading, error, loadFamily };
});
