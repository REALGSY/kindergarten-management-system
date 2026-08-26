export const INTERACTIVE_VIDEO_FILENAME = "理解数字二_小班_初级_数学.mp4";
export const INTERACTIVE_VIDEO_TITLE = "理解数字二";

const DEFAULT_INCORRECT_FEEDBACK = "再观察、重新数一数或再想一次。";

function tip(id, time, message, title = "小提示") {
  return { id, type: "tip", time, durationMs: 2600, title, message };
}

function quiz(id, time, question, options, correctAnswer, correctFeedback) {
  return {
    id,
    type: "quiz",
    time,
    question,
    options,
    correctAnswer,
    correctFeedback: correctFeedback || `答对啦！正确答案是“${correctAnswer}”。`,
    incorrectFeedback: DEFAULT_INCORRECT_FEEDBACK,
  };
}

function action(id, time, prompt, countdownSeconds) {
  return {
    id,
    type: "action",
    time,
    title: countdownSeconds ? "计时挑战" : "动一动",
    prompt,
    ...(countdownSeconds ? { countdownSeconds } : {}),
  };
}

function videoConfig(title, videoFilename, expectedDuration, interactions) {
  return {
    match: { title, video_filename: videoFilename },
    expectedDuration,
    interactions,
  };
}

export const interactiveVideoConfigs = [
  videoConfig(INTERACTIVE_VIDEO_TITLE, INTERACTIVE_VIDEO_FILENAME, 9.91, [
    {
      id: "understand-two-tip",
      type: "tip",
      time: 5,
      durationMs: 2600,
      title: "小提示",
      message: "看一看，'2' 表示两个一样的东西。",
    },
    {
      id: "understand-two-question",
      type: "quiz",
      time: 8,
      question: "盘子里要找几个小饼干？",
      options: ["1", "2", "3"],
      correctAnswer: "2",
      correctFeedback: "答对啦，2 就是两个！",
      incorrectFeedback: "再试一次，找找两个在一起的东西。",
    },
  ]),
  videoConfig("认识常见物品", "认识常见物品_小班_初级_识字.mp4", 38.83, [
    quiz("familiar-things-pencil", 18, "刚才那件细长、可以写字的物品是什么？", ["铅笔", "杯子", "帽子"], "铅笔"),
    quiz("familiar-things-shoes", 25, "小朋友脚上穿的是什么？", ["鞋子", "手套", "帽子"], "鞋子"),
    action("familiar-things-find-one", 34, "看看身边，找出一个认识的物品，指着它说出名字。"),
  ]),
  videoConfig("理解方位词", "理解方位词_小班_进阶_识字.mp4", 23.08, [
    quiz("position-above", 6, "球举在小朋友头的哪里？", ["上面", "下面", "里面"], "上面"),
    quiz("position-inside", 13, "球放进箱子后，球在哪里？", ["里面", "上面", "旁边"], "里面"),
    action("position-move", 21, "把手举到头顶说‘上面’，再把手放到膝盖下面说‘下面’。"),
  ]),
  videoConfig("二三步指令", "二三步指令_小班_进阶_数学.mp4", 17.16, [
    action("instructions-clap-head", 6, "听口令：先拍两下手，再摸摸头。"),
    quiz("instructions-first-step", 14, "如果口令是‘先拿杯子，再喝水’，第一步做什么？", ["拿杯子", "喝水", "放下杯子"], "拿杯子"),
  ]),
  videoConfig("说出朋友名字", "说出朋友名字_小班_初级_英语.mp4", 8.33, [
    action("friend-say-name", 4, "大声说出一个朋友的名字。"),
    quiz("friend-count", 7, "画面最后出现了几个小朋友？", ["1", "2", "3"], "2"),
  ]),
  videoConfig("两三句对话", "两三句对话_小班_进阶_英语.mp4", 10.61, [
    action("conversation-greeting", 4, "跟屏幕里的小朋友说：‘你好！你在玩什么？我也想一起玩。’"),
    quiz("conversation-listen", 9, "别人说话时，我们应该怎么做？", ["认真听", "大声打断", "转身离开"], "认真听"),
  ]),
  videoConfig("认识颜色", "认识颜色_中班_初级_识字.mp4", 8.22, [
    quiz("colors-green-block", 4, "小朋友手指着的积木是什么颜色？", ["绿色", "黄色", "蓝色"], "绿色"),
    action("colors-point-blue", 7, "指出一块蓝色积木，并说‘蓝色’。"),
  ]),
  videoConfig("抄写大写字母", "抄写大写字母_中班_进阶_识字.mp4", 6.84, [
    quiz("capital-letter-s", 3, "小朋友正在写哪个大写字母？", ["S", "O", "A"], "S"),
    action("capital-letter-air-write", 6, "伸出手指，在空中写一个大写 S。"),
  ]),
  videoConfig("认识数字", "认识数字_中班_初级_数学.mp4", 7.95, [
    quiz("numbers-point-five", 3, "大人的手指正指着哪个数字？", ["3", "4", "5"], "5"),
    action("numbers-read-cards", 6, "找出并读出卡片上的 1、3、4、5。"),
  ]),
  videoConfig("理解计数", "理解计数_中班_进阶_数学.mp4", 13.52, [
    quiz("counting-four-cats", 8, "卡片上有几只猫？", ["3", "4", "5"], "4"),
    action("counting-bears-cats", 12, "先数三只小熊，再数四只猫；每数一个就指一下。"),
  ]),
  videoConfig("背诵儿歌诗歌", "背诵儿歌诗歌_中班_初级_英语.mp4", 14.89, [
    action("song-clap-follow", 5, "跟着节奏拍手四下，再试着跟唱一句。"),
    quiz("song-memory-method", 12, "想记住一首儿歌，哪种做法最好？", ["一句一句跟读", "只看一次", "随便说"], "一句一句跟读"),
  ]),
  videoConfig("理解故事片段", "理解故事片段_中班_进阶_英语.mp4", 17.47, [
    tip("story-memory-tip", 7, "记故事可以记住：谁、在哪里、做了什么。"),
    quiz("story-complete-sentence", 13, "哪一句话说得最完整？", ["小朋友在教室里讲故事", "小朋友", "故事"], "小朋友在教室里讲故事"),
    action("story-describe-clip", 16, "用一句完整的话，说说刚才看到的故事片段。"),
  ]),
  videoConfig("书写字母数字", "书写字母数字_大班_初级_识字.mp4", 11.14, [
    quiz("writing-own-name", 3, "小朋友正在用笔做什么？", ["写自己的名字", "数积木", "剪纸"], "写自己的名字"),
    action("writing-first-character", 8, "伸出手指，在空中写自己名字的第一个字。"),
  ]),
  videoConfig("完整句讲故事", "完整句讲故事_大班_进阶_识字.mp4", 25.75, [
    tip("full-sentence-tip", 8, "完整句子要说清楚‘谁’和‘做什么’。"),
    quiz("full-sentence-choice", 17, "哪一句是完整句？", ["小女孩在讲一个故事", "小女孩", "一个故事"], "小女孩在讲一个故事"),
    action("full-sentence-today", 23, "用一句完整的话，说说今天做过的一件事。"),
  ]),
  videoConfig("数到十个以上", "数到十个以上_大班_初级_数学.mp4", 8.27, [
    quiz("count-ten-method", 4, "数一排物品时，怎样最不容易漏掉？", ["指一个数一个", "随便猜", "跳着数"], "指一个数一个"),
    action("count-one-to-ten", 7, "跟着小朋友，从 1 数到 10。"),
  ]),
  videoConfig("十秒平衡计时", "十秒平衡计时_大班_进阶_数学.mp4", 11.3, [
    quiz("balance-one-foot", 3, "小朋友用几只脚站立？", ["1", "2", "0"], "1"),
    action("balance-ten-seconds", 7, "确认周围安全，必要时扶住桌边；张开双臂，尝试单脚站立 10 秒。", 10),
  ]),
  videoConfig("清楚表达", "清楚表达_大班_初级_英语.mp4", 7.68, [
    quiz("clear-speaking-method", 3, "怎样说话更容易让别人听清？", ["面向对方慢慢说", "捂住嘴", "越快越好"], "面向对方慢慢说"),
    action("clear-speaking-name", 6, "清楚地说：My name is ___。"),
  ]),
  videoConfig("使用将来时", "使用将来时_大班_进阶_英语.mp4", 7.68, [
    quiz("future-tense-choice", 3, "哪句话表示将来要做的事？", ["I will play.", "I played.", "I am playing."], "I will play."),
    action("future-tense-tomorrow", 6, "用 I will… 说一件明天想做的事。"),
  ]),
  videoConfig("数字 1 到 20", "数字 1 到 20_大班_初级_数学.mp4", 593.83, [
    quiz("numbers-1-20-after-3", 35, "数字 3 后面是几？", ["2", "4", "5"], "4"),
    action("numbers-1-20-count-10", 95, "跟着画面从 1 数到 10。"),
    quiz("numbers-1-20-after-14", 155, "数字 14 后面是几？", ["13", "15", "16"], "15"),
    quiz("numbers-1-20-after-17", 225, "数字 17 后面是几？", ["16", "18", "19"], "18"),
    action("numbers-1-20-recall", 270, "不看提示，试着从 1 数到 20。"),
    quiz("numbers-1-20-seven-holes", 315, "紫色方片上一共有几个小孔？", ["6", "7", "8"], "7"),
    quiz("numbers-1-20-screen-ten", 390, "画面中的数字是多少？", ["8", "9", "10"], "10"),
    quiz("numbers-1-20-cookie-ten", 430, "这块饼干上有几颗巧克力豆？", ["8", "9", "10"], "10"),
    action("numbers-1-20-zero-to-ten", 560, "把 0、1、2……10 按顺序读一遍。"),
  ]),
  videoConfig("认识七种颜色", "认识七种颜色_小班_进阶_识字.mp4", 118.89, [
    quiz("seven-colors-red", 24, "红色的英文是什么？", ["RED", "BLUE", "GREEN"], "RED"),
    action("seven-colors-orange", 38, "指出橙色球，说‘橙色，orange’。"),
    quiz("seven-colors-blue", 52, "蓝色的英文是什么？", ["BLUE", "PINK", "YELLOW"], "BLUE"),
    action("seven-colors-purple", 68, "找一件紫色物品，说‘purple’。"),
    quiz("seven-colors-pink", 82, "粉色的英文是什么？", ["PINK", "RED", "GREEN"], "PINK"),
    action("seven-colors-yellow", 96, "跟读：黄色，yellow。"),
    quiz("seven-colors-green", 110, "绿色的英文是什么？", ["GREEN", "ORANGE", "PURPLE"], "GREEN"),
  ]),
  videoConfig("自然拼读 A、M、N、Q、R", "自然拼读 A、M、N、Q、R_大班_初级_英语.mp4", 445.27, [
    quiz("phonics-amnqr-apple", 45, "apple 的第一个字母是什么？", ["A", "M", "N"], "A"),
    action("phonics-amnqr-a-sound", 70, "跟读 A、/æ/、apple。"),
    quiz("phonics-amnqr-letter-m", 222, "画面正在学习哪个字母？", ["M", "N", "Q"], "M"),
    action("phonics-amnqr-write-m", 270, "在空中写一个大写 M。"),
    quiz("phonics-amnqr-after-m", 300, "M 后面的字母是什么？", ["L", "N", "Q"], "N"),
    action("phonics-amnqr-write-n", 330, "在空中写一个大写 N。"),
    quiz("phonics-amnqr-uppercase-q", 363, "哪个是大写 Q？", ["Q", "q", "P"], "Q"),
    quiz("phonics-amnqr-uppercase-r", 393, "哪个是大写 R？", ["R", "P", "B"], "R"),
    action("phonics-amnqr-read-all", 405, "依次读出 A、M、N、Q、R。"),
  ]),
  videoConfig("认识长颈鹿", "认识长颈鹿_中班_进阶_自然认知.mp4", 155.69, [
    quiz("giraffe-tallest", 27, "世界上最高的动物是什么？", ["长颈鹿", "小兔子", "企鹅"], "长颈鹿"),
    quiz("giraffe-africa", 36, "视频里的长颈鹿生活在哪个地方？", ["非洲", "南极", "海底"], "非洲"),
    action("giraffe-reach-leaves", 57, "伸长手臂，模仿长颈鹿够高处的树叶。"),
    quiz("giraffe-food", 87, "长颈鹿主要吃什么？", ["树叶和嫩芽", "鱼", "肉"], "树叶和嫩芽"),
    quiz("giraffe-water", 96, "长颈鹿需要经常喝很多水吗？", ["不需要", "需要", "只喝海水"], "不需要"),
    quiz("giraffe-spots", 114, "每只长颈鹿的斑点都完全一样吗？", ["不一样", "完全一样", "没有斑点"], "不一样"),
    action("giraffe-introduce", 132, "用一句完整的话介绍长颈鹿，例如‘长颈鹿有长脖子，喜欢吃树叶。’"),
  ]),
  videoConfig("声母歌", "声母歌_大班_初级_识字.mp4", 175.4, [
    quiz("initials-song-b", 45, "‘广播广播 b b b’对应哪个声母？", ["b", "p", "m"], "b"),
    action("initials-song-dtnl", 63, "跟着节奏读：d、t、n、l。"),
    quiz("initials-song-h", 72, "‘喝水喝水 h h h’对应哪个声母？", ["g", "k", "h"], "h"),
    action("initials-song-gkhjqx", 87, "跟着节奏读：g、k、h、j、q、x。"),
    quiz("initials-song-sh", 96, "‘狮子狮子 sh sh sh’对应哪个声母？", ["sh", "ch", "r"], "sh"),
    action("initials-song-zcs", 108, "跟读：z、c、s。"),
    quiz("initials-song-w", 120, "‘乌鸦乌鸦 w w w’对应哪个声母？", ["w", "y", "r"], "w"),
    action("initials-song-all", 147, "跟着歌曲完整读一遍 23 个声母。"),
  ]),
];

