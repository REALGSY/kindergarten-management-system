<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  foot: { type: String, default: "" },
  icon: { type: [Object, Function], default: null },
});
</script>

<template>
  <article class="metric-card">
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px">
      <small>{{ label }}</small>
      <component :is="icon" v-if="icon" :size="17" color="var(--cyan)" />
    </div>
    <div class="metric-value">{{ value }}</div>
    <div class="metric-foot"><span>{{ foot }}</span><slot name="action" /></div>
  </article>
</template>
