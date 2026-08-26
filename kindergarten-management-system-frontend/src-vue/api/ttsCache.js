const DB_NAME = "kindergarten-child-tts-audio";
const STORE_NAME = "ttsAudio";
const DB_VERSION = 1;

const memoryCache = new Map();
let databasePromise;

function hashText(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function messageKey(message) {
  return message?.id || `${message?.role || "assistant"}-${message?.created_at || message?.content || ""}`;
}

export function ttsCacheKey(message) {
  const content = String(message?.content || "").trim();
  return `tts:v1:${messageKey(message)}:${content.length}:${hashText(content)}`;
}

export function normalizeTtsAudioPayload(data) {
  const segments = Array.isArray(data?.segments)
    ? data.segments.filter((segment) => segment?.audio_base64)
    : [];
  if (!segments.length) return null;
  return {
    provider: data?.provider || "tencent_cloud",
    voice_type: data?.voice_type,
    codec: data?.codec || "mp3",
    sample_rate: data?.sample_rate,
    segments,
  };
}

function isValidPayload(payload) {
  return Boolean(normalizeTtsAudioPayload(payload));
}

function openDatabase() {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(null);
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return databasePromise;
}

export async function getCachedTtsAudio(key) {
  const inMemory = memoryCache.get(key);
  if (isValidPayload(inMemory)) return inMemory;
  const database = await openDatabase();
  if (!database) return null;

  try {
    const persisted = await new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result?.payload || null);
      request.onerror = () => resolve(null);
    });
    const payload = normalizeTtsAudioPayload(persisted);
    if (payload) memoryCache.set(key, payload);
    return payload;
  } catch {
    try { database.close(); } catch { /* IndexedDB is an optional optimization. */ }
    return null;
  }
}

export async function rememberTtsAudio(key, data) {
  const payload = normalizeTtsAudioPayload(data);
  if (!payload) return null;
  memoryCache.set(key, payload);

  const database = await openDatabase();
  if (!database) return payload;
  try {
    await new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ key, payload, saved_at: Date.now() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {
    try { database.close(); } catch { /* IndexedDB is an optional optimization. */ }
  }
  return payload;
}

export function audioMimeType(codec) {
  if (codec === "wav") return "audio/wav";
  if (codec === "pcm") return "audio/L16";
  return "audio/mpeg";
}

export const ttsCacheConstants = { DB_NAME, STORE_NAME, DB_VERSION };
