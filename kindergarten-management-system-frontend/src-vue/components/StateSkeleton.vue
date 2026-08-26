<script setup>
defineProps({
  count: { type: Number, default: 4 },
  height: { type: String, default: "56px" },
});
</script>

<template>
  <div style="display:grid; gap:8px">
    <div v-for="index in count" :key="index" class="skeleton" :style="{ minHeight: height }" />
  </div>
</template>
