import { eraOf, halton, pick, pickWeighted } from "./state.js";

export const AUTHORED_MAX = 400;

export const WORDS = [
  "oui", "non", "bof", "zut", "hop", "ici", "psst", "bah", "hein", "ouf",
  "bim", "pan", "ciao", "ok", "wow", "tic", "tac", "chou", "pouf", "paf",
  "miam", "stop", "hush", "nian", "tsoin", "hop-là", "voilà", "encore",
  "peau", "lune", "nuit", "soir", "midi", "plus", "rien", "tout", "vite",
];

export const TITLES = [
  "THE BUTTON — cracked.fun",
  "LE BOUTON — cracked.fun",
  "ok — cracked.fun",
  "??? — cracked.fun",
  "clique — cracked.fun",
  "encore — cracked.fun",
];

export const DIALOGS = [
  "Le bouton fonctionne encore. C’est voulu.",
  "Vous avez trop cliqué. Bravo.",
  "Ceci n’est pas une erreur.",
  "Quelqu’un appuie. On continue ?",
  "Le monde est plein. On ajoute quand même.",
];

const EARLY = [
  { n: 1, stamp: "blot", layer: "near", x: 488, y: 292, s: 1.15 },
  { n: 2, stamp: "line", layer: "near", x: 690, y: 278, s: 1.35, len: 64, tilt: 8 },
  { n: 3, stamp: "line", layer: "near", x: 500, y: 392, s: 1.3, len: 56, tilt: 18, rot: -14 },
  { n: 4, stamp: "horizon", layer: "far", x: 600, y: 402, s: 1 },
  { n: 5, stamp: "sun", layer: "sky", x: 210, y: 128, s: 1.2, flag: "sky" },
  { n: 6, stamp: "shadow", layer: "near", x: 600, y: 368, s: 1.15, flag: "shadow" },
  { n: 7, stamp: "pebble", layer: "ground", x: 690, y: 418, s: 1.45 },
  { n: 8, stamp: "grass", layer: "ground", x: 500, y: 404, s: 1.45, blades: 8, caption: "tiens." },
  { n: 9, stamp: "hill", layer: "far", x: 280, y: 400, s: 1.08, w: 360, h: 124, color: "#7eae78" },
  { n: 10, stamp: "hill", layer: "far", x: 920, y: 408, s: 1.08, w: 400, h: 108, color: "#5e8f66" },
  { n: 11, stamp: "tree", layer: "mid", x: 250, y: 368, s: 1.35 },
  { n: 12, stamp: "cloud", layer: "sky", x: 430, y: 118, s: 1.28 },
  { n: 13, stamp: "house", layer: "mid", x: 820, y: 372, s: 1.22 },
  { n: 14, stamp: "chimney", layer: "mid", x: 848, y: 308, s: 1.2 },
  { n: 15, stamp: "path", layer: "ground", x: 600, y: 418, s: 1.15 },
  { n: 16, stamp: "mailbox", layer: "near", x: 736, y: 392, s: 1.35 },
  { n: 17, stamp: "bird", layer: "sky", x: 500, y: 168, s: 1.45 },
  { n: 18, stamp: "grass", layer: "ground", x: 760, y: 410, s: 1.4, blades: 8 },
  { n: 19, stamp: "bush", layer: "mid", x: 300, y: 400, s: 1.25 },
  { n: 20, stamp: "fence", layer: "mid", x: 160, y: 400, s: 1.2 },
  { n: 21, stamp: "cat", layer: "life", x: 560, y: 400, s: 1.25 },
  { n: 22, stamp: "bike", layer: "life", x: 430, y: 400, s: 1.2 },
  { n: 23, stamp: "laundry", layer: "mid", x: 880, y: 330, s: 1.15 },
  { n: 24, stamp: "satellite", layer: "sky", x: 1040, y: 88, s: 1.1, rot: -12 },
  { n: 25, stamp: "plane", layer: "sky", x: 760, y: 96, s: 1.2 },
  { n: 26, stamp: "lamp", layer: "near", x: 500, y: 368, s: 1.15 },
  { n: 27, stamp: "cloud", layer: "sky", x: 980, y: 140, s: 1.05 },
  { n: 28, stamp: "flower", layer: "life", x: 640, y: 408, s: 1.25, color: "#e07a9a" },
  { n: 29, stamp: "dog", layer: "life", x: 360, y: 404, s: 1.2 },
  { n: 30, stamp: "bench", layer: "mid", x: 470, y: 396, s: 1.15 },
  { n: 31, stamp: "bird", layer: "sky", x: 300, y: 150, s: 1.25, flip: true },
  { n: 32, stamp: "winlight", layer: "mid", x: 838, y: 342, s: 1.15, flag: "window" },
  { n: 33, stamp: "pond", layer: "ground", x: 140, y: 430, s: 1.2 },
  { n: 34, stamp: "gnome", layer: "life", x: 700, y: 400, s: 1.2 },
  { n: 35, stamp: "star", layer: "sky", x: 180, y: 80, s: 1.1, flag: "night", mile: true },
  { n: 36, stamp: "moon", layer: "sky", x: 1040, y: 120, s: 1.3, flag: "dayMoon", mile: true },
  { n: 37, stamp: "butterfly", layer: "life", x: 580, y: 300, s: 1.25 },
  { n: 38, stamp: "chimney", layer: "mid", x: 856, y: 300, s: 0.95, rot: 8 },
  { n: 39, stamp: "balloon", layer: "life", x: 390, y: 300, s: 1.2 },
  { n: 40, stamp: "squirrel", layer: "life", x: 268, y: 360, s: 1.2 },
];

