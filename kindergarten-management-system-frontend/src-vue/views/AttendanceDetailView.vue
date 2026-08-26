<script setup>
import { onMounted, ref } from "vue";
import { ArrowLeft, LoaderCircle } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/client";
const route = useRoute(); const router = useRouter(); const records = ref(null); const error = ref("");
onMounted(async () => { try { const data = await api.get(`/attendances?date=${route.params.date}`, "teacher"); records.value = Array.isArray(data) ? data : []; } catch (cause) { error.value = cause.message || "考勤记录加载失败"; } });
</script>
<template><div><div class="page-heading"><div><span class="mono-label">CLASSROOM / ATTENDANCE DETAIL</span><h1>{{ route.params.date }} 考勤名单</h1><p>查看当天已经提交的本班考勤记录。</p></div><button class="button button-light" @click="router.push('/dashboard/attendance')"><ArrowLeft :size="15" />返回考勤</button></div><div v-if="error" class="notice error">{{ error }}</div><div v-else-if="!records" class="empty-state"><LoaderCircle class="spin" :size="28" /></div><section v-else class="surface"><div v-if="!records.length" class="empty-state">该日期暂无考勤记录</div><div v-else class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>学生</th><th>状态</th></tr></thead><tbody><tr v-for="(item,index) in records" :key="item.id"><td>{{ index+1 }}</td><td>{{ item.student_name }}</td><td><span class="status" :class="item.status === 'Present' ? 'ok' : 'warn'">{{ item.status === 'Present' ? '出勤' : '缺勤' }}</span></td></tr></tbody></table></div></section></div></template>
<style scoped>.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform:rotate(360deg); } }</style>
