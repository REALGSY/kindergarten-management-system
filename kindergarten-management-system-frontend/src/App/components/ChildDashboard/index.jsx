import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  MicrophoneIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  StopIcon,
} from "@heroicons/react/24/solid";
import { paraKindergartenLogo, SYSTEM_LOGO_ALT } from "../../brand";
import InteractiveVideoPlayer from "./InteractiveVideoPlayer";

const SPEECH_LOCALE = "zh-CN";
const TTS_AUDIO_CACHE_DB_NAME = "kindergarten-child-tts-audio";
const TTS_AUDIO_CACHE_STORE_NAME = "ttsAudio";
const TTS_AUDIO_CACHE_DB_VERSION = 1;

function authConfig(token) {
  return {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
}

function studentName(student) {
  return [student?.first_name, student?.second_name, student?.surname].filter(Boolean).join(" ");
}

function uniqueValues(items, key) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );
}

function stageForAge(age) {
  const numericAge = Number(age);
  if (!Number.isFinite(numericAge)) return "";
  if (numericAge <= 3) return "小班";
  if (numericAge === 4) return "中班";
  return "大班";
}

function messageKey(message) {
  return message.id || `${message.role}-${message.created_at || message.content}`;
}

function hashText(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function ttsAudioCacheKey(message) {
  const content = message?.content?.trim() || "";
  return `tts:v1:${messageKey(message)}:${content.length}:${hashText(content)}`;
}

function isValidTtsAudioPayload(payload) {
  return Boolean(payload?.codec && Array.isArray(payload.segments) && payload.segments.some((segment) => segment?.audio_base64));
}

function normalizeTtsAudioPayload(data) {
  const segments = Array.isArray(data?.segments) ? data.segments.filter((segment) => segment?.audio_base64) : [];
  if (segments.length === 0) return null;

  return {
    provider: data?.provider || "tencent_cloud",
    voice_type: data?.voice_type,
    codec: data?.codec || "mp3",
    sample_rate: data?.sample_rate,
    segments,
  };
}

function openTtsAudioCacheDb() {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(null);

  try {
    return new Promise((resolve) => {
      const request = window.indexedDB.open(TTS_AUDIO_CACHE_DB_NAME, TTS_AUDIO_CACHE_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TTS_AUDIO_CACHE_STORE_NAME)) {
          db.createObjectStore(TTS_AUDIO_CACHE_STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  } catch {
    return Promise.resolve(null);
  }
}

async function readPersistedTtsAudio(cacheKey) {
  const db = await openTtsAudioCacheDb();
  if (!db) return null;

  try {
    return await new Promise((resolve) => {
      let payload = null;
      const transaction = db.transaction(TTS_AUDIO_CACHE_STORE_NAME, "readonly");
      const request = transaction.objectStore(TTS_AUDIO_CACHE_STORE_NAME).get(cacheKey);

      request.onsuccess = () => {
        payload = request.result?.payload || null;
      };
      request.onerror = () => {
        payload = null;
      };
      transaction.oncomplete = () => {
        db.close();
        resolve(isValidTtsAudioPayload(payload) ? payload : null);
      };
      transaction.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    db.close();
    return null;
  }
}

async function writePersistedTtsAudio(cacheKey, payload) {
  if (!isValidTtsAudioPayload(payload)) return;

  let db = null;
  try {
    db = await openTtsAudioCacheDb();
    if (!db) return;

    await new Promise((resolve) => {
      const transaction = db.transaction(TTS_AUDIO_CACHE_STORE_NAME, "readwrite");
      transaction.objectStore(TTS_AUDIO_CACHE_STORE_NAME).put({
        key: cacheKey,
        payload,
        saved_at: Date.now(),
      });
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    try {
      db.close();
    } catch {
      // IndexedDB persistence is an optimization; playback can continue from memory.
    }
  }
}

function getSpeechRecognitionConstructors() {
  if (typeof window === "undefined") return [];

  const constructors = [];
  if (window.webkitSpeechRecognition) {
    constructors.push({ name: "webkit", Constructor: window.webkitSpeechRecognition });
  }
  if (window.SpeechRecognition && window.SpeechRecognition !== window.webkitSpeechRecognition) {
    constructors.push({ name: "standard", Constructor: window.SpeechRecognition });
  }
  return constructors;
}

function isRemoteInsecureContext() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  return !window.isSecureContext && !isLocalHost;
}

function speechRecognitionErrorMessage(error) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "浏览器没有麦克风权限，请允许后再试，或继续文字输入。";
  }
  if (error === "no-speech") return "没有听到声音，请再试一次。";
  if (error === "audio-capture") return "没有检测到麦克风，请检查设备后再试。";
  if (error === "network") {
    return "浏览器内置语音服务连接失败，这不一定是当前网络或系统后端问题。请刷新重试，或继续文字输入。";
  }
  return "语音识别失败，请再试一次或使用文字输入。";
}

function getMandarinVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang?.toLowerCase() === "zh-cn") ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("zh")) ||
    null
  );
}

function audioMimeType(codec) {
  if (codec === "wav") return "audio/wav";
  if (codec === "pcm") return "audio/L16";
  return "audio/mpeg";
}

export default function ChildDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("childToken");
  const [student, setStudent] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const voiceCancelledRef = useRef(false);
  const voiceRecognitionFailedRef = useRef(false);
  const retryRecognitionAttemptRef = useRef(null);
  const audioRef = useRef(null);
  const audioStopperRef = useRef(null);
  const playbackTokenRef = useRef(0);
  const mutedRef = useRef(false);
  const ttsAudioCacheRef = useRef(new Map());
  const config = useMemo(() => authConfig(token), [token]);
  const speechRecognitionConstructors = getSpeechRecognitionConstructors();
  const voiceInputSupported = speechRecognitionConstructors.length > 0;
  const speechRecognitionSupported = voiceInputSupported;
  const speechSynthesisSupported = typeof window !== "undefined" && Boolean(window.speechSynthesis);
  const voiceInputBlockedMessage = !speechRecognitionSupported
    ? "当前浏览器不支持语音识别，可继续文字输入。"
    : isRemoteInsecureContext()
      ? "当前页面不是安全连接，浏览器可能禁止麦克风，可继续文字输入。"
      : "";

  const subjects = uniqueValues(videos, "subject");
  const stages = uniqueValues(videos, "stage");
  const levels = uniqueValues(videos, "level");
  const visibleVideos = videos.filter((video) => {
    if (selectedSubject && video.subject !== selectedSubject) return false;
    if (selectedStage && video.stage !== selectedStage) return false;
    if (selectedLevel && video.level !== selectedLevel) return false;
    return true;
  });
  const groupedVideos = visibleVideos.reduce((groups, video) => {
    const subject = video.subject || "未分类";
    return { ...groups, [subject]: [...(groups[subject] || []), video] };
  }, {});
  const hasVideoFilters = selectedSubject || selectedStage || selectedLevel;

  const stopCurrentPlayback = useCallback(() => {
    playbackTokenRef.current += 1;
    if (audioStopperRef.current) {
      audioStopperRef.current();
      audioStopperRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
  }, [speechSynthesisSupported]);

  useEffect(() => {
    if (!token) return;
    setStatusMessage("");

    Promise.all([
      axios.get("/child/profile", config),
      axios.get("/child/videos", config),
      axios.get("/child/chat_sessions", config),
    ])
      .then(([studentRes, videoRes, sessionRes]) => {
        setStudent(studentRes.data);
        localStorage.setItem("child", `${studentRes.data.id}`);
        localStorage.setItem("child_data", JSON.stringify(studentRes.data));
        setVideos(Array.isArray(videoRes.data) ? videoRes.data : []);
        setSelectedStage(stageForAge(studentRes.data.age));
        const nextSessions = Array.isArray(sessionRes.data) ? sessionRes.data : [];
        setSessions(nextSessions);
        setActiveSession(nextSessions[0] || null);
      })
      .catch(() => setStatusMessage("儿童端信息加载失败，请重新登录。"));
  }, [token, config]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (speechSynthesisSupported) window.speechSynthesis.getVoices();

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopCurrentPlayback();
    };
  }, [speechSynthesisSupported, stopCurrentPlayback]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopSpeaking() {
    stopCurrentPlayback();
    setSpeakingMessageId(null);
  }

  function cancelVoiceInput(nextStatus = "") {
    voiceCancelledRef.current = true;
    finalTranscriptRef.current = "";
    retryRecognitionAttemptRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // The browser may already have ended the recognition session.
      }
    }

    recognitionRef.current = null;
    setIsListening(false);
    setVoiceStatus(nextStatus);
  }


  function resetVoiceCapture(nextStatus = "") {
    cancelVoiceInput(nextStatus);
  }

  function beginSpeaking(message) {
    stopCurrentPlayback();
    const playbackToken = playbackTokenRef.current;
    setSpeakingMessageId(messageKey(message));
    return playbackToken;
  }

  function speakWithBrowser(message, playbackToken) {
    const content = message?.content?.trim();
    if (!content || mutedRef.current) return false;

    if (!speechSynthesisSupported) {
      setVoiceStatus("AI 已回复，当前浏览器不支持自动朗读。");
      setSpeakingMessageId(null);
      return false;
    }

    const speechId = messageKey(message);
    const utterance = new SpeechSynthesisUtterance(content);
    const voice = getMandarinVoice();
    utterance.lang = SPEECH_LOCALE;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    if (voice) utterance.voice = voice;

    window.speechSynthesis.cancel();
    setSpeakingMessageId(speechId);
    utterance.onend = () => {
      if (playbackTokenRef.current === playbackToken) {
        setSpeakingMessageId((current) => (current === speechId ? null : current));
      }
    };
    utterance.onerror = () => {
      if (playbackTokenRef.current === playbackToken) {
        setSpeakingMessageId((current) => (current === speechId ? null : current));
        setVoiceStatus("朗读失败，请稍后重试。");
      }
    };
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function playSingleAudioSegment(segment, codec, playbackToken) {
    return new Promise((resolve, reject) => {
      const audioBase64 = segment?.audio_base64;
      const AudioConstructor = typeof window !== "undefined" ? window.Audio : null;
      if (!audioBase64 || !AudioConstructor) {
        reject(new Error("Audio playback is unavailable"));
        return;
      }

      const audio = new AudioConstructor(`data:${audioMimeType(codec)};base64,${audioBase64}`);
      let settled = false;

      function cleanup() {
        audio.onended = null;
        audio.onerror = null;
        if (audioRef.current === audio) audioRef.current = null;
        if (audioStopperRef.current === stopAudio) audioStopperRef.current = null;
      }

      function finish() {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      }

      function fail() {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Audio playback failed"));
      }

      function stopAudio() {
        if (settled) return;
        settled = true;
        audio.pause();
        audio.src = "";
        cleanup();
        resolve();
      }

      audioRef.current = audio;
      audioStopperRef.current = stopAudio;
      audio.onended = finish;
      audio.onerror = fail;

      const playResult = audio.play();
      if (playResult?.catch) playResult.catch(fail);
    });
  }

  async function playAudioSegments(segments, codec, playbackToken) {
    for (const segment of segments) {
      if (playbackTokenRef.current !== playbackToken || mutedRef.current) return;
      await playSingleAudioSegment(segment, codec, playbackToken);
    }
  }

  async function getCachedTtsAudio(cacheKey) {
    const memoryCachedAudio = ttsAudioCacheRef.current.get(cacheKey);
    if (isValidTtsAudioPayload(memoryCachedAudio)) return memoryCachedAudio;

    const persistedAudio = await readPersistedTtsAudio(cacheKey);
    if (isValidTtsAudioPayload(persistedAudio)) {
      ttsAudioCacheRef.current.set(cacheKey, persistedAudio);
      return persistedAudio;
    }

    return null;
  }

  function rememberTtsAudio(cacheKey, payload) {
    if (!isValidTtsAudioPayload(payload)) return;

    ttsAudioCacheRef.current.set(cacheKey, payload);
    writePersistedTtsAudio(cacheKey, payload);
  }

  async function speakAssistantMessage(message) {
    const content = message?.content?.trim();
    if (!content || mutedRef.current) return;

    const playbackToken = beginSpeaking(message);
    const cacheKey = ttsAudioCacheKey(message);

    try {
      const cachedAudio = await getCachedTtsAudio(cacheKey);
      if (cachedAudio) {
        if (playbackTokenRef.current !== playbackToken || mutedRef.current) return;
        setVoiceStatus("正在播放已生成的朗读音频。");
        await playAudioSegments(cachedAudio.segments, cachedAudio.codec || "mp3", playbackToken);
        if (playbackTokenRef.current === playbackToken) setSpeakingMessageId(null);
        return;
      }

      setVoiceStatus("正在生成朗读音频。");
      const requestBody = { text: content };
      if (message.id) requestBody.message_id = message.id;
      const res = await axios.post("/child/tts", requestBody, config);
      const generatedAudio = normalizeTtsAudioPayload(res.data);
      if (!generatedAudio) throw new Error("Empty TTS audio");
      rememberTtsAudio(cacheKey, generatedAudio);

      if (playbackTokenRef.current !== playbackToken || mutedRef.current) return;
      setVoiceStatus("AI 已回复，正在朗读。");
      await playAudioSegments(generatedAudio.segments, generatedAudio.codec || "mp3", playbackToken);
      if (playbackTokenRef.current === playbackToken) setSpeakingMessageId(null);
    } catch (error) {
      if (playbackTokenRef.current !== playbackToken || mutedRef.current) return;

      const errorMessage = error.response?.data?.error;
      if (error.response?.status === 422 && errorMessage === "AI 回复中没有可朗读内容") {
        setVoiceStatus(errorMessage);
        setSpeakingMessageId(null);
        return;
      }

      if (speechSynthesisSupported) {
        setVoiceStatus("云端朗读失败，正在使用浏览器朗读。");
        speakWithBrowser(message, playbackToken);
        return;
      }

      setVoiceStatus(errorMessage || "朗读失败，请稍后重试。");
      setSpeakingMessageId(null);
    }
  }

  async function submitMessage(rawContent, options = {}) {
    const content = rawContent.trim();
    if (!content || !activeSession || sending) return;

    if (!options.fromVoice) resetVoiceCapture("");
    stopSpeaking();
    setSending(true);
    setStatusMessage("");
    setVoiceStatus(options.fromVoice ? "已听清，正在发送给 AI。" : "");
    setMessageText("");
    try {
      const res = await axios.post(`/child/chat_sessions/${activeSession.id}/messages`, { content }, config);
      const nextMessages = [
        ...(activeSession.messages || []),
        res.data.user_message,
        res.data.assistant_message,
      ].filter(Boolean);
      const updatedSession = { ...activeSession, messages: nextMessages, updated_at: new Date().toISOString() };
      setActiveSession(updatedSession);
      setSessions((current) => [updatedSession, ...current.filter((session) => session.id !== activeSession.id)]);

      if (res.data.assistant_message?.content) {
        if (mutedRef.current) {
          setVoiceStatus("AI 已回复，自动朗读已关闭。");
        } else {
          setVoiceStatus("AI 已回复，正在朗读。");
          speakAssistantMessage(res.data.assistant_message);
        }
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.error || "AI 回复失败，请稍后重试。");
      setMessageText(content);
      if (options.fromVoice) setVoiceStatus("发送失败，已把识别内容放回输入框。");
    } finally {
      setSending(false);
    }
  }

  async function startNewSession() {
    resetVoiceCapture("");
    stopSpeaking();
    setStatusMessage("");
    try {
      const res = await axios.post(
        "/child/chat_sessions",
        { title: `${studentName(student) || "孩子"} 的陪伴对话` },
        config
      );
      setSessions((current) => [res.data, ...current]);
      setActiveSession(res.data);
    } catch (error) {
      setStatusMessage(error.response?.data?.error || "新建聊天失败。");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    await submitMessage(messageText);
  }

  function stopVoiceInput() {
    if (!recognitionRef.current) return;

    setVoiceStatus("正在整理语音...");
    try {
      recognitionRef.current.stop();
    } catch {
      cancelVoiceInput("语音识别已停止，请再试一次。");
    }
  }

  function startVoiceInput() {
    if (!activeSession) {
      setVoiceStatus("请先选择或新建一个对话。");
      return;
    }
    if (sending) return;
    if (voiceInputBlockedMessage) {
      setVoiceStatus(voiceInputBlockedMessage);
      return;
    }

    stopSpeaking();
    startSpeechRecognitionAttempt(0);
  }

  function startSpeechRecognitionAttempt(attemptIndex) {
    const recognitionEntry = speechRecognitionConstructors[attemptIndex];
    if (!recognitionEntry) {
      setIsListening(false);
      setVoiceStatus(speechRecognitionErrorMessage("network"));
      return;
    }

    const recognition = new recognitionEntry.Constructor();
    recognition.lang = SPEECH_LOCALE;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";
    voiceCancelledRef.current = false;
    voiceRecognitionFailedRef.current = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus("正在听，请说话。");
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || "";
      }
      finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
    };
    recognition.onerror = (event) => {
      voiceRecognitionFailedRef.current = true;
      finalTranscriptRef.current = "";
      if (event.error === "network" && attemptIndex + 1 < speechRecognitionConstructors.length) {
        retryRecognitionAttemptRef.current = attemptIndex + 1;
        setVoiceStatus("浏览器语音服务连接失败，正在切换兼容模式重试。");
        return;
      }
      setVoiceStatus(speechRecognitionErrorMessage(event.error));
    };
    recognition.onend = () => {
      const wasCancelled = voiceCancelledRef.current;
      const failed = voiceRecognitionFailedRef.current;
      const transcript = finalTranscriptRef.current.trim();
      const retryAttempt = retryRecognitionAttemptRef.current;

      recognitionRef.current = null;
      finalTranscriptRef.current = "";
      voiceCancelledRef.current = false;
      voiceRecognitionFailedRef.current = false;
      retryRecognitionAttemptRef.current = null;
      setIsListening(false);

      if (!wasCancelled && failed && retryAttempt !== null) {
        startSpeechRecognitionAttempt(retryAttempt);
        return;
      }
      if (wasCancelled || failed) return;
      if (!transcript) {
        setVoiceStatus("没有听清，请再试一次。");
        return;
      }

      submitMessage(transcript, { fromVoice: true });
    };

    try {
      setVoiceStatus("正在请求麦克风权限...");
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      if (attemptIndex + 1 < speechRecognitionConstructors.length) {
        setVoiceStatus("语音识别启动失败，正在切换兼容模式重试。");
        startSpeechRecognitionAttempt(attemptIndex + 1);
        return;
      }
      setVoiceStatus("语音识别启动失败，请再试一次或使用文字输入。");
    }
  }

  function handleVoiceButton() {
    if (isListening) {
      stopVoiceInput();
      return;
    }
    startVoiceInput();
  }

  function handleToggleMute() {
    const nextMuted = !muted;
    if (nextMuted) stopSpeaking();
    setMuted(nextMuted);
    setVoiceStatus(nextMuted ? "已关闭自动朗读。" : "已开启自动朗读。");
  }

  function replayAssistantMessage(message) {
    if (muted) {
      setVoiceStatus("已静音，请先开启朗读。");
      return;
    }

    setVoiceStatus("正在重播 AI 回复。");
    speakAssistantMessage(message);
  }

  function selectSession(session) {
    resetVoiceCapture("");
    stopSpeaking();
    setActiveSession(session);
  }

  function handleLogout() {
    resetVoiceCapture("");
    stopSpeaking();
    localStorage.removeItem("childToken");
    localStorage.removeItem("child");
    localStorage.removeItem("child_data");
    navigate("/child_login");
  }

  function clearVideoFilters() {
    setSelectedSubject("");
    setSelectedStage("");
    setSelectedLevel("");
  }

  const voiceButtonTitle = isListening
    ? "\u505c\u6b62\u8bed\u97f3\u8f93\u5165"
    : voiceInputBlockedMessage || "\u70b9\u51fb\u8bf4\u8bdd";
  const voiceButtonDisabled = sending || (!isListening && (!activeSession || Boolean(voiceInputBlockedMessage)));
  const muteButtonTitle = muted ? "开启自动朗读" : "关闭自动朗读";

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-md bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-gray-700">请先登录儿童端。</p>
          <Link className="rounded bg-[#B124A3] px-4 py-2 text-white" to="/child_login">前往儿童登录</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img className="h-12 w-auto" src={paraKindergartenLogo} alt={SYSTEM_LOGO_ALT} />
            <div>
              <p className="text-sm text-pink-600">KinderJoy 儿童端</p>
              <h1 className="text-2xl font-semibold text-gray-900">陪伴学习空间</h1>
            </div>
          </div>
          <button className="rounded border px-3 py-2 text-sm text-gray-700" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-md bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">当前孩子</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">{studentName(student) || "加载中..."}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="rounded bg-slate-50 p-3">
                <p className="text-xs text-gray-500">学号</p>
                <p className="font-medium text-gray-900">{student?.admission_number || "-"}</p>
              </div>
              <div className="rounded bg-slate-50 p-3">
                <p className="text-xs text-gray-500">年龄</p>
                <p className="font-medium text-gray-900">{student?.age ? `${student.age} 岁` : "-"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">陪伴对话</h2>
              <button className="rounded bg-[#B124A3] px-3 py-1 text-sm text-white" onClick={startNewSession}>
                新对话
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className={`block w-full rounded border px-3 py-2 text-left text-sm ${activeSession?.id === session.id ? "border-pink-600 bg-pink-50 text-pink-700" : "text-gray-700"}`}
                  onClick={() => selectSession(session)}>
                  {session.title || "儿童陪伴对话"}
                </button>
              ))}
              {sessions.length === 0 ? <p className="text-sm text-gray-500">还没有对话，点击“新对话”开始。</p> : null}
            </div>
          </section>
        </aside>

        <div className="space-y-5">
          {statusMessage ? <div className="rounded bg-pink-50 p-3 text-pink-700">{statusMessage}</div> : null}

          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI 早教陪伴</h2>
                <p className="text-sm text-gray-500">用简短、温和的中文陪孩子聊天和学习。</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`flex h-10 w-10 items-center justify-center rounded border text-gray-700 hover:bg-slate-50 ${muted ? "border-pink-200 bg-pink-50 text-pink-700" : ""}`}
                  type="button"
                  onClick={handleToggleMute}
                  title={muteButtonTitle}
                  aria-label={muteButtonTitle}>
                  {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded border text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  onClick={stopSpeaking}
                  disabled={!speakingMessageId}
                  title="停止朗读"
                  aria-label="停止朗读">
                  <StopIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 h-80 overflow-y-auto rounded border bg-slate-50 p-3">
              {!activeSession ? <p className="text-sm text-gray-500">请选择或新建一个对话。</p> : null}
              {(activeSession?.messages || []).map((item) => {
                const itemKey = messageKey(item);
                const isAssistant = item.role === "assistant";
                const isSpeaking = speakingMessageId === itemKey;

                return (
                  <div key={itemKey} className={`mb-3 flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[85%] items-start gap-2 ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`rounded-md px-3 py-2 text-sm ${item.role === "user" ? "bg-pink-600 text-white" : "bg-white text-gray-800 shadow-sm"}`}>
                        {item.content}
                      </div>
                      {isAssistant ? (
                        <button
                          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white text-gray-600 shadow-sm hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-40 ${isSpeaking ? "border-pink-500 text-pink-700" : ""}`}
                          type="button"
                          onClick={() => replayAssistantMessage(item)}
                          disabled={!item.content}
                          title={isSpeaking ? "正在朗读" : "重播 AI 回复"}
                          aria-label={isSpeaking ? "正在朗读" : "重播 AI 回复"}>
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {sending ? <p className="text-sm text-pink-600">正在等待 AI 回复...</p> : null}
            </div>
            {voiceInputBlockedMessage ? <p className="mt-2 text-xs text-gray-500">{voiceInputBlockedMessage}</p> : null}
            {voiceStatus ? <p className="mt-2 text-sm text-pink-700">{voiceStatus}</p> : null}
            <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
              <input
                className="min-w-0 flex-1 rounded border p-3"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="和陪伴老师说点什么..."
                disabled={!activeSession || sending || isListening}
              />
              <button
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded border text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${isListening ? "border-pink-600 bg-pink-50 text-pink-700" : ""}`}
                type="button"
                onClick={handleVoiceButton}
                disabled={voiceButtonDisabled}
                title={voiceButtonTitle}
                aria-label={voiceButtonTitle}
                aria-pressed={isListening}>
                {isListening ? <StopIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
              </button>
              <button className="rounded bg-[#B124A3] px-5 py-2 text-white disabled:opacity-50" type="submit" disabled={!activeSession || sending || isListening || !messageText.trim()}>
                发送
              </button>
            </form>
          </section>

          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">早教视频</h2>
                <p className="text-sm text-gray-500">默认展示当前年龄段视频，也可切换其它班级阶段观看。</p>
              </div>
              {hasVideoFilters ? (
                <button className="rounded border px-3 py-2 text-sm text-gray-700" type="button" onClick={clearVideoFilters}>
                  清除筛选
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="text-sm text-gray-600">
                <span className="mb-1 block">学科</span>
                <select className="w-full rounded border p-2" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                  <option value="">全部学科</option>
                  {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-600">
                <span className="mb-1 block">阶段</span>
                <select className="w-full rounded border p-2" value={selectedStage} onChange={(event) => setSelectedStage(event.target.value)}>
                  <option value="">全部阶段</option>
                  {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-600">
                <span className="mb-1 block">级别</span>
                <select className="w-full rounded border p-2" value={selectedLevel} onChange={(event) => setSelectedLevel(event.target.value)}>
                  <option value="">全部级别</option>
                  {levels.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 space-y-6">
              {Object.entries(groupedVideos).map(([subject, subjectVideos]) => (
                <div key={subject}>
                  <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2">
                    <h3 className="font-semibold text-gray-900">{subject}</h3>
                    <span className="text-xs text-gray-500">{subjectVideos.length} 个视频</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {subjectVideos.map((video) => (
                      <article key={video.id} className="rounded-md border p-3">
                        <InteractiveVideoPlayer video={video} />
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{video.subject}</span>
                          <span>{video.stage}</span>
                          <span>{video.level}</span>
                          <span>{video.min_age}-{video.max_age} 岁</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-gray-900">{video.title}</h4>
                        <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{video.description || "暂无简介"}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
              {visibleVideos.length === 0 ? <p className="text-sm text-gray-500">暂无匹配的已发布视频。</p> : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