const SPECIAL = {
  46: { stamp: "shop", layer: "mid", x: 980, y: 372, s: 1, word: "PAIN" },
  50: { stamp: "fountain", layer: "mid", x: 600, y: 430, s: 1.1 },
  54: { stamp: "graffiti", layer: "mid", x: 800, y: 348, s: 1, word: "ok", color: "#5b4db0" },
  58: { stamp: "road", layer: "ground", x: 600, y: 456, s: 1 },
  62: { stamp: "car", layer: "life", x: 420, y: 448, s: 1, color: "#c45c4a" },
  66: { stamp: "traffic", layer: "near", x: 320, y: 420, s: 1 },
  71: { stamp: "car", layer: "life", x: 780, y: 448, s: 1.05, color: "#f2d66b", flag: "traffic", mile: true },
  80: { stamp: "house", layer: "mid", x: 110, y: 372, s: 0.9, wall: "#e7dcc8", roof: "#3d6b8a" },
  88: { stamp: "crack", layer: "ground", x: 520, y: 430, s: 0.45, d: "M -30 0 L 0 6 L 28 -4" },
  94: { stamp: "crack", layer: "ground", x: 700, y: 438, s: 0.55 },
  100: { stamp: "eye", layer: "under", x: 600, y: 548, s: 1.35, flag: "creature", mile: true, caption: "ah." },
  108: { stamp: "scale", layer: "under", x: 220, y: 620, s: 1.6, color: "#6a8f6e" },
  116: { stamp: "scale", layer: "under", x: 980, y: 630, s: 1.8, color: "#587a62" },
  128: { stamp: "ufo", layer: "sky", x: 160, y: 90, s: 1 },
  140: { stamp: "orchestra", layer: "life", x: 200, y: 390, s: 0.95, mile: true },
  152: { stamp: "ufo", layer: "sky", x: 900, y: 70, s: 1.2, beam: 0.28 },
  160: { stamp: "parade", layer: "life", x: 1000, y: 400, s: 1 },
  168: { stamp: "skytext", layer: "sky", x: 600, y: 64, s: 1, word: "VOILÀ", size: 32 },
  175: { stamp: "queue", layer: "near", x: 470, y: 352, s: 1 },
  180: { stamp: "crown", layer: "near", x: 600, y: 300, s: 1.05, flag: "crown", mile: true },
  198: { stamp: "rainbow", layer: "sky", x: 600, y: 160, s: 1.4 },
  210: { stamp: "robot", layer: "life", x: 150, y: 400, s: 1.1 },
  222: { stamp: "pizza", layer: "near", x: 660, y: 390, s: 1 },
  236: { stamp: "face", layer: "sky", x: 80, y: 200, s: 0.55 },
  250: { stamp: "snow", layer: "fx", x: 600, y: 200, s: 1.2, flag: "globe", mile: true, caption: "une boule." },
  262: { stamp: "city", layer: "worlds", x: 160, y: 500, s: 1.4, cosmos: true },
  278: { stamp: "storm", layer: "weather", x: 1000, y: 120, s: 1.2, cosmos: true },
  300: { stamp: "planet", layer: "space", x: 600, y: 640, s: 1, cosmos: true, mile: true },
  318: { stamp: "city", layer: "worlds", x: 1040, y: 520, s: 1.1, cosmos: true },
  340: { stamp: "starbtn", layer: "space", x: 180, y: 80, s: 0.9, cosmos: true, word: "ok" },
  360: { stamp: "starbtn", layer: "space", x: 1020, y: 70, s: 0.8, cosmos: true, word: "." },
  378: { stamp: "comet", layer: "space", x: 400, y: 60, s: 1.2, cosmos: true, rot: -20 },
  400: { stamp: "starbtn", layer: "space", x: 600, y: 40, s: 1, cosmos: true, word: "ok", caption: "et après." },
};

