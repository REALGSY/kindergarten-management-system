<script setup>
import { RouterView, useRoute } from "vue-router";
import { computed } from "vue";
import Toast from "./components/Toast.vue";

const route = useRoute();
const theme = computed(() => route.meta?.theme || (route.meta?.role === "parent" || route.meta?.role === "child" ? "light" : "dark"));
</script>

<template>
  <div class="app-root" :data-theme="theme">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
    <Toast />
  </div>
</template>
