// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";

const { getVideos } = vi.hoisted(() => ({ getVideos: vi.fn() }));

vi.mock("../api/client", () => ({
  api: {
    get: getVideos,
    form: vi.fn(),
    delete: vi.fn(),
  },
  mediaUrl: (path) => path,
}));

import EducationalVideosView from "./EducationalVideosView.vue";

const videos = [
  {
    id: 1,
    title: "理解计数",
    description: "通过互动练习理解基础计数。",
    stage: "中班",
    level: "进阶",
    subject: "数学",
    min_age: 4,
    max_age: 5,
    status: "published",
    video_url: "https://media.example.test/counting.mp4",
    video_filename: "counting.mp4",
  },
  {
    id: 2,
    title: "待补充素材",
    status: "draft",
    video_url: null,
    video_filename: null,
  },
];

let wrapper;

describe("admin educational video preview", () => {
  beforeEach(() => {
    getVideos.mockReset().mockResolvedValue(videos);
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("opens a playable preview with adaptation metadata and closes on Escape", async () => {
    wrapper = mount(EducationalVideosView, { attachTo: document.body });
    await flushPromises();

    const previewButton = wrapper.get('button[aria-label="预览理解计数"]');
    await previewButton.trigger("click");
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    const player = dialog.querySelector("video");
    expect(dialog.textContent).toContain("理解计数");
    expect(dialog.textContent).toContain("中班 / 进阶");
    expect(dialog.textContent).toContain("4 - 5 岁");
    expect(player.getAttribute("src")).toBe("https://media.example.test/counting.mp4");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(previewButton.element);
  });

  it("disables preview when a record has no attached video and reports playback errors", async () => {
    wrapper = mount(EducationalVideosView, { attachTo: document.body });
    await flushPromises();

    expect(wrapper.get('button[aria-label="待补充素材暂无可预览文件"]').attributes("disabled")).toBeDefined();

    await wrapper.get('button[aria-label="预览理解计数"]').trigger("click");
    await nextTick();
    document.body.querySelector("video").dispatchEvent(new Event("error"));
    await nextTick();
    expect(document.body.querySelector('[role="alert"]').textContent).toContain("视频加载失败");
  });
});
