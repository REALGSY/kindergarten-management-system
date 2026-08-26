<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Edit3, FileVideo2, LoaderCircle, Play, RefreshCw, Trash2, Upload, X } from "lucide-vue-next";
import { api, mediaUrl } from "../api/client";

const videos = ref([]);
const form = reactive({
  title: "",
  description: "",
  stage: "",
  level: "",
  subject: "",
  min_age: "3",
  max_age: "6",
  status: "draft",
  video_file: null,
});
const editingId = ref(null);
const loading = ref(true);
const saving = ref(false);
const message = ref("");
const error = ref("");
const previewVideo = ref(null);
const previewLoading = ref(false);
const previewError = ref("");
const previewCloseButton = ref(null);
let previewTrigger = null;

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.get("/admin/educational_videos", "admin");
    videos.value = Array.isArray(data) ? data : [];
  } catch (cause) {
    error.value = cause.message || "视频加载失败";
  } finally {
    loading.value = false;
  }
}

function fileChange(event) {
  form.video_file = event.target.files?.[0] || null;
}

function edit(video) {
  editingId.value = video.id;
  Object.keys(form).forEach((key) => {
    form[key] = key === "video_file" ? null : video[key] ?? "";
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reset() {
  editingId.value = null;
  Object.assign(form, {
    title: "",
    description: "",
    stage: "",
    level: "",
    subject: "",
    min_age: "3",
    max_age: "6",
    status: "draft",
    video_file: null,
  });
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    const data = new FormData();
    ["title", "description", "stage", "level", "subject", "min_age", "max_age", "status"].forEach((key) => data.append(key, form[key] || ""));
    if (form.video_file) data.append("video_file", form.video_file);
    await api.form(
      editingId.value ? `/admin/educational_videos/${editingId.value}` : "/admin/educational_videos",
      data,
      "admin",
      editingId.value ? "PATCH" : "POST",
    );
    message.value = editingId.value ? "视频信息已更新" : "视频已上传";
    reset();
    await load();
  } catch (cause) {
    error.value = cause.message || "保存失败";
  } finally {
    saving.value = false;
  }
}

async function remove(video) {
  if (!window.confirm(`确认删除“${video.title}”？`)) return;
  try {
    await api.delete(`/admin/educational_videos/${video.id}`, "admin");
    message.value = "视频已删除";
    await load();
  } catch (cause) {
    error.value = cause.message || "删除失败";
  }
}

async function openPreview(video, event) {
  if (!video.video_url) {
    error.value = `“${video.title || "该视频"}”暂无可预览文件`;
    return;
  }
  previewTrigger = event?.currentTarget || null;
  previewError.value = "";
  previewLoading.value = true;
  previewVideo.value = video;
  await nextTick();
  previewCloseButton.value?.focus();
}

async function closePreview() {
  const trigger = previewTrigger;
  previewVideo.value = null;
  previewLoading.value = false;
  previewError.value = "";
  previewTrigger = null;
  await nextTick();
  trigger?.focus?.();
}

function handlePreviewError() {
  previewLoading.value = false;
  previewError.value = "视频加载失败，请检查视频文件或存储服务配置。";
}

function handleKeydown(event) {
  if (event.key === "Escape" && previewVideo.value) closePreview();
}

onMounted(() => {
  load();
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <div>
    <div class="page-heading">
      <div>
        <span class="mono-label">ADMIN / LEARNING CONTENT</span>
        <h1>早教视频库</h1>
        <p>上传、维护并预览儿童端的分龄学习内容。</p>
      </div>
      <button class="button button-dark" type="button" @click="load">
        <RefreshCw :size="15" />
        刷新
      </button>
    </div>

    <div v-if="message" class="notice page-notice">{{ message }}</div>
    <div v-if="error" class="notice error page-notice">{{ error }}</div>

    <section class="surface surface-pad video-form-section">
      <div class="surface-title">
        <h2>
          <Upload :size="16" class="title-icon" />
          {{ editingId ? "编辑学习视频" : "上传新视频" }}
        </h2>
        <span>MP4 / CONTENT</span>
      </div>
      <form class="form-grid" @submit.prevent="save">
        <div class="field">
          <label>标题</label>
          <input v-model="form.title" required placeholder="视频标题" />
        </div>
        <div class="field">
          <label>学科</label>
          <input v-model="form.subject" placeholder="数学 / 识字 / 英语" />
        </div>
        <div class="field">
          <label>阶段</label>
          <input v-model="form.stage" placeholder="小班 / 中班 / 大班" />
        </div>
        <div class="field">
          <label>等级</label>
          <input v-model="form.level" placeholder="初级 / 进阶" />
        </div>
        <div class="field">
          <label>最小年龄</label>
          <input v-model="form.min_age" type="number" />
        </div>
        <div class="field">
          <label>最大年龄</label>
          <input v-model="form.max_age" type="number" />
        </div>
        <div class="field">
          <label>状态</label>
          <select v-model="form.status">
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
        </div>
        <div class="field wide">
          <label>视频文件 {{ editingId ? "(可选，留空则保留原文件)" : "" }}</label>
          <input type="file" accept="video/*" :required="!editingId" @change="fileChange" />
        </div>
        <div class="field full">
          <label>描述</label>
          <textarea v-model="form.description" placeholder="给家长和孩子看的简短说明" />
        </div>
        <div class="form-actions">
          <button v-if="editingId" class="button button-ghost" type="button" @click="reset">
            <X :size="15" />
            取消
          </button>
          <button class="button button-primary" type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="spin" :size="15" />
            {{ saving ? "上传中..." : editingId ? "保存修改" : "上传视频" }}
          </button>
        </div>
      </form>
    </section>

    <section class="surface">
      <div class="surface-title video-list-title">
        <h2>内容清单</h2>
        <span>{{ videos.length }} VIDEOS</span>
      </div>
      <div v-if="loading" class="empty-state">
        <LoaderCircle class="spin" :size="26" />
      </div>
      <div v-else-if="!videos.length" class="empty-state">
        <strong>暂无学习视频</strong>
        <span>上传第一个分龄内容开始构建学习库。</span>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>学科</th>
              <th>阶段</th>
              <th>状态</th>
              <th>视频文件</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="video in videos" :key="video.id">
              <td>
                <strong>{{ video.title }}</strong>
                <small class="video-description">{{ video.description || "-" }}</small>
              </td>
              <td>{{ video.subject || "-" }}</td>
              <td>{{ video.stage || "-" }} / {{ video.level || "-" }}</td>
              <td>
                <span class="status" :class="video.status === 'published' ? 'ok' : 'warn'">
                  {{ video.status === "published" ? "已发布" : "草稿" }}
                </span>
              </td>
              <td>
                <span class="video-file" :class="{ missing: !video.video_url }">
                  <FileVideo2 :size="15" />
                  <span>{{ video.video_filename || (video.video_url ? "已上传视频" : "未上传视频") }}</span>
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    class="row-action"
                    type="button"
                    :disabled="!video.video_url"
                    :title="video.video_url ? '预览视频' : '暂无可预览文件'"
                    :aria-label="video.video_url ? `预览${video.title}` : `${video.title}暂无可预览文件`"
                    @click="openPreview(video, $event)"
                  >
                    <Play :size="13" />
                  </button>
                  <button class="row-action" type="button" title="编辑" :aria-label="`编辑${video.title}`" @click="edit(video)">
                    <Edit3 :size="13" />
                  </button>
                  <button class="row-action delete-action" type="button" title="删除" :aria-label="`删除${video.title}`" @click="remove(video)">
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="preview-modal">
        <div v-if="previewVideo" class="preview-backdrop" @click.self="closePreview">
          <section class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="video-preview-title">
            <header class="preview-header">
              <div>
                <span class="mono-label">VIDEO PREVIEW</span>
                <h2 id="video-preview-title">{{ previewVideo.title }}</h2>
                <p>{{ previewVideo.video_filename || "学习视频" }}</p>
              </div>
              <button
                ref="previewCloseButton"
                class="icon-button preview-close"
                type="button"
                title="关闭预览"
                aria-label="关闭视频预览"
                @click="closePreview"
              >
                <X :size="18" />
              </button>
            </header>

            <div class="preview-player-shell">
              <video
                :key="previewVideo.id"
                :src="mediaUrl(previewVideo.video_url)"
                controls
                playsinline
                preload="metadata"
                :aria-label="`${previewVideo.title}视频预览`"
                @loadedmetadata="previewLoading = false"
                @canplay="previewLoading = false"
                @error="handlePreviewError"
              />
              <div v-if="previewLoading && !previewError" class="preview-player-state" aria-live="polite">
                <LoaderCircle class="spin" :size="28" />
                <span>正在加载视频...</span>
              </div>
              <div v-if="previewError" class="preview-player-state preview-player-error" role="alert">
                <FileVideo2 :size="30" />
                <strong>{{ previewError }}</strong>
              </div>
            </div>

            <dl class="preview-metadata">
              <div>
                <dt>状态</dt>
                <dd>
                  <span class="status" :class="previewVideo.status === 'published' ? 'ok' : 'warn'">
                    {{ previewVideo.status === "published" ? "已发布" : "草稿" }}
                  </span>
                </dd>
              </div>
              <div>
                <dt>学科</dt>
                <dd>{{ previewVideo.subject || "未分类" }}</dd>
              </div>
              <div>
                <dt>阶段 / 等级</dt>
                <dd>{{ previewVideo.stage || "-" }} / {{ previewVideo.level || "-" }}</dd>
              </div>
              <div>
                <dt>适用年龄</dt>
                <dd>{{ previewVideo.min_age || "-" }} - {{ previewVideo.max_age || "-" }} 岁</dd>
              </div>
            </dl>
            <p v-if="previewVideo.description" class="preview-description">{{ previewVideo.description }}</p>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.page-notice {
  margin-bottom: 14px;
}

.video-form-section {
  margin-bottom: 18px;
}

.title-icon {
  margin-right: 6px;
  vertical-align: -3px;
}

.video-list-title {
  margin-bottom: 0;
  padding: 18px 18px 0;
}

.video-description {
  display: block;
  max-width: 360px;
  margin-top: 4px;
  overflow: hidden;
  color: var(--muted-dark);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-file {
  display: inline-flex;
  max-width: 230px;
  align-items: center;
  gap: 7px;
  color: #a9cad6;
}

.video-file span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-file.missing {
  color: var(--muted-dark);
}

.row-action:disabled {
  cursor: not-allowed;
  opacity: .35;
}

.delete-action {
  color: var(--coral);
}

.spin {
  animation: spin 1s linear infinite;
}

.preview-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(1, 8, 15, .84);
  backdrop-filter: blur(8px);
}

.preview-dialog {
  width: min(960px, calc(100vh + 20px), 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  border: 1px solid var(--line-dark);
  border-radius: var(--radius-md);
  color: #e8f5fa;
  background: var(--ink-900);
  box-shadow: 0 28px 80px rgba(0, 0, 0, .48);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line-dark);
}

.preview-header h2 {
  margin: 5px 0 0;
  font-size: 20px;
  letter-spacing: 0;
}

.preview-header p {
  margin: 5px 0 0;
  color: var(--muted-dark);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.preview-close {
  flex: 0 0 38px;
  color: #b7d2dc;
}

.preview-player-shell {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #02070c;
}

.preview-player-shell video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-player-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  padding: 24px;
  color: #b7d2dc;
  background: rgba(2, 7, 12, .88);
  font-size: 13px;
  text-align: center;
  pointer-events: none;
}

.preview-player-error {
  color: #ffd0d8;
}

.preview-metadata {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line-dark);
}

.preview-metadata > div {
  min-width: 0;
  padding: 0 16px;
  border-right: 1px solid var(--line-dark);
}

.preview-metadata > div:first-child {
  padding-left: 0;
}

.preview-metadata > div:last-child {
  padding-right: 0;
  border-right: 0;
}

.preview-metadata dt {
  margin-bottom: 7px;
  color: var(--muted-dark);
  font-size: 11px;
}

.preview-metadata dd {
  margin: 0;
  overflow: hidden;
  color: #e8f5fa;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-description {
  margin: 0;
  padding: 16px 20px 20px;
  color: #a9c0cc;
  font-size: 13px;
  line-height: 1.7;
}

.preview-modal-enter-active,
.preview-modal-leave-active {
  transition: opacity .18s ease;
}

.preview-modal-enter-active .preview-dialog,
.preview-modal-leave-active .preview-dialog {
  transition: transform .18s ease;
}

.preview-modal-enter-from,
.preview-modal-leave-to {
  opacity: 0;
}

.preview-modal-enter-from .preview-dialog,
.preview-modal-leave-to .preview-dialog {
  transform: translateY(8px) scale(.99);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 700px) {
  .preview-backdrop {
    align-items: end;
    padding: 12px;
  }

  .preview-dialog {
    max-height: calc(100vh - 24px);
  }

  .preview-metadata {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 0;
  }

  .preview-metadata > div,
  .preview-metadata > div:first-child,
  .preview-metadata > div:last-child {
    padding: 0 12px;
    border-right: 1px solid var(--line-dark);
  }

  .preview-metadata > div:nth-child(odd) {
    padding-left: 0;
  }

  .preview-metadata > div:nth-child(even) {
    padding-right: 0;
    border-right: 0;
  }
}
</style>
