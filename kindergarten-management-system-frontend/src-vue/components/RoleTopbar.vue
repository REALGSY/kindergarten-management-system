<script setup>
import { Menu, X } from "lucide-vue-next";

defineProps({
  meta: { type: Object, required: true },
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle"]);
</script>

<template>
  <header class="shell-topbar">
    <div style="display:flex; align-items:center; gap:12px">
      <button class="icon-button mobile-menu" type="button" title="打开导航" aria-label="打开导航" @click="emit('toggle')"><Menu v-if="!open" :size="18" /><X v-else :size="18" /></button>
      <span class="topbar-title"><component :is="meta.icon" :size="15" style="vertical-align:-3px; margin-right:6px" />{{ meta.title }}</span>
    </div>
    <div class="topbar-meta"><span class="live-dot">系统在线</span><span class="mono-label">{{ new Date().toLocaleDateString('zh-CN') }}</span></div>
  </header>
</template>
