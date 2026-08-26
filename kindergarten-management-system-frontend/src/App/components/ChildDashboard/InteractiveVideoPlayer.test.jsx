import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import InteractiveVideoPlayer from "./InteractiveVideoPlayer";

const ordinaryActionVideo = {
  title: "说出朋友名字",
  video_filename: "说出朋友名字_小班_初级_英语.mp4",
  video_url: "/friend.mp4",
};

const timedActionVideo = {
  title: "十秒平衡计时",
  video_filename: "十秒平衡计时_大班_进阶_数学.mp4",
  video_url: "/balance.mp4",
};

const existingInteractiveVideo = {
  title: "理解数字二",
  video_filename: "理解数字二_小班_初级_数学.mp4",
  video_url: "/two.mp4",
};

function setMediaTime(video, currentTime) {
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    value: currentTime,
  });
}

function movePlaybackTo(video, currentTime) {
  setMediaTime(video, currentTime);
  fireEvent.timeUpdate(video);
}

function seekTo(video, currentTime) {
  fireEvent.seeking(video);
  setMediaTime(video, currentTime);
  fireEvent.seeked(video);
}

let pauseMock;
let playMock;

beforeEach(() => {
  pauseMock = jest.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  playMock = jest.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  pauseMock.mockRestore();
  playMock.mockRestore();
  jest.useRealTimers();
});

test("pauses for a normal action and resumes after child confirmation", () => {
  render(<InteractiveVideoPlayer video={ordinaryActionVideo} />);
  const video = screen.getByLabelText(/说出朋友名字 互动播放器/u);

  movePlaybackTo(video, 4);

  expect(screen.getByText("大声说出一个朋友的名字。")).toBeInTheDocument();
  expect(pauseMock).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "我完成了，继续" }));
  expect(playMock).toHaveBeenCalled();
  expect(screen.queryByText("大声说出一个朋友的名字。")).not.toBeInTheDocument();
});

test("runs the ten-second action countdown and then resumes automatically", () => {
  jest.useFakeTimers();
  render(<InteractiveVideoPlayer video={timedActionVideo} />);
  const video = screen.getByLabelText(/十秒平衡计时 互动播放器/u);

  seekTo(video, 3.5);
  movePlaybackTo(video, 7);

  expect(screen.getByText(/尝试单脚站立 10 秒/u)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "开始 10 秒计时" }));
  expect(screen.getByText("还剩 10 秒")).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(screen.getByText("挑战完成！")).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(600);
  });
  expect(playMock).toHaveBeenCalled();
  expect(screen.queryByText(/尝试单脚站立 10 秒/u)).not.toBeInTheDocument();
});

test("does not backfill skipped interactions and resets them when replaying from the start", () => {
  render(<InteractiveVideoPlayer video={existingInteractiveVideo} />);
  const video = screen.getByLabelText(/理解数字二 互动播放器/u);

  seekTo(video, 8.5);
  movePlaybackTo(video, 8.6);
  expect(screen.queryByText("小提示")).not.toBeInTheDocument();
  expect(screen.queryByText("盘子里要找几个小饼干？")).not.toBeInTheDocument();

  seekTo(video, 0);
  fireEvent.play(video);
  movePlaybackTo(video, 5);
  expect(screen.getByText("小提示")).toBeInTheDocument();
});
