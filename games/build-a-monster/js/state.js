export const CATEGORIES = [
  "head",
  "eyes",
  "mouth",
  "body",
  "arms",
  "legs",
  "accessory",
];

export const LAYERS = [
  "legs",
  "body",
  "arms",
  "head",
  "eyes",
  "mouth",
  "accessory",
];

export const CATEGORY_LABELS = {
  head: "tête",
  eyes: "yeux",
  mouth: "bouche",
  body: "corps",
  arms: "bras",
  legs: "jambes",
  accessory: "plus",
};

export const UI_CATEGORIES = [
  "head",
  "eyes",
  "mouth",
  "body",
  "arms",
  "legs",
  "accessory",
];

export function defaultState() {
  return {
    head: "head-round",
    eyes: "eyes-dots",
    mouth: "mouth-smile",
    body: "body-blob",
    arms: "arms-sticks",
    legs: "legs-stumps",
    accessory: "acc-nothing",
    extras: { combo: null },
  };
}

export function cloneState(state) {
  return {
    ...state,
    extras: { ...(state.extras || { combo: null }) },
  };
}
