<script setup>
defineProps({
  title: { type: String, default: "暂无数据" },
  description: { type: String, default: "当前没有可展示的记录。" },
});
</script>

<template>
  <div class="empty-state">
    <slot name="icon" />
    <strong>{{ title }}</strong>
    <span>{{ description }}</span>
    <slot />
  </div>
</template>