const TOWN = ["house", "tree", "cloud", "car", "grass", "person", "flower", "bird", "lamp", "bush", "dog", "sign"];
const DENSE = ["house", "car", "person", "shop", "graffiti", "tree", "dog", "sign", "lamp", "flower", "bike", "cat"];
const BEAST = ["ufo", "person", "creature", "flag", "balloon", "bird", "sticker", "fish", "star", "antenna"];
const MAXI = ["sticker", "creature", "shape", "pizza", "robot", "duck", "mushroom", "snail", "fish", "skytext", "person"];
const GLOBE = ["city", "starbtn", "comet", "star", "tower", "pyramid", "windmill", "flag", "antenna", "sign"];

export const RECIPES = [
  { id: "shape", w: 4, stamp: "shape", band: "any" },
  { id: "sticker", w: 3, stamp: "sticker", band: "any" },
  { id: "creature", w: 3, stamp: "creature", band: "any" },
  { id: "sign", w: 2.4, stamp: "sign", band: "mid" },
  { id: "starbtn", w: 2.2, stamp: "starbtn", band: "space" },
  { id: "city", w: 2, stamp: "city", band: "space" },
  { id: "plant", w: 2, stamp: "mushroom", band: "mid" },
  { id: "skything", w: 2, stamp: "ufo", band: "sky" },
  { id: "vehicle", w: 1.4, stamp: "car", band: "ground" },
  { id: "face", w: 0.5, stamp: "face", band: "sky" },
  { id: "fish", w: 1.2, stamp: "fish", band: "sky" },
  { id: "tower", w: 1.3, stamp: "tower", band: "space" },
  { id: "duck", w: 1.1, stamp: "duck", band: "mid" },
  { id: "cactus", w: 1, stamp: "cactus", band: "mid" },
  { id: "flag", w: 1, stamp: "flag", band: "any" },
  { id: "comet", w: 1.1, stamp: "comet", band: "space" },
  { id: "robot", w: 1.2, stamp: "robot", band: "any" },
];

const PAL = ["#c45c4a", "#3d6b8a", "#4f8a57", "#f2d66b", "#6a4a78", "#d98a5a", "#e07a9a", "#8aa4c0", "#2a2622", "#f7f1e6"];

function avoidCenter(p, r = 78) {
  const dx = p.x - 600;
  const dy = p.y - 338;
  if (dx * dx + dy * dy < r * r) {
    const k = r / Math.max(1, Math.hypot(dx, dy));
    p.x = 600 + dx * k * (dx === 0 ? 1.2 : 1);
    p.y = 338 + dy * k;
  }
  return p;
}

function bandPoint(n, band, salt) {
  const hx = halton(n * 3 + salt, 2);
  const hy = halton(n * 3 + salt, 3);
  let p;
  if (band === "sky") p = { x: 50 + hx * 1100, y: 36 + hy * 210 };
  else if (band === "ground") p = { x: 40 + hx * 1120, y: 390 + hy * 90 };
  else if (band === "mid") p = { x: 50 + hx * 1100, y: 250 + hy * 170 };
  else if (band === "space") {
    p = { x: 30 + hx * 1140, y: 30 + hy * 620 };
    const cx = p.x - 600;
    const cy = p.y - 330;
    if (cx * cx + cy * cy < 290 * 290) {
      p.x = 600 + Math.sign(cx || 1) * (300 + hx * 220);
      p.y = 330 + Math.sign(cy || 1) * (200 + hy * 120);
    }
    return p;
  } else p = { x: 40 + hx * 1120, y: 40 + hy * 560 };
  return avoidCenter(p);
}

