"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TourStep = {
  /** Value of the `data-tour` attribute on the element to spotlight. */
  target: string;
  title: string;
  body: React.ReactNode;
  placement?: "right" | "left" | "bottom" | "top";
  /** One extra button on the step, such as "Add this question to my text". */
  action?: { label: string; onClick: () => void };
};

type Props = {
  steps: TourStep[];
  label: string;
  /** Called when the tour ends. `completed` is true only if the student reached the last step. */
  onClose: (completed: boolean) => void;
};

type Box = { top: number; left: number; width: number; height: number };

const PAD = 6;
const CARD_WIDTH = 340;

function find(target: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? element : null;
}

/** Remember whether a guide has been seen. Storage can be blocked, so never rely on it. */
export function hasSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function markSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

/**
 * A step-by-step guide that dims the page except for the one place to look at.
 * The dimmed area is made of four panels around the target, so the target itself
 * stays clear and clickable.
 */
export function Tour({ steps, label, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [at, setAt] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    setMounted(true);
    return () => {
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);

  const step = steps[at];
  const last = at === steps.length - 1;

  const move = useCallback(
    (direction: 1 | -1) => {
      let next = at + direction;
      while (next >= 0 && next < steps.length && !find(steps[next].target)) next += direction;
      if (next < 0) return;
      if (next >= steps.length) return onClose(true);
      setAt(next);
    },
    [at, steps, onClose],
  );

  // Skip past leading steps whose target is not on screen (for example the rail on a phone).
  useEffect(() => {
    if (!mounted || find(steps[at].target)) return;
    let next = at + 1;
    while (next < steps.length && !find(steps[next].target)) next += 1;
    if (next >= steps.length) onClose(true);
    else setAt(next);
  }, [mounted, at, steps, onClose]);

  // Keep the spotlight on the target while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!mounted) return;
    const element = find(step.target);
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    let frame = 0;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setBox((old) =>
        old && old.top === rect.top && old.left === rect.left && old.width === rect.width && old.height === rect.height
          ? old
          : { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      );
      setSize((old) => (old.width === window.innerWidth && old.height === window.innerHeight ? old : { width: window.innerWidth, height: window.innerHeight }));
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [mounted, step.target, at]);

  useEffect(() => {
    if (mounted) primary.current?.focus({ preventScroll: true });
  }, [mounted, at]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(false);
      } else if (event.key === "ArrowRight") {
        move(1);
      } else if (event.key === "ArrowLeft") {
        move(-1);
      } else if (event.key === "Tab" && card.current) {
        // Keep keyboard focus on the card.
        const buttons = Array.from(card.current.querySelectorAll<HTMLElement>("button"));
        if (buttons.length === 0) return;
        const first = buttons[0];
        const end = buttons[buttons.length - 1];
        if (!card.current.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          end.focus();
        } else if (!event.shiftKey && document.activeElement === end) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, onClose]);

  if (!mounted || !box) return null;

  const hole = { top: Math.max(box.top - PAD, 0), left: Math.max(box.left - PAD, 0), width: box.width + PAD * 2, height: box.height + PAD * 2 };
  const vw = size.width || window.innerWidth;
  const vh = size.height || window.innerHeight;
  const narrow = vw < 700;

  // Place the card beside the target when there is room, otherwise below or above it.
  const room = { right: vw - (hole.left + hole.width), left: hole.left, bottom: vh - (hole.top + hole.height), top: hole.top };
  const wanted = step.placement ?? "right";
  const order = [wanted, "right", "left", "bottom", "top"] as const;
  const fits = (side: (typeof order)[number]) => (side === "right" || side === "left" ? room[side] >= CARD_WIDTH + 24 : room[side] >= 190);
  const side = order.find(fits) ?? "bottom";
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
  let style: React.CSSProperties;
  if (narrow) {
    style = { left: 12, right: 12, bottom: 12 };
  } else if (side === "right" || side === "left") {
    const left = side === "right" ? hole.left + hole.width + 14 : hole.left - CARD_WIDTH - 14;
    style = { left: clamp(left, 12, vw - CARD_WIDTH - 12), top: clamp(hole.top, 12, vh - 260) };
  } else {
    const top = side === "bottom" ? hole.top + hole.height + 14 : Math.max(12, hole.top - 14 - 220);
    style = { top: clamp(top, 12, vh - 240), left: clamp(hole.left, 12, vw - CARD_WIDTH - 12) };
  }

  const blocker = (css: React.CSSProperties, key: string) => <div key={key} className="pf-tour-block" style={css} aria-hidden onClick={(event) => event.stopPropagation()} />;

  return createPortal(
    <div className="pf-tour" data-testid="tour">
      {blocker({ top: 0, left: 0, right: 0, height: hole.top }, "t")}
      {blocker({ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }, "b")}
      {blocker({ top: hole.top, left: 0, width: hole.left, height: hole.height }, "l")}
      {blocker({ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }, "r")}
      <div className="pf-tour-ring" style={hole} aria-hidden />
      <div ref={card} className="pf-tour-card" style={style} role="dialog" aria-modal="true" aria-label={label} aria-live="polite">
        <div className="pf-tour-count">Step {at + 1} of {steps.length}</div>
        <h2>{step.title}</h2>
        <div className="pf-tour-body">{step.body}</div>
        {step.action && (
          <button type="button" className="pf-btn pf-btn-sm" onClick={step.action.onClick}>{step.action.label}</button>
        )}
        <div className="pf-tour-dots" aria-hidden>
          {steps.map((_, i) => <i key={i} className={i === at ? "on" : i < at ? "past" : ""} />)}
        </div>
        <div className="pf-tour-nav">
          <button type="button" className="pf-tour-skip" onClick={() => onClose(false)}>Skip guide</button>
          <span style={{ flex: 1 }} />
          {at > 0 && <button type="button" className="pf-btn pf-btn-sm" onClick={() => move(-1)}>Back</button>}
          <button ref={primary} type="button" className="pf-btn pf-btn-sm pf-btn-primary" onClick={() => move(1)}>{last ? "Done" : "Next"}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
