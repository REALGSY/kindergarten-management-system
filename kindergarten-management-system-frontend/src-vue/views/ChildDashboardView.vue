<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { BookOpen, Bot, Filter, LogOut, MessageCircle, Mic, MicOff, Play, Send, Sparkles, Square, Volume2, VolumeX } from "lucide-vue-next";
import { api, clearRoleSession } from "../api/client";
import { useRouter } from "vue-router";
import InteractiveVideo from "../components/InteractiveVideo.vue";
import { audioMimeType, getCachedTtsAudio, rememberTtsAudio, ttsCacheKey } from "../api/ttsCache";
import { useChildStore } from "../stores/child";

const router = useRouter(); const childStore = useChildStore(); const student = ref(null); const videos = ref([]); const sessions = ref([]); const activeSession = ref(null); const messageText = ref(""); const status = ref(""); const loading = ref(true); const sending = ref(false); const muted = ref(false); const listening = ref(false); const speaking = ref(false); const filters = ref({ subject: "", stage: "", level: "" }); const currentVideo = ref(null); const recognition = ref(null); const audio = ref(null); const playbackToken = ref(0); const voiceCancelled = ref(false);
const studentName = computed(() => [student.value?.first_name, student.value?.second_name, student.value?.surname].filter(Boolean).join(" ") || "小朋友");
const subjects = computed(() => [...new Set(videos.value.map((item) => item.subject).filter(Boolean))]); const stages = computed(() => [...new Set(videos.value.map((item) => item.stage).filter(Boolean))]); const levels = computed(() => [...new Set(videos.value.map((item) => item.level).filter(Boolean))]);
const visibleVideos = computed(() => videos.value.filter((item) => (!filters.value.subject || item.subject === filters.value.subject) && (!filters.value.stage || item.stage === filters.value.stage) && (!filters.value.level || item.level === filters.value.level)));
const activeMessages = computed(() => activeSession.value?.messages || []); const lastAssistant = computed(() => [...activeMessages.value].reverse().find((item) => item.role !== "user"));
function stageForAge(age) { const value = Number(age); if (!Number.isFinite(value)) return ""; return value <= 3 ? "小班" : value === 4 ? "中班" : "大班"; }
function nameForVideo(video) { return video.title || "学习视频"; }
function isInteractive(video) { return Boolean(video.interactive || video.questions?.length || video.video_filename === "理解数字二_小班_初级_数学.mp4" || video.title === "理解数字二"); }

