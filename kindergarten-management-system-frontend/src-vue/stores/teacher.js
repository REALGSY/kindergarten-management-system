import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "../api/client";

export const useTeacherStore = defineStore("teacher", () => {
  const profile = ref(null);
  const students = ref([]);
  const disciplines = ref([]);
  const attendances = ref([]);
  const loading = ref(false);
  const error = ref("");

  async function loadWorkspace() {
    loading.value = true;
    error.value = "";
    try {
      const teacherId = localStorage.getItem("teacher");
      const [teacher, studentData, disciplineData, attendanceData] = await Promise.all([
        teacherId ? api.get(`/teachers/${teacherId}`, "teacher") : Promise.resolve(null),
        api.get("/students", "teacher"),
        api.get("/disciplines", "teacher"),
        api.get("/attendances", "teacher"),
      ]);
      profile.value = teacher;
      students.value = Array.isArray(studentData) ? studentData : [];
      disciplines.value = Array.isArray(disciplineData) ? disciplineData : [];
      attendances.value = Array.isArray(attendanceData) ? attendanceData : [];
      return { profile: profile.value, students: students.value, disciplines: disciplines.value, attendances: attendances.value };
    } catch (cause) {
      error.value = cause.message || "教师工作台加载失败";
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  return { profile, students, disciplines, attendances, loading, error, loadWorkspace };
});
