<script setup>
import { computed, onMounted, ref } from "vue";
import { Activity, ArrowUpRight, CalendarCheck, CheckCircle2, Clock3, GraduationCap, HeartHandshake, Users } from "lucide-vue-next";
import MetricCard from "../components/MetricCard.vue";
import StateSkeleton from "../components/StateSkeleton.vue";
import { useAdminStore } from "../stores/admin";
import { useTeacherStore } from "../stores/teacher";
import { useParentStore } from "../stores/parent";

const props = defineProps({ role: { type: String, default: "admin" } });
const adminStore = useAdminStore(); const teacherStore = useTeacherStore(); const parentStore = useParentStore();
const summary = ref(null); const profile = ref(null); const loading = ref(true); const error = ref("");
const isParent = computed(() => props.role === "parent");
const copy = computed(() => props.role === "admin" ? { title: "园所态势总览", desc: "一眼掌握账号、班级、学生、考勤和成长服务的实时状态。" } : props.role === "teacher" ? { title: "今日班级态势", desc: "把注意力留给孩子，系统帮你整理班级运行信号。" } : { title: "家庭陪伴总览", desc: "孩子的每一次到园、学习和探索，都值得被看见。" });

const metrics = computed(() => {
  if (props.role === "admin") return [
    ["教师", summary.value?.teacher_count ?? 0, "已登记教学成员", Users], ["班级", summary.value?.classroom_count ?? 0, "运营中的班级", GraduationCap], ["学生", summary.value?.student_count ?? 0, "成长档案总量", HeartHandshake], ["今日出勤", summary.value?.attendance_today?.present ?? 0, `总计 ${summary.value?.attendance_today?.total ?? 0} 人`, CalendarCheck],
  ];
  if (props.role === "teacher") return [["本班学生", summary.value?.student_count ?? 0, "待照料的每一份成长", Users], ["今日出勤", summary.value?.attendance_today?.present ?? 0, "已完成签到", CalendarCheck], ["待处理纪律", summary.value?.discipline_count ?? 0, "保持温柔记录", Activity], ["班级状态", "LIVE", "运行正常", CheckCircle2]];
  return [["已关联孩子", summary.value?.length ?? profile.value?.students?.length ?? 0, "正在陪伴成长", HeartHandshake], ["今日状态", "LIVE", "园所连接正常", Activity], ["陪伴提醒", "0", "暂无待处理事项", Clock3], ["成长空间", "OPEN", "随时可以探索", ArrowUpRight]];
});

function retry() {
  if (typeof window !== "undefined") window.location.reload();
}

onMounted(async () => {
  try {
    if (props.role === "admin") summary.value = await adminStore.loadSummary();
    else if (props.role === "teacher") {
      const workspace = await teacherStore.loadWorkspace();
      summary.value = { student_count: workspace.students.length, attendance_today: { present: workspace.attendances.filter((item) => item.status === "Present").length }, discipline_count: workspace.disciplines.length };
    } else {
      const family = await parentStore.loadFamily();
      profile.value = family.profile;
      summary.value = profile.value?.students || [];
    }
  } catch (cause) { error.value = cause.message || "数据加载失败"; } finally { loading.value = false; }
});
</script>

<template>
  <div>
    <div class="page-heading"><div><span class="mono-label">{{ props.role === 'admin' ? 'CONTROL / OVERVIEW' : props.role === 'teacher' ? 'CLASSROOM / TODAY' : 'FAMILY / TODAY' }}</span><h1>{{ copy.title }}</h1><p>{{ copy.desc }}</p></div><div class="topbar-meta"><span class="live-dot">{{ props.role === 'parent' ? '连接正常' : '实时同步' }}</span></div></div>
    <div v-if="error" class="notice error" style="margin-bottom:16px">{{ error }} <button class="row-action" type="button" @click="retry">重新加载</button></div>
    <div v-if="loading" class="metric-grid"><StateSkeleton v-for="i in 4" :key="i" :count="1" height="148px" /></div>
    <div v-else class="metric-grid"><MetricCard v-for="[label, value, foot, Icon] in metrics" :key="label" :label="label" :value="value" :foot="foot" :icon="Icon"><template #action><ArrowUpRight :size="14" /></template></MetricCard></div>
    <div class="data-grid" style="margin-top:18px"><section class="surface surface-pad"><div class="surface-title"><h2>{{ isParent ? '孩子连接' : '运行信号' }}</h2><span>{{ isParent ? '已授权数据' : 'SYSTEM FEED' }}</span></div><div v-if="isParent && summary?.length" class="data-grid" style="grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px"><div v-for="child in summary" :key="child.id" style="padding:14px; border:1px solid var(--light-line); border-radius:10px; background:#fff"><span class="mono-label">CHILD / {{ child.admission_number }}</span><strong style="display:block; margin-top:7px; color:#1a4b61">{{ child.first_name }} {{ child.second_name }} {{ child.surname }}</strong><small style="display:block; margin-top:5px; color:#718898">{{ child.classroom?.name || '班级信息同步中' }}</small></div></div><div v-else class="empty-state"><CheckCircle2 :size="28" style="margin-bottom:10px; color:var(--cyan)" /><strong>所有核心服务运行正常</strong><span>数据会在新的操作完成后自动刷新。</span></div></section><section class="surface surface-pad"><div class="surface-title"><h2>{{ props.role === 'admin' ? '快捷入口' : '下一步建议' }}</h2><span>QUICK ACTION</span></div><div style="display:grid; gap:8px"><RouterLink v-if="props.role === 'admin'" v-for="item in [['学生档案','/admin_dashboard/students'],['今日考勤','/admin_dashboard/attendances'],['绑定审批','/admin_dashboard/parent_students']]" :key="item[1]" class="button button-dark" :to="item[1]" style="justify-content:space-between">{{ item[0] }}<ArrowUpRight :size="15" /></RouterLink><template v-else><div class="notice"><Clock3 :size="16" style="vertical-align:-3px; margin-right:6px" />今天也要记得给孩子一个拥抱。</div><RouterLink v-if="props.role === 'parent'" class="button button-light" to="/parent_dashboard/my_kids">查看孩子状态 <ArrowUpRight :size="15" /></RouterLink><RouterLink v-else class="button button-dark" to="/dashboard/kids_list">打开学生列表 <ArrowUpRight :size="15" /></RouterLink></template></div></section></div>
  </div>
</template>
