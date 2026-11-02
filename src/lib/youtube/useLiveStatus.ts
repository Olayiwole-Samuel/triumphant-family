"use client";

import { useSyncExternalStore } from "react";
import type { LiveStatus } from "./parse";

/**
 * One shared live-status poller for the whole page.
 *
 * - A single interval, however many components subscribe.
 * - Polls /api/live-status every 90 s, only while the tab is visible; checks
 *   immediately when the visitor returns to the tab.
 * - Ignores out-of-order (older) responses and keeps the last good status if
 *   a request fails, so the UI never flickers into a wrong state.
 * - Does nothing when live checking isn't configured.
 */
const INTERVAL_MS = 90_000;

let current: LiveStatus | null = null;
const listeners = new Set<() => void>();
let timer: number | undefined;
let inflight: AbortController | null = null;

const checkedAt = (status: LiveStatus | null) =>
  status && "checkedAt" in status ? Date.parse(status.checkedAt) : 0;

function isLiveStatus(value: unknown): value is LiveStatus {
  if (typeof value !== "object" || value === null) return false;
  const state = (value as { state?: unknown }).state;
  return ["live", "upcoming", "ended", "none", "unavailable", "not_configured"].includes(String(state));
}

async function refresh() {
  if (document.visibilityState !== "visible") return;
  inflight?.abort();
  const controller = new AbortController();
  inflight = controller;
  try {
    const response = await fetch("/api/live-status", { signal: controller.signal, cache: "no-store" });
    if (!response.ok) return;
    const next: unknown = await response.json();
    if (isLiveStatus(next) && checkedAt(next) >= checkedAt(current)) {
      current = next;
      listeners.forEach((listener) => listener());
    }
  } catch {
    // Network error or aborted — keep the last known status.
  } finally {
    if (inflight === controller) inflight = null;
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") void refresh();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = window.setInterval(refresh, INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = undefined;
      inflight?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

const noopSubscribe = () => () => {};

/** Current live status, starting from the server-rendered value. */
export function useLiveStatus(initial: LiveStatus): LiveStatus {
  const polling = initial.state !== "not_configured";
  return useSyncExternalStore(
    polling ? subscribe : noopSubscribe,
    // Whichever is newer: the server-rendered status or the latest poll.
    () => (current && checkedAt(current) >= checkedAt(initial) ? current : initial),
    () => initial,
  );
}