async function load() { loading.value = true; try { const data = await childStore.loadLearningSpace(); student.value = data.profile; videos.value = data.videos; filters.value.stage = stageForAge(data.profile?.age); sessions.value = data.sessions; activeSession.value = sessions.value[0] || null; } catch (cause) { status.value = cause.message || "儿童端信息加载失败，请重新登录。"; } finally { loading.value = false; } }
async function newSession() { try { const session = await api.post("/child/chat_sessions", { title: `${studentName.value} 的陪伴对话` }, "child"); sessions.value = [session, ...sessions.value]; activeSession.value = session; status.value = "新的陪伴对话已开启。"; } catch (cause) { status.value = cause.message || "无法开启新的对话"; } }
async function chooseSession(session) { try { activeSession.value = await api.get(`/child/chat_sessions/${session.id}`, "child"); } catch { activeSession.value = session; } }
async function sendMessage() { const content = messageText.value.trim(); if (!content || !activeSession.value || sending.value) return; sending.value = true; messageText.value = ""; const optimistic = { id: `local-${Date.now()}`, role: "user", content, created_at: new Date().toISOString() }; activeSession.value.messages = [...(activeSession.value.messages || []), optimistic]; try { const result = await api.post(`/child/chat_sessions/${activeSession.value.id}/messages`, { content }, "child"); let assistantMessage = null; if (result?.user_message || result?.assistant_message) { assistantMessage = result.assistant_message || null; activeSession.value.messages = [...activeSession.value.messages.filter((item) => item.id !== optimistic.id), result.user_message, result.assistant_message].filter(Boolean); } else if (result?.messages) { activeSession.value = result; assistantMessage = [...(result.messages || [])].reverse().find((item) => item.role !== "user") || null; } else if (result) { activeSession.value.messages = [...activeSession.value.messages, result]; assistantMessage = result.role === "user" ? null : result; } if (assistantMessage && !muted.value) void speak(assistantMessage); } catch (cause) { status.value = cause.message || "发送失败，请再试一次"; } finally { sending.value = false; } }
function startVoice() {
  if (listening.value) {
    voiceCancelled.value = true;
    recognition.value?.stop();
    return;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    status.value = "当前浏览器不支持语音识别，可继续文字输入。";
    return;
  }
  voiceCancelled.value = false;
  const instance = new Recognition();
  let transcript = "";
  instance.lang = "zh-CN";
  instance.interimResults = false;
  instance.continuous = false;
  instance.maxAlternatives = 1;
  instance.onstart = () => { listening.value = true; status.value = "正在听，请说出你想问的问题。"; };
  instance.onresult = (event) => {
    transcript = Array.from(event.results || []).map((result) => result?.[0]?.transcript || "").join(" ").trim();
    if (transcript) messageText.value = transcript;
  };
  instance.onerror = (event) => { status.value = event?.error === "not-allowed" ? "浏览器没有麦克风权限，可继续文字输入。" : "语音识别失败，请继续文字输入。"; listening.value = false; };
  instance.onend = () => {
    listening.value = false;
    recognition.value = null;
    if (!voiceCancelled.value && transcript) {
      messageText.value = transcript;
      status.value = "已识别，正在发送。";
      void sendMessage();
    }
    voiceCancelled.value = false;
  };
  recognition.value = instance;
  try { instance.start(); } catch { listening.value = false; recognition.value = null; status.value = "语音识别启动失败，可继续文字输入。"; }
}
function stopAudio() {
  playbackToken.value += 1;
  if (audio.value) {
    audio.value.pause();
    audio.value.src = "";
    audio.value = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  speaking.value = false;
}
function playSegment(segment, codec, token) {
  return new Promise((resolve, reject) => {
    if (token !== playbackToken.value) { resolve(); return; }
    if (!segment?.audio_base64 || typeof window.Audio !== "function") { reject(new Error("当前浏览器不支持音频播放")); return; }
    const player = new window.Audio(`data:${audioMimeType(codec)};base64,${segment.audio_base64}`);
    audio.value = player;
    let settled = false;
    const finish = (failed = false) => {
      if (settled) return;
      settled = true;
      player.onended = null;
      player.onerror = null;
      if (audio.value === player) audio.value = null;
      failed ? reject(new Error("音频播放失败")) : resolve();
    };
    player.onended = () => finish();
    player.onerror = () => finish(true);
    try { Promise.resolve(player.play()).catch(() => finish(true)); } catch { finish(true); }
  });
}
async function playSegments(payload, token) {
  for (const segment of payload?.segments || []) {
    if (token !== playbackToken.value || muted.value) return;
    await playSegment(segment, payload.codec || "mp3", token);
  }
}
async function speak(message) {
  const content = message?.content?.trim();
  if (!content || muted.value) return;
  stopAudio();
  const token = playbackToken.value;
  speaking.value = true;
  try {
    const key = ttsCacheKey(message);
    let payload = await getCachedTtsAudio(key);
    if (!payload) payload = await api.post("/child/tts", { text: content, ...(message.id ? { message_id: message.id } : {}) }, "child");
    payload = await rememberTtsAudio(key, payload);
    if (!payload?.segments?.length) throw new Error("语音合成返回为空");
    await playSegments(payload, token);
    if (token === playbackToken.value && !muted.value) { speaking.value = false; return; }
  } catch {
    if (token !== playbackToken.value || muted.value) return;
    if (window.speechSynthesis && typeof window.SpeechSynthesisUtterance === "function") {
      const utterance = new window.SpeechSynthesisUtterance(content);
      utterance.lang = "zh-CN";
      utterance.rate = .9;
      utterance.onend = () => { if (token === playbackToken.value) speaking.value = false; };
      utterance.onerror = () => { if (token === playbackToken.value) { speaking.value = false; status.value = "朗读失败，请稍后重试。"; } };
      window.speechSynthesis.speak(utterance);
    } else {
      speaking.value = false;
      status.value = "当前浏览器不支持朗读。";
    }
  }
}
function logout() { clearRoleSession("child"); router.push("/child_login"); }
onMounted(load); onBeforeUnmount(() => { recognition.value?.abort(); stopAudio(); });
</script>

<template>
  <div class="child-layout"><header class="child-topbar"><RouterLink class="brand-lockup" to="/child_dashboard"><img class="brand-mark" src="/assets/brand/para-kindergarten-logo.png" alt="ParaKindergarten" /><span><strong class="brand-name">ParaKindergarten</strong><small class="brand-subtitle">EXPLORATION / LEARNING POD</small></span></RouterLink><div style="display:flex; align-items:center; gap:8px"><span class="avatar">{{ studentName.slice(0,1) }}</span><span style="font-size:13px; color:#5f7c85">{{ studentName }}</span><button class="icon-button" type="button" title="退出登录" aria-label="退出登录" @click="logout"><LogOut :size="15" /></button></div></header><main class="child-main"><div v-if="status" class="notice" style="margin-bottom:14px">{{ status }}</div><div class="child-hero"><div><span class="mono-label">TODAY'S EXPLORATION</span><h1>你好，{{ studentName }}。</h1><p>选一个想探索的主题，或者和 AI 陪伴老师聊几句。</p></div><div class="chip-row"><span class="chip active"><Sparkles :size="13" style="vertical-align:-2px; margin-right:4px" />成长空间在线</span></div></div><div v-if="loading" style="display:grid; gap:10px; margin-top:16px"><div class="skeleton" style="height:260px" /><div class="skeleton" style="height:220px" /></div><template v-else><div class="surface surface-pad" style="margin-top:16px; border-color:#c9e5e4; background:#fff"><div class="surface-title"><h2><Filter :size="16" style="vertical-align:-3px; margin-right:6px" />学习内容筛选</h2><span>{{ visibleVideos.length }} VIDEOS</span></div><div class="chip-row"><button v-for="value in subjects" :key="`s-${value}`" class="chip" :class="{ active: filters.subject === value }" @click="filters.subject = filters.subject === value ? '' : value">{{ value }}</button><button v-for="value in stages" :key="`g-${value}`" class="chip" :class="{ active: filters.stage === value }" @click="filters.stage = filters.stage === value ? '' : value">{{ value }}</button><button v-for="value in levels" :key="`l-${value}`" class="chip" :class="{ active: filters.level === value }" @click="filters.level = filters.level === value ? '' : value">{{ value }}</button></div></div><div class="child-grid"><section><div class="surface surface-pad" style="margin-bottom:12px"><div class="surface-title"><h2><BookOpen :size="16" style="vertical-align:-3px; margin-right:6px" />学习视频</h2><span>{{ visibleVideos.length }} 个内容</span></div><div v-if="!visibleVideos.length" class="empty-state"><strong>还没有匹配内容</strong><span>换个主题试试吧。</span></div><div v-else style="display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px"><article v-for="video in visibleVideos" :key="video.id" class="video-card" :class="{ active: currentVideo?.id === video.id }"><InteractiveVideo :video="video" @click="currentVideo = video" /><div class="video-card-body"><div style="display:flex; align-items:center; justify-content:space-between; gap:8px"><h3>{{ nameForVideo(video) }}</h3><span v-if="isInteractive(video)" class="status ok">互动</span></div><p>{{ video.description || `${video.subject || '综合'} · ${video.stage || '成长内容'}` }}</p></div></article></div></div></section><section class="surface chat-panel"><div class="surface-title" style="padding:18px 18px 0"><h2><Bot :size="17" style="vertical-align:-3px; margin-right:6px; color:#1a9f9c" />AI 陪伴老师</h2><div style="display:flex; align-items:center; gap:6px"><button class="icon-button" type="button" :title="muted ? '开启朗读' : '静音朗读'" :aria-label="muted ? '开启朗读' : '静音朗读'" @click="muted = !muted; stopAudio()"><VolumeX v-if="muted" :size="15" /><Volume2 v-else :size="15" /></button><button v-if="speaking" class="icon-button" type="button" title="停止朗读" aria-label="停止朗读" @click="stopAudio"><Square :size="14" /></button><button class="button button-light" type="button" @click="newSession"><MessageCircle :size="14" />新对话</button></div></div><div style="padding:0 16px"><select v-if="sessions.length" v-model="activeSession" style="width:100%; min-height:38px; padding:8px; border:1px solid #cfe4e7; border-radius:8px; color:#365765; background:#fff" @change="chooseSession(activeSession)"><option v-for="session in sessions" :key="session.id" :value="session">{{ session.title || '儿童陪伴对话' }}</option></select></div><div class="chat-messages"><div v-if="!activeSession" class="empty-state"><MessageCircle :size="28" style="margin-bottom:8px; color:#75cfc3" /><strong>开启一次新的对话</strong><span>想知道什么，都可以问问陪伴老师。</span></div><template v-else><div v-for="message in activeMessages" :key="message.id || message.created_at" class="chat-bubble" :class="{ user: message.role === 'user' }"><div>{{ message.content }}</div><button v-if="message.role !== 'user'" class="row-action" style="margin-top:7px" type="button" @click="speak(message)"><Play :size="12" />朗读</button></div><div v-if="lastAssistant && !muted" style="font-size:11px; color:#7a959c">点击 AI 消息下方按钮，可以听到朗读。</div></template></div><form class="chat-composer" @submit.prevent="sendMessage"><button class="icon-button" type="button" :title="listening ? '停止语音识别' : '语音输入'" :aria-label="listening ? '停止语音识别' : '语音输入'" @click="startVoice"><MicOff v-if="listening" :size="17" color="#df5d78" /><Mic v-else :size="17" /></button><textarea v-model="messageText" placeholder="写下你想说的话..." @keydown.enter.exact.prevent="sendMessage" /><button class="button button-primary" type="submit" :disabled="sending"><Send :size="15" />{{ sending ? '发送中' : '发送' }}</button></form></section></div></template></main></div>
</template>
