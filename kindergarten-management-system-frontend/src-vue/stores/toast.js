import { defineStore } from "pinia";
import { ref } from "vue";

let nextId = 0;

export const useToastStore = defineStore("toast", () => {
  const items = ref([]);

  function push(message, type = "info", duration = 3200) {
    if (!message) return null;
    const id = ++nextId;
    items.value.push({ id, message: String(message), type });
    if (duration > 0 && typeof window !== "undefined") {
      window.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }

  function dismiss(id) {
    items.value = items.value.filter((item) => item.id !== id);
  }

  function success(message, duration) {
    return push(message, "success", duration);
  }

  function error(message, duration) {
    return push(message, "error", duration);
  }

  return { items, push, dismiss, success, error };
});
