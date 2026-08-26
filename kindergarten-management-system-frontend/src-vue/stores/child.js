import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "../api/client";

export const useChildStore = defineStore("child", () => {
  const profile = ref(null);
  const videos = ref([]);
  const sessions = ref([]);
  const loading = ref(false);
  const error = ref("");

  async function loadLearningSpace() {
    loading.value = true;
    error.value = "";
    try {
      const [student, videoData, sessionData] = await Promise.all([
        api.get("/child/profile", "child"),
        api.get("/child/videos", "child"),
        api.get("/child/chat_sessions", "child"),
      ]);
      profile.value = student;
      videos.value = Array.isArray(videoData) ? videoData : [];
      sessions.value = Array.isArray(sessionData) ? sessionData : [];
      localStorage.setItem("child", String(student?.id || localStorage.getItem("child") || ""));
      localStorage.setItem("child_data", JSON.stringify(student || {}));
      return { profile: profile.value, videos: videos.value, sessions: sessions.value };
    } catch (cause) {
      error.value = cause.message || "儿童学习空间加载失败";
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  return { profile, videos, sessions, loading, error, loadLearningSpace };
});
