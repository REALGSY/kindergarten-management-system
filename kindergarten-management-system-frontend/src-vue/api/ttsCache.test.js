// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { audioMimeType, getCachedTtsAudio, normalizeTtsAudioPayload, rememberTtsAudio, ttsCacheKey } from "./ttsCache";

describe("TTS audio cache", () => {
  it("normalizes payloads and reads the remembered audio", async () => {
    const message = { id: "message-1", role: "assistant", content: "你好，今天一起数数吧。" };
    const payload = { provider: "test", codec: "mp3", segments: [{ audio_base64: "ZmFrZQ==" }, { audio_base64: "" }] };
    const key = ttsCacheKey(message);

    expect(audioMimeType("wav")).toBe("audio/wav");
    expect(normalizeTtsAudioPayload(payload)?.segments).toHaveLength(1);
    await rememberTtsAudio(key, payload);
    await expect(getCachedTtsAudio(key)).resolves.toMatchObject({ codec: "mp3", segments: [{ audio_base64: "ZmFrZQ==" }] });
  });

  it("ignores payloads without playable segments", async () => {
    const key = ttsCacheKey({ id: "empty", content: "无音频" });
    await rememberTtsAudio(key, { codec: "mp3", segments: [] });
    await expect(getCachedTtsAudio(key)).resolves.toBeNull();
  });
});
