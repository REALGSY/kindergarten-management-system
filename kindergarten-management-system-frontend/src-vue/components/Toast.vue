<script setup>
import { CheckCircle2, Info, X, XCircle } from "lucide-vue-next";
import { useToastStore } from "../stores/toast";

const toast = useToastStore();
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div v-for="item in toast.items" :key="item.id" class="toast" :class="`toast-${item.type}`" role="status">
      <CheckCircle2 v-if="item.type === 'success'" :size="17" />
      <XCircle v-else-if="item.type === 'error'" :size="17" />
      <Info v-else :size="17" />
      <span>{{ item.message }}</span>
      <button class="toast-close" type="button" title="关闭提示" aria-label="关闭提示" @click="toast.dismiss(item.id)"><X :size="14" /></button>
    </div>
  </div>
</template>