export function validateInteractiveVideoConfigs(configs = interactiveVideoConfigs) {
  const configKeys = new Set();
  const interactionIds = new Set();

  configs.forEach((config) => {
    const { title, video_filename: videoFilename } = config.match || {};
    if (!title || !videoFilename) throw new Error("互动视频配置缺少标题或文件名");
    if (!Number.isFinite(config.expectedDuration) || config.expectedDuration <= 0) {
      throw new Error(`${title} 缺少有效的预期视频时长`);
    }

    const configKey = `${title}|${videoFilename}`;
    if (configKeys.has(configKey)) throw new Error(`${title} 存在重复配置`);
    configKeys.add(configKey);

    let previousTime = -1;
    config.interactions.forEach((interaction) => {
      if (interactionIds.has(interaction.id)) throw new Error(`互动 ID 重复：${interaction.id}`);
      interactionIds.add(interaction.id);

      if (!Number.isFinite(interaction.time) || interaction.time <= previousTime) {
        throw new Error(`${title} 的互动秒点必须严格升序`);
      }
      if (interaction.time >= config.expectedDuration) {
        throw new Error(`${title} 的互动 ${interaction.id} 不得晚于视频结尾`);
      }
      if (!["tip", "quiz", "action"].includes(interaction.type)) {
        throw new Error(`${title} 的互动 ${interaction.id} 类型无效`);
      }
      if (interaction.type === "quiz" && !interaction.options.includes(interaction.correctAnswer)) {
        throw new Error(`${title} 的互动 ${interaction.id} 答案不在选项中`);
      }
      if (interaction.type === "action" && interaction.countdownSeconds !== undefined) {
        if (!Number.isInteger(interaction.countdownSeconds) || interaction.countdownSeconds <= 0) {
          throw new Error(`${title} 的互动 ${interaction.id} 倒计时无效`);
        }
      }

      previousTime = interaction.time;
    });
  });

  return true;
}

validateInteractiveVideoConfigs();

export function getInteractiveVideoConfig(video) {
  if (!video) return null;

  return (
    interactiveVideoConfigs.find((config) => video.video_filename === config.match.video_filename) ||
    interactiveVideoConfigs.find((config) => video.title === config.match.title) ||
    null
  );
}
