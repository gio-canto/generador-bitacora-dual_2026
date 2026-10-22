import { useEffect, useRef, useState } from "react";

/** Keep units, thousands separators and the accessible final value intact. */
export function numberParts(value) {
  const text = String(value ?? "");
  const match = text.match(/^(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const numeric = Number(match[1].replaceAll(",", ""));
  if (!Number.isFinite(numeric)) return null;
  return {
    numeric,
    decimals: (match[1].split(".")[1] || "").length,
    suffix: match[2],
  };
}

export function numberAtProgress(value, progress) {
  const parsed = numberParts(value);
  if (!parsed) return String(value ?? "");
  const clamped = Math.min(1, Math.max(0, progress));
  const interpolated = parsed.numeric * (1 - Math.pow(1 - clamped, 4));
  return interpolated.toLocaleString("es-MX", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  }) + parsed.suffix;
}

export default function AnimatedValue({ value, duration = 850 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(String(value ?? ""));
  useEffect(() => {
    const full = String(value ?? "");
    const el = ref.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!el || !numberParts(full) || reduce ||
        typeof IntersectionObserver === "undefined" ||
        typeof requestAnimationFrame !== "function") {
      setShown(full);
      return;
    }

    let frame = null;
    let cancelled = false;
    let started = false;
    setShown(numberAtProgress(full, 0));
    const start = () => {
      if (started || cancelled) return;
      started = true;
      const beginning = performance.now();
      const tick = now => {
        if (cancelled) return;
        const progress = Math.min(1, Math.max(0, (now - beginning) / duration));
        setShown(progress >= 1 ? full : numberAtProgress(full, progress));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        start();
        observer.disconnect();
      }
    }, { threshold: 0.06 });
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref} className="ds-animated-number" aria-label={String(value ?? "")}
    aria-live="off">{shown}</span>;
}
