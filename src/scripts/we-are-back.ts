declare global {
  interface Window {
    mithrilIntroScrollStartTimeMs: number | null;
    startMithrilBackgroundVideo?: () => void;
  }
}

const revealTrigger = document.getElementById("revealTrigger") as HTMLButtonElement;

const introStage = document.querySelector<HTMLElement>(".intro-stage");
const introTrack = document.getElementById("introTrack") as HTMLElement;
const finalContent = document.querySelector<HTMLElement>(".final-content") as HTMLElement;
const finalLinks = document.querySelectorAll<HTMLAnchorElement>(".hero-links a");
const heroBackground = document.getElementById("heroBackground") as HTMLElement;
const BACKGROUND_RESTORE_DURATION_MS = 600;
const INTRO_FINALE_HOLD_MS = 1600;
const INTRO_FALLBACK_MS = 100000;
const BACKGROUND_PLAY_RETRY_DELAYS_MS = [0, 300, 1200];
const BACKGROUND_PAUSE_RESUME_DELAYS_MS = [80, 300, 1200];
const INTRO_FAST_FORWARD_RATE = 9;
window.mithrilIntroScrollStartTimeMs = null;
let introFallbackTimer: number | null = null;
let introLaunchRequested = false;
let introFastForwardPointerId: number | null = null;
let introFastForwardKey: string | null = null;

finalLinks.forEach((link) => {
  link.tabIndex = -1;
});

const revealFinalContent = () => {
  if (document.body.classList.contains("is-final-visible")) {
    return;
  }

  startCurrentBackgroundVideo();
  document.body.classList.add("is-final-visible");
  finalContent.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    document.body.classList.add("is-final-slogan-visible");
  }, 600);
  window.setTimeout(() => {
    document.body.classList.add("is-final-links-visible");
    finalLinks.forEach((link) => {
      link.removeAttribute("tabindex");
    });
    startCurrentBackgroundVideo();
  }, 1200);
};

const syncIntroFinalePosition = () => {
  const introViewport = document.querySelector<HTMLElement>(".intro-viewport");
  const introFinale = document.querySelector<HTMLElement>(".intro-finale");

  if (!introViewport || !introFinale) {
    return;
  }

  const finaleCenter = introFinale.offsetTop + introFinale.offsetHeight / 2;
  const targetY = introViewport.clientHeight / 2 - finaleCenter;
  introTrack.style.setProperty("--intro-hold-translate", `${targetY}px`);
};

const startBackgroundRestoration = () => {
  if (document.body.classList.contains("is-intro-finished")) {
    return;
  }

  document.body.classList.add("is-intro-finished");
  startCurrentBackgroundVideo();
  requestAnimationFrame(() => {
    document.body.classList.add("is-background-restoring");
    startCurrentBackgroundVideo();
  });
  window.setTimeout(revealFinalContent, BACKGROUND_RESTORE_DURATION_MS + 160);
};

const startIntroFinaleHold = () => {
  if (document.body.classList.contains("is-intro-holding")) {
    return;
  }

  if (introFallbackTimer) {
    window.clearTimeout(introFallbackTimer);
    introFallbackTimer = null;
  }

  clearIntroFastForwardState();
  document.body.classList.add("is-intro-holding");
  window.setTimeout(startBackgroundRestoration, INTRO_FINALE_HOLD_MS);
};

const startIntroSequence = () => {
  if (document.body.classList.contains("is-intro-ready")) {
    return;
  }

  syncIntroFinalePosition();
  document.body.classList.add("is-intro-ready");
  window.setTimeout(registerIntroScrollStart, 800);
  introFallbackTimer = window.setTimeout(startIntroFinaleHold, INTRO_FALLBACK_MS);
};
void startIntroSequence;

const registerIntroScrollStart = () => {
  if (typeof window.mithrilIntroScrollStartTimeMs === "number") {
    return;
  }

  window.mithrilIntroScrollStartTimeMs = performance.now();
};

const isIntroScrollActive = () => {
  return (
    document.body.classList.contains("is-intro-ready") &&
    !document.body.classList.contains("is-intro-holding") &&
    !document.body.classList.contains("is-intro-finished")
  );
};

const getIntroScrollAnimation = () => {
  if (typeof introTrack.getAnimations !== "function") {
    return null;
  }

  const animations = introTrack.getAnimations();
  return (
    animations.find((animation) => (animation as CSSAnimation).animationName === "introScroll") || animations[0] || null
  );
};

const setIntroScrollPlaybackRate = (rate: number) => {
  const animation = getIntroScrollAnimation();

  if (!animation) {
    return;
  }

  if (typeof animation.updatePlaybackRate === "function") {
    animation.updatePlaybackRate(rate);
    return;
  }

  animation.playbackRate = rate;
};

const syncIntroFastForwardState = () => {
  const shouldFastForward =
    isIntroScrollActive() && (introFastForwardPointerId !== null || introFastForwardKey !== null);
  setIntroScrollPlaybackRate(shouldFastForward ? INTRO_FAST_FORWARD_RATE : 1);
};

