<script setup>
import { computed, onMounted, ref } from "vue";
import { ArrowLeft, CalendarDays, ImagePlus, LoaderCircle, Send, Video } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import { api, mediaUrl } from "../api/client";

const props = defineProps({ role: { type: String, required: true } });
const route = useRoute();
const router = useRouter();
const studentId = String(route.params.id);
const records = ref([]);
const summary = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const selectedFiles = ref([]);
const form = ref({ recorded_on: new Date().toISOString().slice(0, 10), note: "" });

const backPath = computed(() => props.role === "parent" ? `/parent_dashboard/my_kids/${studentId}` : `/dashboard/kids_list/${studentId}`);
const roleName = computed(() => props.role === "parent" ? "家长" : "教师");

function fileLabel(file) {
  const size = file.byte_size || file.size || 0;
  return `${file.filename || file.name} · ${(size / 1024 / 1024).toFixed(size > 1024 * 1024 ? 1 : 2)} MB`;
}

function onFilesChange(event) {
  const files = Array.from(event.target.files || []);
  if (files.length > 5) {
    error.value = "每条记录最多上传 5 个文件。";
    event.target.value = "";
    return;
  }
  const invalid = files.find((file) => !/^image\//.test(file.type) && !/^video\//.test(file.type));
  if (invalid) {
    error.value = "仅支持图片或视频文件。";
    event.target.value = "";
    return;
  }
  selectedFiles.value = files;
  error.value = "";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const payload = await api.get(`/growth_records?student_id=${encodeURIComponent(studentId)}`, props.role);
    records.value = payload?.records || [];
    summary.value = payload?.summary || null;
  } catch (cause) {
    error.value = cause.message || "成长记录加载失败。";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!form.value.note.trim() && !selectedFiles.value.length) {
    error.value = "请填写文字说明或上传至少一份照片、视频。";
    return;
  }
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const payload = new FormData();
    payload.append("recorded_on", form.value.recorded_on);
    payload.append("note", form.value.note.trim());
    selectedFiles.value.forEach((file) => payload.append("media[]", file));
    await api.form(`/growth_records?student_id=${encodeURIComponent(studentId)}`, payload, props.role);
    form.value = { recorded_on: new Date().toISOString().slice(0, 10), note: "" };
    selectedFiles.value = [];
    const input = document.querySelector("#growth-media-input");
    if (input) input.value = "";
    success.value = "成长记录已保存，并已更新观察摘要。";
    await load();
  } catch (cause) {
    error.value = cause.message || "保存失败，请稍后重试。";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="growth-page">
    <div class="page-heading">
      <div>
        <span class="mono-label">CHILD / GROWTH JOURNAL</span>
        <h1>成长记录</h1>
        <p>由家长和教师按日期记录孩子的日常表现，形成连续的家园观察。</p>
      </div>
      <button class="button button-light" type="button" @click="router.push(backPath)"><ArrowLeft :size="15" />返回孩子详情</button>
    </div>

    <div v-if="error" class="notice error">{{ error }}</div>
    <div v-if="success" class="notice success">{{ success }}</div>
    <div v-if="loading" class="empty-state"><LoaderCircle class="spin" :size="28" /></div>

    <template v-else>
      <section class="surface surface-pad observation-card">
        <div class="surface-title"><h2>新增观察</h2><span>{{ roleName.toUpperCase() }} NOTE</span></div>
        <form class="observation-form" @submit.prevent="submit">
          <label>记录日期<input v-model="form.recorded_on" type="date" required /></label>
          <label>文字说明<textarea v-model="form.note" rows="5" placeholder="例如：今天愿意主动和同伴分享玩具，午睡前有些想家。" /></label>
          <div class="upload-row">
            <label class="upload-label" for="growth-media-input"><ImagePlus :size="17" />添加照片或视频<input id="growth-media-input" type="file" accept="image/*,video/*" multiple @change="onFilesChange" /></label>
            <span>最多 5 个，每个不超过 100 MB</span>
          </div>
          <ul v-if="selectedFiles.length" class="file-list"><li v-for="file in selectedFiles" :key="file.name"><Video v-if="file.type.startsWith('video/')" :size="14" /><ImagePlus v-else :size="14" />{{ fileLabel(file) }}</li></ul>
          <div class="form-actions"><button class="button button-primary" :disabled="saving" type="submit"><LoaderCircle v-if="saving" class="spin" :size="15" /><Send v-else :size="15" />{{ saving ? '正在保存' : '保存成长记录' }}</button></div>
        </form>
      </section>

      <section v-if="summary" class="surface surface-pad summary-card">
        <div class="surface-title"><h2>近期观察摘要</h2><span>{{ summary.period }}</span></div>
        <div class="summary-grid"><div><small>记录数量</small><strong>{{ summary.record_count }}</strong></div><div><small>当前提示</small><strong :class="summary.status === '建议关注' ? 'watch' : ''">{{ summary.status }}</strong></div><p>{{ summary.suggestion }}</p></div>
        <div v-if="summary.positive_tags?.length || summary.watch_tags?.length" class="tag-row"><span v-for="tag in summary.positive_tags" :key="`positive-${tag}`" class="tag positive">{{ tag }}</span><span v-for="tag in summary.watch_tags" :key="`watch-${tag}`" class="tag watch-tag">{{ tag }}</span></div>
        <p class="disclaimer">{{ summary.disclaimer }}</p>
      </section>

      <section class="surface record-section">
        <div class="surface-title record-title"><h2>按日期回顾</h2><span>{{ records.length }} RECORDS</span></div>
        <div v-if="!records.length" class="empty-state">还没有成长记录。可以从今天的一次小观察开始。</div>
        <article v-for="record in records" :key="record.id" class="record-item">
          <div class="record-date"><CalendarDays :size="16" /><strong>{{ record.recorded_on }}</strong><span>{{ record.author_role === 'parent' ? '家长记录' : '教师记录' }}</span></div>
          <p v-if="record.note" class="record-note">{{ record.note }}</p>
          <div v-if="record.media?.length" class="media-grid"><template v-for="file in record.media" :key="file.id"><video v-if="file.content_type?.startsWith('video/')" controls preload="metadata" :src="mediaUrl(file.url)" /><img v-else :src="mediaUrl(file.url)" :alt="file.filename" loading="lazy" /></template></div>
          <div class="analysis"><strong>自动观察：</strong>{{ record.analysis }}</div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.growth-page { display: grid; gap: 18px; }
.observation-card, .summary-card, .record-section { margin: 0; }
.observation-form { display: grid; gap: 14px; }
label { display: grid; gap: 7px; color: var(--ink, #102a38); font-size: 13px; font-weight: 700; }
input, textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--line, #d7e2e5); border-radius: 8px; padding: 10px 12px; font: inherit; background: #fff; }
textarea { resize: vertical; line-height: 1.65; }
.upload-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; color: var(--muted-dark, #5d7887); font-size: 12px; }
.upload-label { display: inline-flex; width: auto; align-items: center; grid-auto-flow: column; gap: 7px; padding: 9px 12px; border: 1px dashed var(--line-dark, #9eb0b7); border-radius: 8px; cursor: pointer; }
.upload-label input { display: none; }
.file-list { display: grid; gap: 5px; padding: 0; margin: 0; list-style: none; color: var(--muted-dark, #5d7887); font-size: 12px; }
.file-list li { display: flex; align-items: center; gap: 6px; }
.form-actions { display: flex; justify-content: flex-end; }
.summary-grid { display: grid; grid-template-columns: 120px 150px 1fr; gap: 18px; align-items: center; }
.summary-grid small { display: block; color: var(--muted-dark, #5d7887); font-size: 11px; margin-bottom: 4px; }.summary-grid strong { font-size: 17px; }.summary-grid p { margin: 0; line-height: 1.7; color: var(--muted-dark, #5d7887); font-size: 13px; }.watch { color: #b65e20; }
.tag-row { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 15px; }.tag { padding: 4px 8px; border-radius: 999px; font-size: 12px; }.positive { background: #e7f6ec; color: #237549; }.watch-tag { background: #fff0e4; color: #a8531c; }.disclaimer { margin: 14px 0 0; color: var(--muted-dark, #5d7887); font-size: 11px; line-height: 1.6; }
.record-title { padding: 18px 18px 0; }.record-item { padding: 18px; border-top: 1px solid var(--line, #d7e2e5); }.record-date { display: flex; gap: 8px; align-items: center; color: var(--ink, #102a38); }.record-date span { color: var(--muted-dark, #5d7887); font-size: 12px; }.record-note { margin: 12px 0; color: var(--muted-dark, #5d7887); line-height: 1.75; white-space: pre-wrap; }.media-grid { display: flex; flex-wrap: wrap; gap: 10px; }.media-grid img, .media-grid video { width: min(250px, 100%); max-height: 220px; object-fit: cover; border-radius: 8px; background: #102a38; }.analysis { margin-top: 12px; padding: 10px 12px; border-left: 3px solid #3b8d93; background: #f3f9f9; color: #476571; font-size: 12px; line-height: 1.7; }.success { background: #e7f6ec; color: #237549; border-color: #bde5c9; }.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 720px) { .summary-grid { grid-template-columns: 1fr 1fr; }.summary-grid p { grid-column: 1 / -1; } }
</style>
