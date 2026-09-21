import { useEffect, useState } from "react";

export type DebugEvent = { id: string; kind: "error" | "nav" | "info"; text: string; at: number };

const MAX = 10;
let errors: DebugEvent[] = [];
let navs: DebugEvent[] = [];
const overlays = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(list: DebugEvent[], event: DebugEvent) {
  const next = [...list, event];
  return next.slice(-MAX);
}

export function logDebug(kind: DebugEvent["kind"], text: string) {
  const event: DebugEvent = { id: `${Date.now()}-${Math.random()}`, kind, text: text.slice(0, 400), at: Date.now() };
  if (kind === "nav") navs = push(navs, event);
  else errors = push(errors, event);
  emit();
}

export function setOverlay(name: string, open: boolean) {
  if (open) overlays.add(name);
  else overlays.delete(name);
  emit();
}

export function readDebug() {
  return { errors, navs, overlays: [...overlays] };
}

export function useDebugState() {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return readDebug();
}

let attached = false;
export function attachGlobalDebugCapture() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("error", (event) => logDebug("error", `window.onerror: ${event.message}`));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    logDebug("error", `unhandledrejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  });
}

/** Marks an overlay as open for the lifetime of the component. */
export function useOverlayFlag(name: string, open: boolean) {
  useEffect(() => {
    setOverlay(name, open);
    return () => setOverlay(name, false);
  }, [name, open]);
}
