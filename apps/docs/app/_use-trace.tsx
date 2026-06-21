"use client";

/**
 * useTrace — shared "which id is active" state with an auto-trace that walks a list of ids and
 * yields control to the user on first interaction.
 *
 * The landing's cross-highlight engine: the hero, ContractFork and ReleaseSurface each feed it an
 * ordered id list (node ids, changelog rows…) and an `activeId` lights the matching surface + JSON
 * row + Beam. While untouched it auto-steps every `intervalMs` (~1.8s); the FIRST pointerenter or
 * focus on any bound element CLEARS the interval and hands steering to the user — hover/focus then
 * drives `activeId` directly. Arrow keys (←/→) step through the list when an element is focused.
 *
 * `prefers-reduced-motion` is a HARD gate: no interval is ever started; `activeId` simply rests on
 * the first id (a meaningful static end-state) and still responds to hover/focus/keys.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type PointerEventHandler,
} from "react";

export interface TraceBindHandlers {
  onPointerEnter: PointerEventHandler<Element>;
  onFocus: FocusEventHandler<Element>;
  onKeyDown: KeyboardEventHandler<Element>;
  tabIndex: 0;
  "data-trace-id": string;
}

export interface UseTraceResult {
  /** The currently-traced id, or null when nothing is active. */
  activeId: string | null;
  /** Imperatively set the active id (e.g. on pointerleave → null). */
  setActiveId: (id: string | null) => void;
  /** Spread onto each interactive element; `id` is the trace id it represents. */
  bind: (id: string) => TraceBindHandlers;
}

export interface UseTraceOptions {
  /** Auto-step cadence in ms. Default 1800. */
  intervalMs?: number;
  /** Start auto-tracing immediately. Default true. */
  autoStart?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTrace(ids: readonly string[], options: UseTraceOptions = {}): UseTraceResult {
  const { intervalMs = 1800, autoStart = true } = options;
  const [activeId, setActiveIdState] = useState<string | null>(ids[0] ?? null);
  // Once the user touches anything, auto-trace never resumes.
  const userTookOver = useRef(false);
  // Keep the latest ids without re-arming the interval on every render. Synced in an effect
  // (never mutated during render) so the auto-trace + key-stepping read the current list.
  const idsRef = useRef<readonly string[]>(ids);
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
  }, []);

  const stop = useCallback(() => {
    userTookOver.current = true;
  }, []);

  // Auto-trace: step through ids on an interval until the user takes over. Reduced-motion → none.
  useEffect(() => {
    if (!autoStart) return;
    if (prefersReducedMotion()) return; // hard gate: static first-frame, no interval
    const timer = window.setInterval(() => {
      if (userTookOver.current) return;
      setActiveIdState((current) => {
        const list = idsRef.current;
        if (list.length === 0) return current;
        const idx = current ? list.indexOf(current) : -1;
        return list[(idx + 1) % list.length] ?? list[0] ?? null;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [autoStart, intervalMs]);

  const bind = useCallback(
    (id: string): TraceBindHandlers => ({
      "data-trace-id": id,
      tabIndex: 0,
      onPointerEnter: () => {
        stop();
        setActiveIdState(id);
      },
      onFocus: () => {
        stop();
        setActiveIdState(id);
      },
      onKeyDown: (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        stop();
        const list = idsRef.current;
        if (list.length === 0) return;
        const idx = list.indexOf(id);
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const next = list[(idx + delta + list.length) % list.length];
        setActiveIdState(next ?? id);
      },
    }),
    [stop],
  );

  return { activeId, setActiveId, bind };
}
