<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Maximize2, Minimize2, Play } from "lucide-vue-next";
import { getInteractiveVideoConfig } from "./interactiveVideoConfig";

const props = defineProps({ video: { type: Object, required: true } });
const videoRef = ref(null); const wrapper = ref(null); const active = ref(null); const selected = ref(""); const feedback = ref(""); const countdown = ref(null); const isFullscreen = ref(false); const triggered = new Set(); let timer = null; let interval = null; let lastTime = 0;
const config = computed(() => getInteractiveVideoConfig(props.video)); const videoSource = computed(() => props.video.video_url || props.video.url || props.video.file_url || props.video.video?.url || ""); const isQuiz = computed(() => active.value?.type === "quiz"); const isAction = computed(() => active.value?.type === "action");
function clearTimers() { if (timer) window.clearTimeout(timer); if (interval) window.clearInterval(interval); timer = null; interval = null; }
function reset() { clearTimers(); active.value = null; selected.value = ""; feedback.value = ""; countdown.value = null; }
function open(interaction) { reset(); active.value = interaction; if (interaction.type === "tip") timer = window.setTimeout(reset, interaction.durationMs || 2600); else videoRef.value?.pause(); }
function timeUpdate(event) { if (!config.value) return; const current = event.target.currentTime; if (current < lastTime) { lastTime = current; return; } const next = config.value.interactions.find((interaction) => interaction.time > lastTime && interaction.time <= current && !triggered.has(interaction.id)); lastTime = current; if (next) { triggered.add(next.id); open(next); } }
function seeked(event) { lastTime = event.target.currentTime; config.value?.interactions.filter((item) => item.time <= lastTime).forEach((item) => triggered.add(item.id)); reset(); }
function answer(option) { selected.value = option; feedback.value = option === active.value.correctAnswer ? active.value.correctFeedback : active.value.incorrectFeedback; if (option === active.value.correctAnswer) timer = window.setTimeout(() => { reset(); videoRef.value?.play().catch?.(() => {}); }, 900); }
function complete() { reset(); videoRef.value?.play().catch?.(() => {}); }
function startCountdown() { if (!active.value?.countdownSeconds || countdown.value !== null) return; countdown.value = active.value.countdownSeconds; interval = window.setInterval(() => { countdown.value -= 1; if (countdown.value <= 0) { clearTimers(); timer = window.setTimeout(() => { reset(); videoRef.value?.play().catch?.(() => {}); }, 500); } }, 1000); }
async function fullscreen() { if (!wrapper.value) return; try { const current = document.fullscreenElement || document.webkitFullscreenElement; const exit = document.exitFullscreen || document.webkitExitFullscreen; const request = wrapper.value.requestFullscreen || wrapper.value.webkitRequestFullscreen; if (current && exit) await exit.call(document); else if (request) await request.call(wrapper.value); } catch {} }
function fullChange() { isFullscreen.value = Boolean(document.fullscreenElement || document.webkitFullscreenElement); }
watch(() => props.video, () => { triggered.clear(); lastTime = 0; reset(); }); onBeforeUnmount(() => { clearTimers(); document.removeEventListener("fullscreenchange", fullChange); }); document.addEventListener("fullscreenchange", fullChange);
</script>
<template><div ref="wrapper" class="interactive-wrap"><video ref="videoRef" class="interactive-video" controls playsinline preload="metadata" :src="videoSource" :aria-label="`${video.title || '互动早教视频'} 互动播放器`" @timeupdate="timeUpdate" @seeked="seeked" @ended="reset" @play="(event) => { if (event.target.currentTime < .25) { triggered.clear(); lastTime=0; reset(); } }" /><button class="fullscreen-button" type="button" :aria-label="isFullscreen ? '退出全屏' : '全屏播放'" :title="isFullscreen ? '退出全屏' : '全屏播放'" @click="fullscreen"><Minimize2 v-if="isFullscreen" :size="16" /><Maximize2 v-else :size="16" /></button><div v-if="active" class="interactive-overlay"><span v-if="active.title" class="mono-label" style="color:#a6efe7">{{ active.title }}</span><p>{{ isQuiz ? active.question : isAction ? active.prompt : active.message }}</p><div v-if="isQuiz" class="answer-grid"><button v-for="option in active.options" :key="option" class="answer-button" :class="{ selected: selected === option }" @click="answer(option)">{{ option }}</button></div><button v-if="isAction && !active.countdownSeconds" class="button button-primary" @click="complete"><Play :size="14" />我完成了，继续</button><template v-if="isAction && active.countdownSeconds"><button v-if="countdown === null" class="button button-primary" @click="startCountdown">开始 {{ active.countdownSeconds }} 秒计时</button><strong v-else class="countdown">{{ countdown > 0 ? `还剩 ${countdown} 秒` : '挑战完成！' }}</strong></template><div v-if="feedback" class="feedback" :class="{ correct: selected === active.correctAnswer }">{{ feedback }}</div></div></div></template>
<style scoped>
.interactive-wrap { position:relative; overflow:hidden; background:#07131d; border-radius:12px; }
.interactive-video { display:block; width:100%; aspect-ratio:16/9; background:#07131d; }
.fullscreen-button { position:absolute; top:10px; right:10px; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border:1px solid rgba(255,255,255,.45); border-radius:9px; color:#fff; background:rgba(0,0,0,.5); }
.interactive-overlay { position:absolute; inset:auto 0 0; padding:18px; color:#fff; background:rgba(4,18,29,.9); }
.interactive-overlay p { margin:8px 0 12px; font-size:15px; line-height:1.6; font-weight:700; }
.answer-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:7px; margin-bottom:10px; }
.answer-button { min-height:42px; border:1px solid rgba(255,255,255,.45); border-radius:8px; color:#fff; background:rgba(255,255,255,.08); font-weight:700; }
.answer-button.selected { color:#124e5a; background:#d4fbf2; }
.feedback { margin-top:10px; padding:8px 10px; border-radius:7px; color:#ffced6; background:rgba(180,53,80,.35); font-size:12px; }
.feedback.correct { color:#d7ffef; background:rgba(26,136,112,.4); }
.countdown { display:inline-block; margin-top:8px; padding:9px 13px; border-radius:8px; color:#124e5a; background:#d4fbf2; }
@media (max-width:600px) { .answer-grid { grid-template-columns:1fr; } .interactive-overlay { padding:12px; } }
</style>
