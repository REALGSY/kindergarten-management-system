import {
  getInteractiveVideoConfig,
  interactiveVideoConfigs,
  validateInteractiveVideoConfigs,
} from "./interactiveVideoConfig";

test("all 23 educational videos have valid interaction configurations", () => {
  expect(interactiveVideoConfigs).toHaveLength(23);
  expect(validateInteractiveVideoConfigs()).toBe(true);

  const interactions = interactiveVideoConfigs.flatMap((config) => config.interactions);
  expect(new Set(interactions.map((interaction) => interaction.id)).size).toBe(interactions.length);

  interactiveVideoConfigs.forEach((config) => {
    expect(config.expectedDuration).toBeGreaterThan(0);
    expect(config.interactions.length).toBeGreaterThan(0);

    const times = config.interactions.map((interaction) => interaction.time);
    expect(times).toEqual([...times].sort((first, second) => first - second));
    expect(times.every((time) => time < config.expectedDuration)).toBe(true);

    config.interactions
      .filter((interaction) => interaction.type === "quiz")
      .forEach((interaction) => {
        expect(interaction.options).toContain(interaction.correctAnswer);
      });
  });
});

test("matches videos by exact filename before falling back to the title", () => {
  const filenameConfig = getInteractiveVideoConfig({
    title: "错误标题",
    video_filename: "认识长颈鹿_中班_进阶_自然认知.mp4",
  });
  expect(filenameConfig.match.title).toBe("认识长颈鹿");

  const titleConfig = getInteractiveVideoConfig({ title: "声母歌", video_filename: "legacy-name.mp4" });
  expect(titleConfig.match.video_filename).toBe("声母歌_大班_初级_识字.mp4");
  expect(getInteractiveVideoConfig({ title: "普通视频", video_filename: "regular.mp4" })).toBeNull();
});

test("rejects invalid duration, duplicate IDs, unordered seconds, and missing quiz answers", () => {
  const baseMatch = { title: "测试视频", video_filename: "测试视频_小班_初级_数学.mp4" };

  expect(() =>
    validateInteractiveVideoConfigs([
      { match: baseMatch, expectedDuration: 0, interactions: [] },
    ])
  ).toThrow(/预期视频时长/u);

  expect(() =>
    validateInteractiveVideoConfigs([
      {
        match: baseMatch,
        expectedDuration: 10,
        interactions: [
          { id: "same-id", type: "tip", time: 5, message: "提示" },
          { id: "same-id", type: "action", time: 6, prompt: "动作" },
        ],
      },
    ])
  ).toThrow(/互动 ID 重复/u);

  expect(() =>
    validateInteractiveVideoConfigs([
      {
        match: baseMatch,
        expectedDuration: 10,
        interactions: [
          { id: "later", type: "tip", time: 6, message: "提示" },
          { id: "earlier", type: "action", time: 5, prompt: "动作" },
        ],
      },
    ])
  ).toThrow(/严格升序/u);

  expect(() =>
    validateInteractiveVideoConfigs([
      {
        match: baseMatch,
        expectedDuration: 10,
        interactions: [
          {
            id: "bad-answer",
            type: "quiz",
            time: 5,
            question: "答案？",
            options: ["A", "B", "C"],
            correctAnswer: "D",
          },
        ],
      },
    ])
  ).toThrow(/答案不在选项中/u);
});
