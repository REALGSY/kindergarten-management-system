import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { api, clearRoleSession, roleLoginPath, roleStorage, tokenFor } from "../api/client";

const responseIdentity = {
  admin: "admin",
  teacher: "teacher",
  parent: "parent",
  child: "student",
};

export const useAuthStore = defineStore("auth", () => {
  const currentRole = ref("");
  const profile = ref(null);
  const busy = ref(false);
  const error = ref("");

  function hydrate(role) {
    const config = roleStorage[role];
    if (!config) return false;
    const token = window.localStorage.getItem(config.token);
    if (!token) return false;
    currentRole.value = role;
    try {
      const stored = JSON.parse(window.localStorage.getItem(config.data) || "null");
      profile.value = stored?.[responseIdentity[role]] || stored?.[role] || stored;
    } catch {
      profile.value = null;
    }
    return true;
  }

  function isAuthenticated(role) {
    const config = roleStorage[role];
    return Boolean(config && window.localStorage.getItem(config.token));
  }

  function redirectUnauthorized(role = currentRole.value) {
    if (!role || !roleStorage[role]) return false;

    clearRoleSession(role);
    if (currentRole.value === role) {
      currentRole.value = "";
      profile.value = null;
    }

    const loginPath = roleLoginPath(role);
    if (typeof window !== "undefined" && window.location.pathname !== loginPath && import.meta.env.MODE !== "test") {
      window.location.assign(loginPath);
    }
    return true;
  }

  async function login(role, credentials) {
    busy.value = true;
    error.value = "";
    try {
      const path = roleStorage[role]?.login;
      const payload = await api.post(path, credentials);
      const config = roleStorage[role];
      const identity = payload?.[responseIdentity[role]] || payload?.admin || payload?.teacher || payload?.parent || payload?.student;
      window.localStorage.setItem(config.token, payload.jwt || payload.token || "");
      if (identity?.id != null) window.localStorage.setItem(config.id, String(identity.id));
      window.localStorage.setItem(config.data, JSON.stringify(identity || payload));
      currentRole.value = role;
      profile.value = identity || payload;
      return payload;
    } catch (cause) {
      error.value = cause.message || "登录失败";
      throw cause;
    } finally {
      busy.value = false;
    }
  }

  function logout(role = currentRole.value) {
    clearRoleSession(role);
    if (currentRole.value === role) {
      currentRole.value = "";
      profile.value = null;
    }
  }

  function switchRole(role) {
    currentRole.value = role;
    hydrate(role);
  }

  return {
    currentRole,
    token: computed(() => tokenFor(currentRole.value)),
    profile,
    busy,
    error,
    isAuthenticated: computed(() => Boolean(currentRole.value && isAuthenticated(currentRole.value))),
    hydrate,
    isAuthenticatedFor: isAuthenticated,
    redirectUnauthorized,
    login,
    logout,
    switchRole,
  };
});