const clearIntroFastForwardState = () => {
  introFastForwardPointerId = null;
  introFastForwardKey = null;
  syncIntroFastForwardState();
};

const startIntroFastForwardPointer = (event: PointerEvent) => {
  if (!isIntroScrollActive() || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  introFastForwardPointerId = event.pointerId;
  const currentTarget = event.currentTarget as HTMLElement | null;
  if (currentTarget?.setPointerCapture) {
    try {
      currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The browser may already have released this pointer.
    }
  }

  if (event.cancelable) {
    event.preventDefault();
  }

  syncIntroFastForwardState();
};

const stopIntroFastForwardPointer = (event: PointerEvent) => {
  if (introFastForwardPointerId !== event.pointerId) {
    return;
  }

  introFastForwardPointerId = null;
  syncIntroFastForwardState();
};

const isIntroFastForwardKey = (event: KeyboardEvent) => {
  return (
    event.code === "Space" ||
    event.key === " " ||
    event.key === "Spacebar" ||
    event.code === "Enter" ||
    event.key === "Enter" ||
    event.code === "ArrowDown" ||
    event.key === "ArrowDown"
  );
};

const startIntroFastForwardKey = (event: KeyboardEvent) => {
  if (!isIntroScrollActive() || !isIntroFastForwardKey(event)) {
    return;
  }

  introFastForwardKey = event.code || event.key;
  if (event.cancelable) {
    event.preventDefault();
  }

  syncIntroFastForwardState();
};

const stopIntroFastForwardKey = (event: KeyboardEvent) => {
  if (!introFastForwardKey || !isIntroFastForwardKey(event)) {
    return;
  }

  introFastForwardKey = null;
  if (event.cancelable) {
    event.preventDefault();
  }

  syncIntroFastForwardState();
};

const preventIntroFastForwardContextMenu = (event: Event) => {
  if (!isIntroScrollActive()) {
    return;
  }

  event.preventDefault();
};

const isBackgroundVideoRecoverable = (video: HTMLVideoElement | null): video is HTMLVideoElement => {
  return Boolean(video && video.isConnected && heroBackground?.contains(video) && !video.ended && !video.error);
};

const resumePausedBackgroundVideo = (video: HTMLVideoElement) => {
  if (!isBackgroundVideoRecoverable(video)) {
    return;
  }

  if (video.paused) {
    playBackgroundVideo(video);
  }

  if (video.dataset.backgroundVideoResumePending === "true") {
    return;
  }

  video.dataset.backgroundVideoResumePending = "true";
  BACKGROUND_PAUSE_RESUME_DELAYS_MS.forEach((delayMs, index) => {
    window.setTimeout(() => {
      if (isBackgroundVideoRecoverable(video) && video.paused) {
        playBackgroundVideo(video);
      }

      if (index === BACKGROUND_PAUSE_RESUME_DELAYS_MS.length - 1) {
        delete video.dataset.backgroundVideoResumePending;
      }
    }, delayMs);
  });
};

const configureBackgroundVideo = (video: HTMLVideoElement | null) => {
  if (!video) {
    return;
  }

  video.classList.add("hero-background-video");
  video.autoplay = true;
  video.defaultMuted = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  video.draggable = false;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
  video.setAttribute("disablepictureinpicture", "");
  video.setAttribute("disableremoteplayback", "");
  video.setAttribute("aria-hidden", "true");
  video.oncontextmenu = (event) => event.preventDefault();
  video.ondragstart = (event) => event.preventDefault();

  if (video.dataset.backgroundVideoConfigured !== "true") {
    video.dataset.backgroundVideoConfigured = "true";
    video.addEventListener("pause", () => {
      resumePausedBackgroundVideo(video);
    });
    video.addEventListener(
      "playing",
      () => {
        video.removeAttribute("poster");
      },
      { once: true },
    );
  }
};

const playBackgroundVideo = async (video: HTMLVideoElement | null | undefined): Promise<boolean> => {
  if (!video) {
    return false;
  }

  configureBackgroundVideo(video);

  const playPromise = video.play();
  if (playPromise) {
    try {
      await playPromise;
      return true;
    } catch {
      return false;
    }
  }

  return true;
};

const isBackgroundVideoPlaying = (video: HTMLVideoElement | null) => {
  return Boolean(video && !video.paused && !video.ended && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
};

const startCurrentBackgroundVideo = () => {
  return playBackgroundVideo(heroBackground?.querySelector<HTMLVideoElement>("video"));
};

const retryCurrentBackgroundVideo = () => {
  BACKGROUND_PLAY_RETRY_DELAYS_MS.forEach((delayMs) => {
    window.setTimeout(startCurrentBackgroundVideo, delayMs);
  });
};

(() => {
  const backgroundVideoSources = {
    high: {
      src: "../static/bg_4k.mp4",
    },
  };
  let activeBackgroundKey = "standard";
  let backgroundUpgradeStarted = false;

  if (!heroBackground) {
    return;
  }

  const syncVideoToActivePlayback = (video: HTMLVideoElement) => {
    const activeVideo = heroBackground.querySelector<HTMLVideoElement>("video");

    if (!activeVideo || activeVideo === video) {
      return false;
    }

    const playbackTime = activeVideo.currentTime;
    const targetDuration = video.duration;

    if (!Number.isFinite(playbackTime) || !Number.isFinite(targetDuration) || targetDuration <= 0) {
      return false;
    }

    const targetTime = playbackTime % targetDuration;

    if (Math.abs(video.currentTime - targetTime) < 0.05) {
      return false;
    }

    try {
      video.currentTime = Math.min(targetTime, Math.max(targetDuration - 0.05, 0));
      return true;
    } catch {
      return false;
    }
  };

  const replaceBackgroundWithVideo = ({ key, src }: { key: string; src: string }) => {
    if (activeBackgroundKey === "high" && key !== "high") {
      return;
    }

    // canPlayType() is only advisory: Windows browsers can sometimes play
    // HEVC through the OS pipeline while returning an empty hvc1 result.
    // Let the real media load decide, then keep bg.mp4 if this source fails.
    const video = document.createElement("video");
    video.className = "hero-background-media hero-background-video";
    configureBackgroundVideo(video);
    video.style.opacity = "0";
    video.poster = "../static/bg.jpg";
    video.src = src;
    heroBackground.append(video);

    let isSettled = false;
    let syncAttempts = 0;
    const settle = () => {
      if (isSettled) {
        return;
      }

      if (key === "high" && syncAttempts < 3 && syncVideoToActivePlayback(video)) {
        syncAttempts += 1;
        video.addEventListener("seeked", settle, { once: true });
        window.setTimeout(settle, 500);
        return;
      }

      isSettled = true;

      const previousVideos = [...heroBackground.querySelectorAll<HTMLVideoElement>("video")].filter(
        (item) => item !== video,
      );
      const previousVideo = previousVideos[0] || null;
      playBackgroundVideo(video).then((didPlay) => {
        if (!didPlay && isBackgroundVideoPlaying(previousVideo)) {
          video.remove();
          return;
        }

        video.style.opacity = "";
        previousVideos.forEach((item) => {
          item.remove();
        });
        activeBackgroundKey = key;
        startCurrentBackgroundVideo();
      });
    };

    video.addEventListener("canplay", settle, { once: true });
    video.addEventListener("loadeddata", settle, { once: true });
    video.addEventListener(
      "error",
      () => {
        if (!isSettled) {
          video.remove();
        }
      },
      { once: true },
    );
    video.load();
  };

  const startBackgroundDownloads = () => {
    if (backgroundUpgradeStarted) {
      return;
    }

    backgroundUpgradeStarted = true;

    replaceBackgroundWithVideo({
      key: "high",
      ...backgroundVideoSources.high,
    });
  };

  window.startMithrilBackgroundVideo = startBackgroundDownloads;
})();

startCurrentBackgroundVideo();
window.startMithrilBackgroundVideo?.();
["pointerdown", "click", "touchstart", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, retryCurrentBackgroundVideo, { passive: true });
});

