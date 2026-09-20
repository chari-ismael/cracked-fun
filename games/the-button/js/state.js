export const TITLE = "THE BUTTON — cracked.fun";

export function createState() {
  return {
    clicks: 0,
    seed: (Math.floor(Math.random() * 0x7fffffff) || 1) >>> 0,
    flags: Object.create(null),
    btnX: 0,
    btnY: 0,
    caption: "",
    label: "ok",
    title: TITLE,
    pressed: 0,
    era: "void",
    dialog: null,
  };
}

export function rngAt(state, n, salt = 0) {
  let a =
    (state.seed ^
      Math.imul((n + 1) | 0, 0x9e3779b9) ^
      Math.imul((salt + 1) | 0, 0x85ebca6b)) |
    0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function pickWeighted(rng, items) {
  let total = 0;
  for (const it of items) total += it.w;
  let r = rng() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function halton(index, base) {
  let result = 0;
  let f = 1 / base;
  let i = index + 1;
  while (i > 0) {
    result += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return result;
}

export function eraOf(n) {
  if (n <= 0) return "void";
  if (n <= 8) return "marks";
  if (n <= 20) return "land";
  if (n <= 40) return "life";
  if (n <= 70) return "town";
  if (n <= 99) return "dense";
  if (n <= 180) return "beast";
  if (n <= 249) return "max";
  if (n <= 400) return "globe";
  return "inf";
}
