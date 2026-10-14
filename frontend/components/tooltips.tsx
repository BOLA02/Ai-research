"use client";

import { useEffect, useRef, useState } from "react";

type Tip = { text: string; x: number; y: number; below: boolean };

/** Text to show for an element: data-tip, a title, or the label of a button that has only an icon. */
function tipFor(element: HTMLElement): string {
  const explicit = element.getAttribute("data-tip") ?? element.getAttribute("data-title");
  if (explicit) return explicit;
  const label = element.getAttribute("aria-label");
  if (label && (element.matches("button, a, [role=button]")) && !(element.textContent ?? "").trim()) return label;
  return "";
}

/**
 * One tooltip for the whole app. It appears when the pointer rests on a control,
 * or when a control gets keyboard focus. Icon-only buttons are explained by their
 * label, and anything can opt in with data-tip="…" or a title.
 */
export function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<number>(0);
  const target = useRef<HTMLElement | null>(null);
  const stolen = useRef<{ element: HTMLElement; title: string } | null>(null);

  useEffect(() => {
    const restore = () => {
      if (stolen.current) stolen.current.element.setAttribute("title", stolen.current.title);
      stolen.current = null;
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      target.current = null;
      restore();
      setTip(null);
    };
    const show = (element: HTMLElement, delay: number) => {
      // The browser's own tooltip would double this one, so set it aside while ours shows.
      const title = element.getAttribute("title");
      const text = tipFor(element) || title || "";
      if (!text) return;
      target.current = element;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (target.current !== element || !element.isConnected) return;
        if (title) {
          element.removeAttribute("title");
          stolen.current = { element, title };
        }
        const rect = element.getBoundingClientRect();
        const below = rect.top < 48;
        setTip({ text, x: Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120), y: below ? rect.bottom + 8 : rect.top - 8, below });
      }, delay);
    };
    const candidate = (node: EventTarget | null) => (node instanceof Element ? (node.closest("[data-tip], [data-title], [title], button[aria-label], a[aria-label], [role=button][aria-label]") as HTMLElement | null) : null);

    const over = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const element = candidate(event.target);
      if (element === target.current) return;
      hide();
      if (element) show(element, 400);
    };
    const focus = (event: FocusEvent) => {
      const element = candidate(event.target);
      if (element && element.matches(":focus-visible")) show(element, 150);
    };
    const key = (event: KeyboardEvent) => event.key === "Escape" && hide();

    document.addEventListener("pointerover", over);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", hide, true);
      window.clearTimeout(timer.current);
      restore();
    };
  }, []);

  if (!tip) return null;
  return (
    <div className="pf-tip" role="tooltip" style={{ left: tip.x, top: tip.y, transform: tip.below ? "translateX(-50%)" : "translate(-50%, -100%)" }}>
      {tip.text}
    </div>
  );
}
