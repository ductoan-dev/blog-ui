import { useCallback, useRef } from "react";

const VISIBLE_RATIO = 0.6;

// Videos paused by this hook (scroll away / another video started),
// so their "pause" event isn't mistaken for the user pressing pause
const autoPaused = new WeakSet();
let activeVideo = null;

const autoPause = (video) => {
  if (!video || video.paused) return;
  autoPaused.add(video);
  video.pause();
};

const setupAutoPlay = (video) => {
  let pausedByUser = false;

  const handlePlay = () => {
    pausedByUser = false;
    if (activeVideo && activeVideo !== video) autoPause(activeVideo);
    activeVideo = video;
  };

  const handlePause = () => {
    if (autoPaused.has(video)) {
      autoPaused.delete(video);
    } else if (!video.ended) {
      pausedByUser = true;
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (pausedByUser || !video.paused) return;
        // Browsers only allow autoplay without sound
        video.muted = true;
        video.play().catch(() => {});
      } else {
        autoPause(video);
      }
    },
    { threshold: VISIBLE_RATIO }
  );

  video.addEventListener("play", handlePlay);
  video.addEventListener("pause", handlePause);
  observer.observe(video);

  return () => {
    observer.disconnect();
    video.removeEventListener("play", handlePlay);
    video.removeEventListener("pause", handlePause);
    if (activeVideo === video) activeVideo = null;
  };
};

/**
 * Callback ref for a <video>: plays it (muted) when it scrolls into view and
 * pauses it when it leaves. Once the user presses pause, it stays paused
 * until they press play again. Only one video plays at a time.
 */
const useAutoPlayVideo = () => {
  const cleanupRef = useRef(null);

  return useCallback((video) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (video && !reducedMotion) {
      cleanupRef.current = setupAutoPlay(video);
    }
  }, []);
};

export default useAutoPlayVideo;
