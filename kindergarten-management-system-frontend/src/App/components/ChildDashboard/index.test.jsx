import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ChildDashboard from "./index";

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const student = {
  id: 7,
  first_name: "Noah",
  second_name: "Demo",
  surname: "Brown",
  age: 4,
  admission_number: 2026001,
};

const interactiveVideo = {
  id: 12,
  title: "\u7406\u89e3\u6570\u5b57\u4e8c",
  description: "\u7406\u89e3\u4ec0\u4e48\u662f\u4e24\u4e2a",
  subject: "\u6570\u5b66",
  stage: "\u5c0f\u73ed",
  level: "\u521d\u7ea7",
  min_age: 3,
  max_age: 3,
  video_url: "/rails/active_storage/blobs/understand-two.mp4",
  video_filename: "\u7406\u89e3\u6570\u5b57\u4e8c_\u5c0f\u73ed_\u521d\u7ea7_\u6570\u5b66.mp4",
};

const regularVideo = {
  id: 99,
  title: "\u666e\u901a\u89c6\u9891",
  description: "\u6ca1\u6709\u4e92\u52a8\u914d\u7f6e",
  subject: "\u6570\u5b66",
  stage: "\u5c0f\u73ed",
  level: "\u521d\u7ea7",
  min_age: 3,
  max_age: 3,
  video_url: "/rails/active_storage/blobs/regular.mp4",
  video_filename: "regular.mp4",
};

let speechSynthesisMock;
let audioInstances;
let recognitionInstances;

function setupAudioApis({ supported = true, recognitionError = null } = {}) {
  recognitionInstances = [];
  audioInstances = [];
  speechSynthesisMock = {
    cancel: jest.fn(),
    getVoices: jest.fn(() => [{ lang: "zh-CN", name: "Mandarin" }]),
    speak: jest.fn(),
  };

  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: speechSynthesisMock,
  });
  window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
    this.text = text;
  };
  window.Audio = function Audio(src) {
    this.src = src;
    this.pause = jest.fn();
    this.play = jest.fn(() => {
      setTimeout(() => this.onended?.(), 0);
      return Promise.resolve();
    });
    audioInstances.push(this);
  };

  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });

  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;

  if (!supported) {
    return;
  }

  class MockSpeechRecognition {
    constructor() {
      this.lang = "";
      this.continuous = true;
      this.interimResults = true;
      this.maxAlternatives = 0;
      this.start = jest.fn(() => {
        recognitionInstances.push(this);
        setTimeout(() => {
          this.onstart?.();
          if (recognitionError) {
            this.onerror?.({ error: recognitionError });
            this.onend?.();
          }
        }, 0);
      });
      this.stop = jest.fn(() => {
        setTimeout(() => this.onend?.(), 0);
      });
      this.abort = jest.fn(() => {
        setTimeout(() => this.onend?.(), 0);
      });
    }
  }

  Object.defineProperty(window, "webkitSpeechRecognition", {
    configurable: true,
    value: MockSpeechRecognition,
  });
}

function setupAxios({ profile = student, videos = [] } = {}) {
  axios.get.mockImplementation((url) => {
    if (url === "/child/profile") return Promise.resolve({ data: profile });
    if (url === "/child/videos") return Promise.resolve({ data: videos });
    if (url === "/child/chat_sessions") {
      return Promise.resolve({
        data: [
          {
            id: 11,
            title: "\u966a\u4f34\u6d4b\u8bd5",
            messages: [],
            created_at: "2026-06-11T00:00:00Z",
            updated_at: "2026-06-11T00:00:00Z",
          },
        ],
      });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });

  axios.post.mockImplementation((url, body) => {
    if (url === "/child/chat_sessions/11/messages") {
      return Promise.resolve({
        data: {
          user_message: {
            id: 21,
            role: "user",
            content: body.content,
            created_at: "2026-06-11T00:01:00Z",
          },
          assistant_message: {
            id: 22,
            role: "assistant",
            content: "\u6211\u4eec\u4e00\u8d77\u6570\u4e00\u6570\u5427\u3002",
            created_at: "2026-06-11T00:01:01Z",
          },
        },
      });
    }
    if (url === "/child/tts") {
      return Promise.resolve({
        data: {
          provider: "tencent_cloud",
          voice_type: 101016,
          codec: "mp3",
          sample_rate: 16000,
          segments: [{ audio_base64: "audio-data" }],
        },
      });
    }
    return Promise.reject(new Error(`Unexpected POST ${url}`));
  });
}

async function renderDashboard() {
  render(
    <MemoryRouter>
      <ChildDashboard />
    </MemoryRouter>
  );
  await screen.findByText(/\u966a\u4f34\u6d4b\u8bd5/u);
}

function emitRecognizedSpeech(transcript = "\u6211\u60f3\u5b66\u6570\u6570") {
  act(() => {
    recognitionInstances[0]?.onresult?.({
      resultIndex: 0,
      results: [[{ transcript }]],
    });
    recognitionInstances[0]?.onend?.();
  });
}

function flushAsyncWork() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function setMediaTime(video, currentTime) {
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    value: currentTime,
  });
}

