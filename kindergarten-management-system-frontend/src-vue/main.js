import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "./styles.css";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

if (typeof window !== "undefined") {
  window.addEventListener("parakindergarten:unauthorized", (event) => {
    useAuthStore(pinia).redirectUnauthorized(event.detail?.role);
  });
}

app.mount("#app");