function fillerList(era) {
  if (era === "town") return TOWN;
  if (era === "dense") return DENSE;
  if (era === "beast") return BEAST;
  if (era === "max") return MAXI;
  return GLOBE;
}

function layerFor(stamp, era) {
  if (era === "globe" || era === "inf") {
    if (stamp === "starbtn" || stamp === "comet" || stamp === "planet" || stamp === "star") return "space";
    if (stamp === "city" || stamp === "tower" || stamp === "pyramid" || stamp === "windmill") return "worlds";
    if (stamp === "storm" || stamp === "cloud") return "weather";
    return "proc2";
  }
  if (stamp === "cloud" || stamp === "bird" || stamp === "ufo" || stamp === "sun" || stamp === "moon" || stamp === "plane" || stamp === "satellite" || stamp === "star" || stamp === "skytext" || stamp === "fish" || stamp === "comet") {
    return "sky";
  }
  if (stamp === "hill" || stamp === "horizon") return "far";
  if (stamp === "grass" || stamp === "pebble" || stamp === "path" || stamp === "road" || stamp === "pond" || stamp === "crack") return "ground";
  if (stamp === "cat" || stamp === "dog" || stamp === "bike" || stamp === "car" || stamp === "person" || stamp === "parade" || stamp === "orchestra" || stamp === "queue") return "life";
  if (stamp === "lamp" || stamp === "mailbox" || stamp === "crown" || stamp === "shadow" || stamp === "sticker" || stamp === "pizza") return "near";
  return "mid";
}

export function beatFor(n, rng) {
  if (n <= 40) return { ...EARLY[n - 1], mile: Boolean(EARLY[n - 1].flag) };
  if (SPECIAL[n]) return { ...SPECIAL[n] };

  const era = eraOf(n);
  const list = fillerList(era);
  const stamp = pick(rng, list);
  const cosmos = era === "globe";
  const band = cosmos ? "space" : stamp === "cloud" || stamp === "ufo" || stamp === "bird" || stamp === "skytext" || stamp === "fish" ? "sky" : stamp === "car" || stamp === "grass" ? "ground" : "mid";
  const p = bandPoint(n, band, 7);
  const beat = {
    n,
    stamp,
    layer: layerFor(stamp, era),
    x: p.x,
    y: p.y,
    s: 0.95 + rng() * 0.85,
    rot: (rng() - 0.5) * 24,
    color: pick(rng, PAL),
    word: pick(rng, WORDS),
    cosmos,
  };
  if (n === 35 || n === 36 || n === 71 || n === 100 || n === 180 || n === 250 || n === 300) beat.mile = true;
  return beat;
}

export function proceduralBeat(n, rng) {
  const recipe = pickWeighted(rng, RECIPES);
  const band = recipe.band === "any" ? pick(rng, ["sky", "mid", "space"]) : recipe.band;
  const p = bandPoint(n, band, 11);
  const layer = layerFor(recipe.stamp, "inf");
  return {
    n,
    stamp: recipe.stamp,
    layer: layer === "mid" && band === "space" ? "proc2" : layer,
    x: p.x,
    y: p.y,
    s: 0.85 + rng() * 1.15,
    rot: (rng() - 0.5) * 40,
    color: pick(rng, PAL),
    word: pick(rng, WORDS),
    cosmos: band === "space" || layer === "space" || layer === "worlds" || layer === "weather" || layer === "proc2",
    procedural: true,
  };
}

export function rareKind(n) {
  if (n < 401) return null;
  if (n % 250 === 0) return n % 500 === 0 ? "dialog" : "face";
  if (n % 100 === 0) return "dance";
  if (n % 50 === 0) {
    const k = (n / 50) % 3;
    if (k === 0) return "eclipse";
    if (k === 1) return "teleport";
    return "title";
  }
  return null;
}