function fireMediaTimeUpdate(video) {
  fireEvent(video, new window.Event("timeupdate", { bubbles: true }));
}

function setupFullscreenApis() {
  let fullscreenElement = null;
  const requestFullscreen = jest.fn(function requestFullscreen() {
    fullscreenElement = this;
    document.dispatchEvent(new window.Event("fullscreenchange"));
    return Promise.resolve();
  });
  const exitFullscreen = jest.fn(() => {
    fullscreenElement = null;
    document.dispatchEvent(new window.Event("fullscreenchange"));
    return Promise.resolve();
  });

  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  Object.defineProperty(window.HTMLElement.prototype, "requestFullscreen", {
    configurable: true,
    value: requestFullscreen,
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    value: exitFullscreen,
  });

  return {
    requestFullscreen,
    exitFullscreen,
    getFullscreenElement: () => fullscreenElement,
  };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("childToken", "child-token");
  jest.clearAllMocks();
  setupAudioApis();
  setupAxios();
});

afterEach(() => {
  delete window.AudioContext;
  delete window.webkitAudioContext;
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  delete window.Audio;
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  delete window.HTMLElement.prototype.requestFullscreen;
  delete document.exitFullscreen;
  delete document.fullscreenElement;
});

test("sends browser-recognized speech and plays the assistant reply with Tencent TTS", async () => {
  await renderDashboard();

  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: /\u70b9\u51fb\u8bf4\u8bdd/u }));
    await flushAsyncWork();
  });
  expect(recognitionInstances[0].start).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole("button", { name: /\u505c\u6b62\u8bed\u97f3\u8f93\u5165/u })).toBeInTheDocument();

  emitRecognizedSpeech();
  expect(axios.post).not.toHaveBeenCalledWith("/child/asr", expect.anything(), expect.anything());

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      "/child/chat_sessions/11/messages",
      { content: "\u6211\u60f3\u5b66\u6570\u6570" },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer child-token" }),
      })
    );
  });

  expect(await screen.findByText(/\u6211\u60f3\u5b66\u6570\u6570/u)).toBeInTheDocument();
  expect(await screen.findByText(/\u6211\u4eec\u4e00\u8d77\u6570\u4e00\u6570\u5427\u3002/u)).toBeInTheDocument();

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      "/child/tts",
      { text: "\u6211\u4eec\u4e00\u8d77\u6570\u4e00\u6570\u5427\u3002", message_id: 22 },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer child-token" }),
      })
    );
  });

  await waitFor(() => {
    expect(audioInstances[0].src).toBe("data:audio/mpeg;base64,audio-data");
    expect(audioInstances[0].play).toHaveBeenCalled();
  });

  const ttsCallCount = axios.post.mock.calls.filter(([url]) => url === "/child/tts").length;
  const replayButton = await screen.findByRole("button", { name: /\u6b63\u5728\u6717\u8bfb|\u91cd\u64ad AI \u56de\u590d/u });
  await act(async () => {
    await userEvent.click(replayButton);
    await flushAsyncWork();
  });

  expect(axios.post.mock.calls.filter(([url]) => url === "/child/tts")).toHaveLength(ttsCallCount);
  await waitFor(() => {
    expect(audioInstances).toHaveLength(2);
    expect(audioInstances[1].src).toBe("data:audio/mpeg;base64,audio-data");
    expect(audioInstances[1].play).toHaveBeenCalled();
  });

  expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
});

