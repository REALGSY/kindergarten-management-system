import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { getInteractiveVideoConfig } from "./interactiveVideoConfig";

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}

function getRequestFullscreen(element) {
  return element?.requestFullscreen || element?.webkitRequestFullscreen || element?.msRequestFullscreen;
}

function getExitFullscreen() {
  return document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
}

function canFullscreenElement(element) {
  return Boolean(getRequestFullscreen(element));
}

function playVideo(videoElement) {
  if (!videoElement?.play) return;

  try {
    const result = videoElement.play();
    if (result?.catch) result.catch(() => {});
  } catch {
    // Some browsers block programmatic playback; the child can press play again.
  }
}

function pauseVideo(videoElement) {
  if (!videoElement?.pause) return;

  try {
    videoElement.pause();
  } catch {
    // JSDOM and a few browser states can throw here; the overlay can still render.
  }
}

export default function InteractiveVideoPlayer({ video }) {
  const config = getInteractiveVideoConfig(video);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const triggeredInteractionIdsRef = useRef(new Set());
  const lastPlaybackTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const tipTimerRef = useRef(null);
  const continueTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [countdownRemaining, setCountdownRemaining] = useState(null);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clearTransientTimers = useCallback(() => {
    window.clearTimeout(tipTimerRef.current);
    window.clearTimeout(continueTimerRef.current);
    window.clearInterval(countdownTimerRef.current);
  }, []);

  const clearInteractionState = useCallback(() => {
    setActiveInteraction(null);
    setSelectedAnswer("");
    setFeedback("");
    setCountdownRemaining(null);
    setCountdownStarted(false);
  }, []);

  const openInteraction = useCallback(
    (interaction) => {
      clearTransientTimers();
      setActiveInteraction(interaction);
      setSelectedAnswer("");
      setFeedback("");
      setCountdownRemaining(interaction.countdownSeconds || null);
      setCountdownStarted(false);

      if (interaction.type === "tip") {
        tipTimerRef.current = window.setTimeout(() => {
          setActiveInteraction((current) => (current?.id === interaction.id ? null : current));
        }, interaction.durationMs || 2500);
        return;
      }

      pauseVideo(videoRef.current);
    },
    [clearTransientTimers]
  );

  const triggerDueInteraction = useCallback(
    (currentTime) => {
      if (!config || isSeekingRef.current) return;

      const previousTime = lastPlaybackTimeRef.current;
      lastPlaybackTimeRef.current = currentTime;
      if (currentTime < previousTime) return;

      const nextInteraction = config.interactions.find(
        (interaction) =>
          interaction.time > previousTime &&
          interaction.time <= currentTime &&
          !triggeredInteractionIdsRef.current.has(interaction.id)
      );

      if (!nextInteraction) return;

      triggeredInteractionIdsRef.current.add(nextInteraction.id);
      openInteraction(nextInteraction);
    },
    [config, openInteraction]
  );

  useEffect(() => {
    clearTransientTimers();
    triggeredInteractionIdsRef.current = new Set();
    lastPlaybackTimeRef.current = 0;
    isSeekingRef.current = false;
    clearInteractionState();

    return clearTransientTimers;
  }, [clearInteractionState, clearTransientTimers, video?.video_url, video?.video_filename]);

  useEffect(() => {
    const containerElement = containerRef.current;
    setFullscreenSupported(canFullscreenElement(containerElement));

    function handleFullscreenChange() {
      setIsFullscreen(getFullscreenElement() === containerElement);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  function handleTimeUpdate(event) {
    triggerDueInteraction(event.currentTarget.currentTime);
  }

  function handleSeeking() {
    isSeekingRef.current = true;
  }

  function handleSeeked(event) {
    const currentTime = event.currentTarget.currentTime;
    if (config) {
      const skippedIds = config.interactions
        .filter((interaction) => interaction.time <= currentTime)
        .map((interaction) => interaction.id);
      triggeredInteractionIdsRef.current = new Set([
        ...triggeredInteractionIdsRef.current,
        ...skippedIds,
      ]);
    }
    clearTransientTimers();
    clearInteractionState();
    lastPlaybackTimeRef.current = currentTime;
    isSeekingRef.current = false;
  }

  function resetInteractionsIfReplaying(event) {
    if (event.currentTarget.currentTime > 0.25) return;

    clearTransientTimers();
    triggeredInteractionIdsRef.current = new Set();
    lastPlaybackTimeRef.current = 0;
    isSeekingRef.current = false;
    clearInteractionState();
  }

  function resetInteractions() {
    clearTransientTimers();
    triggeredInteractionIdsRef.current = new Set();
    lastPlaybackTimeRef.current = 0;
    isSeekingRef.current = false;
    clearInteractionState();
  }

  function chooseAnswer(answer) {
    if (!activeInteraction || activeInteraction.type !== "quiz") return;

    setSelectedAnswer(answer);
    const isCorrect = answer === activeInteraction.correctAnswer;
    setFeedback(isCorrect ? activeInteraction.correctFeedback : activeInteraction.incorrectFeedback);

    if (!isCorrect) return;

    continueTimerRef.current = window.setTimeout(() => {
      clearInteractionState();
      playVideo(videoRef.current);
    }, 900);
  }

  function completeAction() {
    if (!activeInteraction || activeInteraction.type !== "action") return;

    clearTransientTimers();
    clearInteractionState();
    playVideo(videoRef.current);
  }

  function startCountdown() {
    if (!activeInteraction?.countdownSeconds || countdownStarted) return;

    setCountdownStarted(true);
    setCountdownRemaining(activeInteraction.countdownSeconds);
    countdownTimerRef.current = window.setInterval(() => {
      setCountdownRemaining((remaining) => {
        if (remaining > 1) return remaining - 1;

        window.clearInterval(countdownTimerRef.current);
        continueTimerRef.current = window.setTimeout(() => {
          clearInteractionState();
          playVideo(videoRef.current);
        }, 600);
        return 0;
      });
    }, 1000);
  }

  async function toggleFullscreen() {
    const containerElement = containerRef.current;
    if (!containerElement || !fullscreenSupported) return;

    try {
      if (getFullscreenElement() === containerElement) {
        const exitFullscreen = getExitFullscreen();
        if (exitFullscreen) await exitFullscreen.call(document);
        return;
      }

      const requestFullscreen = getRequestFullscreen(containerElement);
      if (requestFullscreen) await requestFullscreen.call(containerElement);
    } catch {
      // If the browser refuses fullscreen, normal inline playback still works.
    }
  }

  const isQuiz = activeInteraction?.type === "quiz";
  const isAction = activeInteraction?.type === "action";

  if (!config) {
    return (
      <video
        aria-label={`${video.title || "早教视频"} 播放器`}
        className="aspect-video w-full rounded bg-black"
        controls
        preload="metadata"
        src={video.video_url}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`interactive-video-player ${
        fullscreenSupported ? "interactive-video-player--container-fullscreen" : ""
      } relative overflow-hidden rounded bg-black`}>
      <style>{`
        .interactive-video-player--container-fullscreen video::-webkit-media-controls-fullscreen-button {
          display: none;
        }

        .interactive-video-player--container-fullscreen:fullscreen,
        .interactive-video-player--container-fullscreen:-webkit-full-screen {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .interactive-video-player--container-fullscreen:fullscreen video,
        .interactive-video-player--container-fullscreen:-webkit-full-screen video {
          width: 100%;
          height: 100%;
          max-height: 100vh;
          object-fit: contain;
          aspect-ratio: auto;
        }

        .interactive-video-player--container-fullscreen:fullscreen .interactive-video-overlay,
        .interactive-video-player--container-fullscreen:-webkit-full-screen .interactive-video-overlay {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
      <video
        ref={videoRef}
        aria-label={`${video.title || "互动早教视频"} 互动播放器`}
        className="aspect-video w-full bg-black"
        controlsList={fullscreenSupported ? "nofullscreen" : undefined}
        controls
        preload="metadata"
        playsInline
        src={video.video_url}
        onEnded={resetInteractions}
        onPlay={resetInteractionsIfReplaying}
        onSeeked={handleSeeked}
        onSeeking={handleSeeking}
        onTimeUpdate={handleTimeUpdate}
      />
      {fullscreenSupported ? (
        <button
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/60 text-white shadow-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white/80"
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "退出全屏" : "全屏播放"}
          aria-pressed={isFullscreen}
          title={isFullscreen ? "退出全屏" : "全屏播放"}>
          {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
        </button>
      ) : null}
      {activeInteraction ? (
        <div className="interactive-video-overlay absolute inset-x-0 bottom-0 bg-black/75 p-3 text-white sm:p-4">
          <div className="mx-auto max-w-xl">
            {activeInteraction.title ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-100">
                {activeInteraction.title}
              </p>
            ) : null}
            <p className="text-base font-semibold leading-snug sm:text-lg">
              {isQuiz
                ? activeInteraction.question
                : isAction
                ? activeInteraction.prompt
                : activeInteraction.message}
            </p>
            {isQuiz ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {activeInteraction.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  return (
                    <button
                      key={option}
                      className={`min-h-[44px] rounded-md border px-3 py-2 text-base font-semibold transition sm:text-lg ${
                        isSelected
                          ? "border-white bg-white text-[#B124A3]"
                          : "border-white/60 bg-white/10 text-white hover:bg-white/20"
                      }`}
                      type="button"
                      onClick={() => chooseAnswer(option)}>
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {isAction && !activeInteraction.countdownSeconds ? (
              <button
                className="mt-3 min-h-[44px] rounded-md bg-white px-5 py-2 font-semibold text-[#B124A3] transition hover:bg-pink-50"
                type="button"
                onClick={completeAction}>
                我完成了，继续
              </button>
            ) : null}
            {isAction && activeInteraction.countdownSeconds ? (
              <div className="mt-3">
                {!countdownStarted ? (
                  <button
                    className="min-h-[44px] rounded-md bg-white px-5 py-2 font-semibold text-[#B124A3] transition hover:bg-pink-50"
                    type="button"
                    onClick={startCountdown}>
                    开始 {activeInteraction.countdownSeconds} 秒计时
                  </button>
                ) : (
                  <p className="rounded-md bg-white/95 px-4 py-3 text-center text-xl font-bold text-[#B124A3]" aria-live="polite">
                    {countdownRemaining > 0 ? `还剩 ${countdownRemaining} 秒` : "挑战完成！"}
                  </p>
                )}
              </div>
            ) : null}
            {feedback ? (
              <p
                className={`mt-3 rounded bg-white/95 px-3 py-2 text-sm font-medium ${
                  selectedAnswer === activeInteraction.correctAnswer ? "text-emerald-700" : "text-pink-700"
                }`}
                aria-live="polite">
                {feedback}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
