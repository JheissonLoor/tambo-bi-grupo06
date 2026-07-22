import { useEffect, useState } from "react";

const cubicOut = (progress: number) => 1 - Math.pow(1 - progress, 3);

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function useAnimatedProgress(key: unknown, duration = 950) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }

    let frame = 0;
    let start = 0;
    let finished = false;
    setProgress(0);

    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const raw = Math.min((timestamp - start) / duration, 1);
      setProgress(cubicOut(raw));
      if (raw < 1) frame = window.requestAnimationFrame(tick);
      else finished = true;
    };

    frame = window.requestAnimationFrame(tick);
    const fallback = window.setTimeout(() => {
      if (!finished) setProgress(1);
    }, duration + 140);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, [duration, key, reduced]);

  return progress;
}

export function useAnimatedNumber(value: number | null | undefined, duration = 950) {
  const progress = useAnimatedProgress(value, duration);
  return value == null ? null : value * progress;
}