test("disables voice input with a clear fallback when browser speech recognition is unsupported", async () => {
  setupAudioApis({ supported: false });
  setupAxios();

  await renderDashboard();

  expect(screen.getByText(/\u4e0d\u652f\u6301.*\u6587\u5b57\u8f93\u5165/u)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /\u4e0d\u652f\u6301.*\u6587\u5b57\u8f93\u5165/u })).toBeDisabled();
});

test("shows a permission error and does not send when browser speech recognition is denied", async () => {
  setupAudioApis({ recognitionError: "not-allowed" });
  setupAxios();

  await renderDashboard();
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: /\u70b9\u51fb\u8bf4\u8bdd/u }));
    await flushAsyncWork();
  });

  expect(await screen.findByText(/\u6d4f\u89c8\u5668\u6ca1\u6709\u9ea6\u514b\u98ce\u6743\u9650/u)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalledWith("/child/asr", expect.anything(), expect.anything());
});

test("falls back to browser speech when Tencent TTS fails", async () => {
  axios.post.mockImplementation((url, body) => {
    if (url === "/child/chat_sessions/11/messages") {
      return Promise.resolve({
        data: {
          user_message: {
            id: 21,
            role: "user",
            content: body.content,
            created_at: "2026-06-11T00:01:00Z",
          },
          assistant_message: {
            id: 22,
            role: "assistant",
            content: "\u6211\u4eec\u4e00\u8d77\u6570\u4e00\u6570\u5427\u3002",
            created_at: "2026-06-11T00:01:01Z",
          },
        },
      });
    }
    if (url === "/child/tts") {
      return Promise.reject({ response: { status: 502, data: { error: "\u4e91\u7aef\u5931\u8d25" } } });
    }
    return Promise.reject(new Error(`Unexpected POST ${url}`));
  });

  await renderDashboard();
  await userEvent.type(screen.getByRole("textbox"), "\u4f60\u597d");
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: /\u53d1\u9001/u }));
    await flushAsyncWork();
  });

  expect(await screen.findByText(/\u6211\u4eec\u4e00\u8d77\u6570\u4e00\u6570\u5427\u3002/u)).toBeInTheDocument();
  await screen.findByText(/\u4e91\u7aef\u6717\u8bfb\u5931\u8d25/u);
  expect(speechSynthesisMock.speak).toHaveBeenCalledWith(
    expect.objectContaining({ text: "\u6211\u4eec\u4e00\u8d77\u6570\u4e00\u6570\u5427\u3002" })
  );
});

test("does not play audio when Tencent TTS reports no speakable content", async () => {
  axios.post.mockImplementation((url, body) => {
    if (url === "/child/chat_sessions/11/messages") {
      return Promise.resolve({
        data: {
          user_message: {
            id: 21,
            role: "user",
            content: body.content,
            created_at: "2026-06-11T00:01:00Z",
          },
          assistant_message: {
            id: 22,
            role: "assistant",
            content: "\ud83d\ude0a\ud83c\udf89",
            created_at: "2026-06-11T00:01:01Z",
          },
        },
      });
    }
    if (url === "/child/tts") {
      return Promise.reject({
        response: { status: 422, data: { error: "AI \u56de\u590d\u4e2d\u6ca1\u6709\u53ef\u6717\u8bfb\u5185\u5bb9" } },
      });
    }
    return Promise.reject(new Error(`Unexpected POST ${url}`));
  });

  await renderDashboard();
  await userEvent.type(screen.getByRole("textbox"), "\u4f60\u597d");
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: /\u53d1\u9001/u }));
    await flushAsyncWork();
  });

  expect(await screen.findByText("\ud83d\ude0a\ud83c\udf89")).toBeInTheDocument();
  expect(await screen.findByText(/AI \u56de\u590d\u4e2d\u6ca1\u6709\u53ef\u6717\u8bfb\u5185\u5bb9/u)).toBeInTheDocument();
  expect(audioInstances).toHaveLength(0);
  expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
});

