const HIGH_KEY = "crackman-high";
const MUTE_KEY = "crackman-mute";

function readStore(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

export function loadHighScore() {
  const raw = readStore(HIGH_KEY);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 999999999) return 0;
  return Math.floor(n);
}

export function saveHighScore(n) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return;
  writeStore(HIGH_KEY, String(Math.min(v, 999999999)));
}

export function loadMuted() {
  return readStore(MUTE_KEY) === "1";
}

export function saveMuted(muted) {
  writeStore(MUTE_KEY, muted ? "1" : "0");
}

const HERO_KEY = "crackman-hero";

export function loadHero() {
  const raw = readStore(HERO_KEY);
  return raw === "b" || raw === "s" ? raw : "s";
}

export function saveHero(id) {
  if (id === "s" || id === "b") writeStore(HERO_KEY, id);
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  } catch {
    return false;
  }
}
