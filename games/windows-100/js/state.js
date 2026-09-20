const listeners = new Set();
const pulses = new Set();

export const MAX_WINDOWS = 8;

export const state = {
  chaos: 0,
  startedAt: 0,
  lastInput: 0,
  clockSkew: 0,
  clockBackUntil: 0,
  clockFreezeUntil: 0,
  clockFreezeUntilStamp: 0,
  lastUnsolicited: 0,
  lastFlash: 0,
  lastSwap: 0,
  flags: {
    wallpaperAlt: false,
    finale: false,
    booting: true,
  },
};

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function tierIndex(n = state.chaos) {
  if (n >= 100) return 6;
  if (n >= 95) return 5;
  if (n >= 80) return 4;
  if (n >= 60) return 3;
  if (n >= 40) return 2;
  if (n >= 20) return 1;
  return 0;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function onPulse(fn) {
  pulses.add(fn);
  return () => pulses.delete(fn);
}

export function pulseAll() {
  for (const fn of pulses) fn();
}

export function emit() {
  document.documentElement.dataset.chaos = String(tierIndex());
  document.body.classList.toggle("wall-b", state.flags.wallpaperAlt);
  document.body.classList.toggle("is-finale", state.flags.finale);
  document.body.classList.toggle("is-boot", state.flags.booting);
  for (const fn of listeners) fn(state);
}

export function setChaos(n) {
  const prev = state.chaos;
  state.chaos = Math.max(0, Math.min(100, n));
  emit();
  return prev < 100 && state.chaos >= 100;
}

export function addChaos(delta) {
  if (state.flags.booting) return false;
  if (state.flags.finale && delta > 0) return false;
  const step = Math.max(-8, Math.min(2.5, delta));
  return setChaos(state.chaos + step);
}

export function touch() {
  state.lastInput = performance.now();
}

export function resetSession() {
  state.chaos = 0;
  state.clockSkew = 0;
  state.clockBackUntil = 0;
  state.clockFreezeUntil = 0;
  state.clockFreezeUntilStamp = 0;
  state.lastUnsolicited = 0;
  state.lastFlash = 0;
  state.lastSwap = 0;
  state.flags.finale = false;
  state.flags.wallpaperAlt = false;
  state.startedAt = performance.now();
  state.lastInput = performance.now();
  emit();
}

export function clockLabel(now = Date.now()) {
  if (state.chaos >= 90) return "100%";
  if (state.clockFreezeUntil > performance.now() && state.clockFreezeUntilStamp) {
    now = state.clockFreezeUntilStamp;
  }
  const t = new Date(now + state.clockSkew);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function chaosLabel() {
  return `${Math.floor(state.chaos)}%`;
}