test("renders unconfigured videos with the normal video player", async () => {
  setupAxios({ profile: { ...student, age: 3 }, videos: [regularVideo] });

  await renderDashboard();
  const video = await screen.findByLabelText(/\u666e\u901a\u89c6\u9891 \u64ad\u653e\u5668/u);
  expect(video).toHaveAttribute("src", regularVideo.video_url);

  setMediaTime(video, 8);
  fireMediaTimeUpdate(video);

  expect(screen.queryByText(/\u5c0f\u63d0\u793a/u)).not.toBeInTheDocument();
  expect(screen.queryByText(/\u76d8\u5b50\u91cc\u8981\u627e\u51e0\u4e2a\u5c0f\u997c\u5e72/u)).not.toBeInTheDocument();
});

test("pauses the target video for a quiz and resumes after a correct answer", async () => {
  setupAxios({ profile: { ...student, age: 3 }, videos: [interactiveVideo] });
  const pauseMock = jest.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  const playMock = jest.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());

  try {
    await renderDashboard();
    const video = await screen.findByLabelText(/\u7406\u89e3\u6570\u5b57\u4e8c \u4e92\u52a8\u64ad\u653e\u5668/u);
    await act(async () => {
      await flushAsyncWork();
    });

    setMediaTime(video, 5);
    fireMediaTimeUpdate(video);
    expect(await screen.findByText(/\u770b\u4e00\u770b.*2.*\u4e24\u4e2a/u)).toBeInTheDocument();

    setMediaTime(video, 8);
    fireMediaTimeUpdate(video);
    expect(await screen.findByText(/\u76d8\u5b50\u91cc\u8981\u627e\u51e0\u4e2a\u5c0f\u997c\u5e72/u)).toBeInTheDocument();
    expect(pauseMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(await screen.findByText(/\u518d\u8bd5\u4e00\u6b21/u)).toBeInTheDocument();
    expect(playMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(await screen.findByText(/\u7b54\u5bf9\u5566/u)).toBeInTheDocument();
    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
    });
    expect(screen.queryByText(/\u76d8\u5b50\u91cc\u8981\u627e\u51e0\u4e2a\u5c0f\u997c\u5e72/u)).not.toBeInTheDocument();
  } finally {
    pauseMock.mockRestore();
    playMock.mockRestore();
  }
});

test("uses the player container for fullscreen so interactive overlays stay visible", async () => {
  setupAxios({ profile: { ...student, age: 3 }, videos: [interactiveVideo] });
  const fullscreen = setupFullscreenApis();
  const pauseMock = jest.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

  try {
    await renderDashboard();
    const video = await screen.findByLabelText(/\u7406\u89e3\u6570\u5b57\u4e8c \u4e92\u52a8\u64ad\u653e\u5668/u);
    const fullscreenButton = await screen.findByRole("button", { name: /\u5168\u5c4f\u64ad\u653e/u });

    await userEvent.click(fullscreenButton);

    await waitFor(() => {
      expect(fullscreen.requestFullscreen).toHaveBeenCalledTimes(1);
    });
    const fullscreenElement = fullscreen.getFullscreenElement();
    expect(fullscreenElement).toContainElement(video);
    expect(video.getAttribute("controlslist") || video.getAttribute("controlsList")).toBe("nofullscreen");
    expect(await screen.findByRole("button", { name: /\u9000\u51fa\u5168\u5c4f/u })).toHaveAttribute("aria-pressed", "true");

    setMediaTime(video, 5);
    fireMediaTimeUpdate(video);
    const tip = await screen.findByText(/\u770b\u4e00\u770b.*2.*\u4e24\u4e2a/u);
    expect(fullscreenElement).toContainElement(tip);

    setMediaTime(video, 8);
    fireMediaTimeUpdate(video);
    const question = await screen.findByText(/\u76d8\u5b50\u91cc\u8981\u627e\u51e0\u4e2a\u5c0f\u997c\u5e72/u);
    expect(fullscreenElement).toContainElement(question);
    expect(pauseMock).toHaveBeenCalled();
  } finally {
    pauseMock.mockRestore();
  }
});