window.addEventListener("resize", () => {
  if (!document.body.classList.contains("is-intro-ready")) {
    syncIntroFinalePosition();
  }
});
const fontReady = Promise.race([
  document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
  new Promise((resolve) => window.setTimeout(resolve, 1200)),
]);
void fontReady;

const launchFinalContent = () => {
  if (introLaunchRequested) {
    return;
  }

  introLaunchRequested = true;
  document.body.classList.add("is-intro-launching");
  revealTrigger.disabled = true;
  document.body.classList.add("is-intro-finished", "is-background-restoring");
  startCurrentBackgroundVideo();
  requestAnimationFrame(revealFinalContent);
};

revealTrigger.addEventListener("click", launchFinalContent);
if (introStage) {
  introStage.addEventListener("pointerdown", startIntroFastForwardPointer);
  introStage.addEventListener("pointerup", stopIntroFastForwardPointer);
  introStage.addEventListener("pointercancel", stopIntroFastForwardPointer);
  introStage.addEventListener("lostpointercapture", stopIntroFastForwardPointer);
  introStage.addEventListener("contextmenu", preventIntroFastForwardContextMenu);
}
window.addEventListener("keydown", startIntroFastForwardKey);
window.addEventListener("keyup", stopIntroFastForwardKey);
window.addEventListener("blur", clearIntroFastForwardState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearIntroFastForwardState();
  }
});
introTrack.addEventListener(
  "animationstart",
  () => {
    registerIntroScrollStart();
    syncIntroFastForwardState();
  },
  { once: true },
);
introTrack.addEventListener(
  "animationend",
  () => {
    clearIntroFastForwardState();
    startIntroFinaleHold();
  },
  { once: true },
);

export {};
