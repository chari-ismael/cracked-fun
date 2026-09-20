import { CATEGORIES, cloneState } from "./state.js";
import { allTags, getPart, partsIn, resolveParts } from "./parts.js";

const RARITY_WEIGHT = {
  common: 1,
  uncommon: 0.55,
  rare: 0.22,
};

const ILLEGAL = [
  ["huge-head", "huge-body"],
  ["no-arms", "claws"],
  ["no-arms", "many"],
  ["hover", "boots"],
  ["tiny-body", "noodle"],
];

const TAG_CATEGORY = {
  "huge-head": "head",
  "huge-body": "body",
  "no-arms": "body",
  claws: "arms",
  many: "arms",
  hover: "legs",
  boots: "legs",
  "tiny-body": "body",
  noodle: "arms",
};

export const COMBOS = [
  {
    id: "cafe",
    name: "Café mobile",
    trait: "le bureau se déplace tout seul",
    test(tags) {
      return tags.has("wheel") && tags.has("mug");
    },
  },
  {
    id: "signal",
    name: "Signal",
    trait: "trois regards, une antenne",
    test(tags) {
      return tags.has("three") && tags.has("antenna");
    },
  },
  {
    id: "poli",
    name: "Poli",
    trait: "salue sans visage",
    test(tags) {
      return tags.has("no-mouth") && tags.has("no-eyes");
    },
  },
  {
    id: "patate",
    name: "Patate",
    trait: "grosse base, petite idée",
    test(tags) {
      return tags.has("tiny-head") && tags.has("huge-body");
    },
  },
  {
    id: "mille",
    name: "Mille-pattes",
    trait: "trop de membres, trop d’idées",
    test(tags) {
      return tags.has("many") && tags.has("extra-legs");
    },
  },
  {
    id: "boule",
    name: "Boule-Boule",
    trait: "rien à casser",
    test(tags, parts) {
      const SHAPE = [
        "round",
        "boxy",
        "spiked",
        "banana",
        "long",
        "pear",
        "tiny",
        "tall",
        "cube",
        "square",
      ];
      const shapes = [];
      for (const piece of Object.values(parts)) {
        for (const tag of piece.tags) {
          if (SHAPE.includes(tag)) shapes.push(tag);
        }
      }
      return (
        parts.body.tags.includes("round") &&
        parts.head.tags.includes("round") &&
        shapes.length > 0 &&
        shapes.every((s) => s === "round")
      );
    },
  },
];

function effectiveWeight(piece) {
  return (piece.weight || 1) * (RARITY_WEIGHT[piece.rarity] || 1);
}

function pickWeighted(items, rand) {
  const total = items.reduce((sum, item) => sum + effectiveWeight(item), 0);
  if (total <= 0) return items[0];
  let r = rand() * total;
  for (const item of items) {
    r -= effectiveWeight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function pickInCategory(category, rand, boostRare) {
  const pool = partsIn(category);
  if (boostRare) {
    const rares = pool.filter((p) => p.rarity === "rare");
    if (rares.length) return pickWeighted(rares, rand);
  }
  return pickWeighted(pool, rand);
}

function conflictOf(state) {
  const tags = allTags(state);
  for (const [a, b] of ILLEGAL) {
    if (tags.has(a) && tags.has(b)) return [a, b];
  }
  return null;
}

export function detectCombo(state) {
  const parts = resolveParts(state);
  const tags = allTags(state);
  for (const combo of COMBOS) {
    if (combo.test(tags, parts)) return combo;
  }
  return null;
}

export function randomMonster(rand = Math.random) {
  const state = {
    extras: { combo: null },
  };

  const boostRare = rand() < 0.08;
  for (const category of CATEGORIES) {
    state[category] = pickInCategory(category, rand, boostRare).id;
  }

  for (let i = 0; i < 8; i += 1) {
    const conflict = conflictOf(state);
    if (!conflict) break;
    const tag = rand() < 0.5 ? conflict[0] : conflict[1];
    const category = TAG_CATEGORY[tag] || CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    state[category] = pickInCategory(category, rand, false).id;
  }

  const combo = detectCombo(state);
  state.extras = { combo: combo ? combo.id : null };
  return cloneState(state);
}

