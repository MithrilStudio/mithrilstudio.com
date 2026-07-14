(() => {
  const video = document.getElementById("notFoundVideo") as HTMLVideoElement | null;
  if (!video) {
    return;
  }

  const configureVideo = (item: HTMLVideoElement) => {
    item.autoplay = true;
    item.defaultMuted = true;
    item.muted = true;
    item.loop = true;
    item.playsInline = true;
    item.preload = "auto";
    item.disablePictureInPicture = true;
    item.disableRemotePlayback = true;
    item.draggable = false;
    item.setAttribute("playsinline", "");
    item.setAttribute("webkit-playsinline", "");
    item.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
    item.setAttribute("disablepictureinpicture", "");
    item.setAttribute("disableremoteplayback", "");
    item.setAttribute("aria-hidden", "true");
  };

  const playVideo = (item: HTMLVideoElement) => {
    configureVideo(item);
    const playPromise = item.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  };

  video.addEventListener("playing", () => {
    video.classList.add("is-ready");
    video.removeAttribute("poster");
  });

  playVideo(video);
  ["pointerdown", "click", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, () => playVideo(video), { passive: true });
  });
})();
