const INK = "#16140f";
const SW = 2.6;
const C = {
  mustard: "#e0b400",
  tomato: "#d44528",
  teal: "#2c8a7c",
  charcoal: "#3a3732",
  cream: "#efe6d2",
  paper: "#f4efe4",
  white: "#fbf7ee",
  pink: "#e07060",
  gum: "#8a2f28",
  blush: "#e8a090",
};

function stroke(extra = "") {
  return `fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
}

function fill(color, extra = "") {
  return `fill="${color}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
}

function soft(color, extra = "") {
  return `fill="${color}" stroke="none" ${extra}`;
}

function eye(cx, cy, r = 11, px = 0, py = 2) {
  const pr = Math.max(3.2, r * 0.38);
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${(r * 1.08).toFixed(1)}" ${fill(C.white)}/>
    <circle cx="${cx + px}" cy="${cy + py}" r="${pr.toFixed(1)}" ${fill(INK)}/>
    <circle cx="${cx + px + pr * 0.35}" cy="${cy + py - pr * 0.4}" r="${(pr * 0.28).toFixed(1)}" ${soft(C.white)}/>
  `;
}

function part(def) {
  return {
    weight: 1,
    tags: [],
    copies: 1,
    angles: [0],
    single: false,
    tripod: false,
    float: 0,
    slot: "crown",
    glyph() {
      return this.draw();
    },
    ...def,
  };
}

export const PARTS = [
  /* ——— corps ——— */
  part({
    id: "body-blob",
    category: "body",
    layer: "body",
    label: "gros blob",
    rarity: "common",
    tags: ["round", "huge-body", "blob"],
    glyphBox: "-86 -74 172 148",
    anchor: {
      head: { x: 0, y: -60 },
      armL: { x: -72, y: -8 },
      armR: { x: 72, y: -8 },
      hip: { x: 0, y: 58 },
      spread: 24,
    },
    draw() {
      return `
        <ellipse cx="6" cy="10" rx="70" ry="56" ${soft("#c49a00")} opacity="0.35"/>
        <path d="M-70,-8 C-78,-48 -40,-68 0,-66 C48,-64 80,-36 74,8 C68,52 28,70 0,68 C-40,66 -76,40 -70,-8Z" ${fill(C.mustard)}/>
        <ellipse cx="-18" cy="-8" rx="22" ry="14" ${soft("#f0d45a")} opacity="0.45"/>
        <path d="M-28,18 Q0,32 30,14" ${stroke(`stroke-width="2.2"`)}/>
        <circle cx="18" cy="6" r="3.2" ${fill(C.charcoal)}/>
      `;
    },
  }),
  part({
    id: "body-tall",
    category: "body",
    layer: "body",
    label: "grand fuseau",
    rarity: "common",
    tags: ["tall"],
    glyphBox: "-50 -92 100 184",
    anchor: {
      head: { x: 0, y: -80 },
      armL: { x: -38, y: -22 },
      armR: { x: 38, y: -22 },
      hip: { x: 0, y: 76 },
      spread: 14,
    },
    draw() {
      return `
        <path d="M0,-84 C28,-80 40,-40 36,8 C32,56 22,84 0,86 C-22,84 -32,56 -36,8 C-40,-40 -28,-80 0,-84Z" ${fill(C.teal)}/>
        <ellipse cx="-8" cy="-24" rx="12" ry="22" ${soft("#5aa89c")} opacity="0.4"/>
        <path d="M-28,6 H28" ${stroke(`stroke-width="2.2"`)}/>
        <circle cx="0" cy="-10" r="3" ${fill(C.cream)}/>
        <circle cx="0" cy="22" r="3" ${fill(C.cream)}/>
        <circle cx="0" cy="46" r="3" ${fill(C.cream)}/>
      `;
    },
  }),
  part({
    id: "body-tiny",
    category: "body",
    layer: "body",
    label: "minuscule",
    rarity: "uncommon",
    tags: ["tiny", "tiny-body", "no-arms", "round"],
    glyphBox: "-48 -42 96 84",
    anchor: {
      head: { x: 0, y: -32 },
      armL: { x: -36, y: 2 },
      armR: { x: 36, y: 2 },
      hip: { x: 0, y: 30 },
      spread: 12,
    },
    draw() {
      return `
        <ellipse cx="4" cy="6" rx="34" ry="28" ${soft("#b33822")} opacity="0.3"/>
        <path d="M-36,-4 C-38,-28 -16,-36 0,-34 C22,-32 40,-16 36,6 C32,28 12,36 0,34 C-20,32 -38,20 -36,-4Z" ${fill(C.tomato)}/>
        <ellipse cx="-10" cy="-8" rx="10" ry="7" ${soft("#f08a72")} opacity="0.45"/>
        <path d="M-8,10 q8,8 18,0" ${stroke(`stroke-width="2"`)}/>
      `;
    },
  }),
  part({
    id: "body-spiked",
    category: "body",
    layer: "body",
    label: "piquant",
    rarity: "rare",
    tags: ["spiked", "no-arms"],
    glyphBox: "-82 -82 164 164",
    anchor: {
      head: { x: 0, y: -68 },
      armL: { x: -64, y: -6 },
      armR: { x: 64, y: -6 },
      hip: { x: 0, y: 58 },
      spread: 22,
    },
    draw() {
      const tris = [0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => {
          const a = (i * Math.PI) / 4 - Math.PI / 2;
          const tip = `${(Math.cos(a) * 80).toFixed(1)},${(Math.sin(a) * 80).toFixed(1)}`;
          const left = `${(Math.cos(a - 0.26) * 46).toFixed(1)},${(Math.sin(a - 0.26) * 46).toFixed(1)}`;
          const right = `${(Math.cos(a + 0.26) * 46).toFixed(1)},${(Math.sin(a + 0.26) * 46).toFixed(1)}`;
          return `<polygon points="${tip} ${left} ${right}" ${fill(C.charcoal)}/>`;
        })
        .join("");
      return `
        ${tris}
        <circle cx="0" cy="0" r="50" ${fill(C.charcoal)}/>
        <circle cx="0" cy="4" r="28" ${fill("#2a2722")}/>
        <path d="M-16,10 Q0,20 16,8" ${stroke(`stroke-width="2.1" stroke="${C.cream}"`)}/>
      `;
    },
  }),
  part({
    id: "body-rectangle",
    category: "body",
    layer: "body",
    label: "rectangle",
    rarity: "common",
    tags: ["boxy", "square"],
    glyphBox: "-70 -62 140 124",
    anchor: {
      head: { x: 0, y: -50 },
      armL: { x: -58, y: -10 },
      armR: { x: 58, y: -10 },
      hip: { x: 0, y: 50 },
      spread: 26,
    },
    draw() {
      return `
        <rect x="-58" y="-50" width="116" height="100" rx="8" ${fill(C.cream)}/>
        <rect x="-50" y="-36" width="100" height="28" rx="4" ${fill("#e4d7b8")}/>
        <rect x="-50" y="2" width="100" height="28" rx="4" ${fill("#e4d7b8")}/>
        <circle cx="36" cy="-22" r="3.4" ${fill(C.charcoal)}/>
        <circle cx="36" cy="16" r="3.4" ${fill(C.charcoal)}/>
        <path d="M-44,-8 h28 M-44,28 h28" ${stroke(`stroke-width="2"`)}/>
      `;
    },
  }),
  part({
    id: "body-pear",
    category: "body",
    layer: "body",
    label: "poire",
    rarity: "uncommon",
    tags: ["pear", "huge-body"],
    glyphBox: "-66 -86 132 176",
    anchor: {
      head: { x: 0, y: -70 },
      armL: { x: -42, y: -4 },
      armR: { x: 42, y: -4 },
      hip: { x: 0, y: 76 },
      spread: 22,
    },
    draw() {
      return `
        <path d="M0,-80 C14,-80 18,-46 20,-12 C24,28 70,68 0,86 C-70,68 -24,28 -20,-12 C-18,-46 -14,-80 0,-80Z" ${fill(C.teal)}/>
        <ellipse cx="-8" cy="-8" rx="14" ry="24" ${soft("#5aa89c")} opacity="0.35"/>
        <ellipse cx="0" cy="36" rx="22" ry="16" ${soft("#24685e")} opacity="0.25"/>
        <circle cx="6" cy="18" r="3" ${fill(C.mustard)}/>
        <path d="M-2,-80 q4,-16 14,-10" ${stroke(`stroke-width="2.2"`)}/>
      `;
    },
  }),

  /* ——— têtes ——— */
  part({
    id: "head-round",
    category: "head",
    layer: "head",
    label: "tête ronde",
    rarity: "common",
    tags: ["round"],
    glyphBox: "-54 -54 108 108",
    anchor: {
      neck: { x: 0, y: 46 },
      eyes: { x: 0, y: -6 },
      mouth: { x: 0, y: 18 },
      crown: { x: 0, y: -40 },
      neckAcc: { x: 0, y: 56 },
    },
    draw() {
      return `
        <circle cx="0" cy="0" r="46" ${fill(C.cream)}/>
        <ellipse cx="-28" cy="8" rx="8" ry="5" ${soft(C.blush)} opacity="0.55"/>
        <ellipse cx="28" cy="8" rx="8" ry="5" ${soft(C.blush)} opacity="0.55"/>
        <path d="M-8,-2 Q0,4 8,-2" ${stroke(`stroke-width="2"`)}/>
        <path d="M-46,-4 q-10,-16 2,-22" ${stroke(`stroke-width="2.4"`)}/>
        <path d="M46,-4 q10,-16 -2,-22" ${stroke(`stroke-width="2.4"`)}/>
      `;
    },
  }),
  part({
    id: "head-square",
    category: "head",
    layer: "head",
    label: "tête carrée",
    rarity: "common",
    tags: ["boxy", "square"],
    glyphBox: "-50 -50 100 100",
    anchor: {
      neck: { x: 0, y: 42 },
      eyes: { x: 0, y: -6 },
      mouth: { x: 0, y: 16 },
      crown: { x: 0, y: -36 },
      neckAcc: { x: 0, y: 52 },
    },
    draw() {
      return `
        <rect x="-42" y="-42" width="84" height="84" rx="10" ${fill(C.teal)}/>
        <rect x="-30" y="-18" width="60" height="40" rx="8" ${soft("#24685e")} opacity="0.18"/>
        <ellipse cx="-26" cy="10" rx="7" ry="4" ${soft(C.blush)} opacity="0.45"/>
        <ellipse cx="26" cy="10" rx="7" ry="4" ${soft(C.blush)} opacity="0.45"/>
        <path d="M-6,0 h12" ${stroke(`stroke-width="2.2"`)}/>
        <path d="M-42,-8 q-12,-18 4,-24" ${stroke(`stroke-width="2.4"`)}/>
        <path d="M42,-8 q12,-18 -4,-24" ${stroke(`stroke-width="2.4"`)}/>
      `;
    },
  }),
  part({
    id: "head-long",
    category: "head",
    layer: "head",
    label: "tête longue",
    rarity: "uncommon",
    tags: ["long", "tall"],
    glyphBox: "-42 -70 84 140",
    anchor: {
      neck: { x: 0, y: 58 },
      eyes: { x: 0, y: -10 },
      mouth: { x: 0, y: 22 },
      crown: { x: 0, y: -60 },
      neckAcc: { x: 0, y: 68 },
    },
    draw() {
      return `
        <ellipse cx="0" cy="0" rx="32" ry="58" ${fill(C.tomato)}/>
        <ellipse cx="-8" cy="-16" rx="10" ry="16" ${soft("#f08a72")} opacity="0.35"/>
        <path d="M-6,6 Q0,14 6,6" ${stroke(`stroke-width="2"`)}/>
        <path d="M-18,40 q18,16 36,0" ${stroke(`stroke-width="2.2"`)}/>
        <ellipse cx="-26" cy="8" rx="6" ry="4" ${soft(C.blush)} opacity="0.5"/>
        <ellipse cx="26" cy="8" rx="6" ry="4" ${soft(C.blush)} opacity="0.5"/>
      `;
    },
  }),
  part({
    id: "head-onion",
    category: "head",
    layer: "head",
    label: "oignon",
    rarity: "uncommon",
    tags: ["onion", "tiny-head"],
    glyphBox: "-34 -64 68 108",
    anchor: {
      neck: { x: 0, y: 40 },
      eyes: { x: 0, y: -2 },
      mouth: { x: 0, y: 16 },
      crown: { x: 0, y: -58 },
      neckAcc: { x: 0, y: 50 },
    },
    draw() {
      return `
        <path d="M0,-44 C22,-36 30,-12 30,8 C30,30 16,40 0,40 C-16,40 -30,30 -30,8 C-30,-12 -22,-36 0,-44Z" ${fill(C.cream)}/>
        <path d="M-18,-8 Q0,-20 18,-8" ${stroke(`stroke-width="1.8"`)}/>
        <path d="M-22,10 Q0,0 22,10" ${stroke(`stroke-width="1.8"`)}/>
        <line x1="0" y1="-44" x2="0" y2="-58" ${stroke()}/>
        <ellipse cx="0" cy="-60" rx="6" ry="3.4" ${fill(C.charcoal)}/>
        <path d="M0,-58 q10,-6 14,2" ${stroke(`stroke-width="2"`)}/>
      `;
    },
  }),
  part({
    id: "head-cube",
    category: "head",
    layer: "head",
    label: "cube",
    rarity: "rare",
    tags: ["boxy", "cube", "huge-head"],
    glyphBox: "-56 -58 112 124",
    anchor: {
      neck: { x: 0, y: 54 },
      eyes: { x: 0, y: 4 },
      mouth: { x: 0, y: 28 },
      crown: { x: 0, y: -40 },
      neckAcc: { x: 0, y: 64 },
    },
    draw() {
      return `
        <polygon points="0,-46 48,-10 48,38 0,56 -48,38 -48,-10" ${fill(C.charcoal)}/>
        <polyline points="-48,-10 0,8 48,-10" ${stroke()}/>
        <line x1="0" y1="8" x2="0" y2="56" ${stroke()}/>
        <polygon points="-48,-10 0,8 0,56 -48,38" ${soft("#2a2722")} opacity="0.25"/>
        <path d="M-18,20 h12 M6,20 h12" ${stroke(`stroke-width="2.2" stroke="${C.cream}"`)}/>
      `;
    },
  }),
  part({
    id: "head-banana",
    category: "head",
    layer: "head",
    label: "banane",
    rarity: "rare",
    tags: ["banana", "long", "huge-head"],
    glyphBox: "-68 -56 132 116",
    anchor: {
      neck: { x: 10, y: 38 },
      eyes: { x: 2, y: 2 },
      mouth: { x: 8, y: 24 },
      crown: { x: -8, y: -46 },
      neckAcc: { x: 8, y: 48 },
    },
    draw() {
      return `
        <path d="M-56,28 C-70,-8 -24,-54 32,-46 C58,-40 62,-16 42,-8 C10,2 -16,30 -34,50 C-46,60 -52,48 -56,28Z" ${fill(C.mustard)}/>
        <path d="M-56,28 C-64,16 -58,-2 -46,-8" ${stroke()}/>
        <path d="M28,-44 q8,-12 18,-4" ${stroke(`stroke-width="2.2"`)}/>
        <path d="M-8,-8 Q8,4 22,-6" ${stroke(`stroke-width="2"`)}/>
        <ellipse cx="36" cy="-28" rx="6" ry="4" ${fill("#c49a00")}/>
      `;
    },
  }),

  /* ——— yeux ——— */
  part({
    id: "eyes-dots",
    category: "eyes",
    layer: "eyes",
    label: "points",
    rarity: "common",
    tags: ["round"],
    glyphBox: "-36 -16 72 32",
    draw() {
      return `${eye(-16, 0, 10, -1, 2)}${eye(16, 0, 10, 1, 2)}`;
    },
  }),
  part({
    id: "eyes-huge",
    category: "eyes",
    layer: "eyes",
    label: "énormes",
    rarity: "uncommon",
    tags: ["huge"],
    glyphBox: "-52 -28 104 56",
    draw() {
      return `
        ${eye(-20, 0, 22, -4, 4)}
        ${eye(20, 0, 22, 5, 4)}
        <path d="M-38,-16 q10,-10 22,-2" ${stroke(`stroke-width="2.2"`)}/>
        <path d="M16,-18 q12,-8 22,0" ${stroke(`stroke-width="2.2"`)}/>
      `;
    },
  }),
  part({
    id: "eyes-three",
    category: "eyes",
    layer: "eyes",
    label: "trois yeux",
    rarity: "rare",
    tags: ["three"],
    glyphBox: "-44 -28 88 48",
    draw() {
      return `${eye(-22, 6, 10)}${eye(22, 6, 10)}${eye(0, -12, 10, 0, 1)}`;
    },
  }),
  part({
    id: "eyes-sleepy",
    category: "eyes",
    layer: "eyes",
    label: "endormis",
    rarity: "common",
    tags: ["no-eyes", "sleepy"],
    glyphBox: "-36 -14 72 28",
    draw() {
      return `
        <path d="M-30,4 Q-16,-12 -2,4" ${stroke(`stroke-width="3.2"`)}/>
        <path d="M2,4 Q16,-12 30,4" ${stroke(`stroke-width="3.2"`)}/>
        <path d="M-26,-2 l-6,-8 M-16,-8 l0,-8 M-8,-2 l4,-8" ${stroke(`stroke-width="1.8"`)}/>
        <path d="M8,-2 l-4,-8 M16,-8 l0,-8 M26,-2 l6,-8" ${stroke(`stroke-width="1.8"`)}/>
      `;
    },
  }),
  part({
    id: "eyes-angry",
    category: "eyes",
    layer: "eyes",
    label: "fâchés",
    rarity: "uncommon",
    tags: ["angry"],
    glyphBox: "-40 -22 80 40",
    draw() {
      return `
        ${eye(-16, 8, 9, 1, 2)}
        ${eye(16, 8, 9, -1, 2)}
        <path d="M-30,-10 L-4,2" ${stroke(`stroke-width="3.4"`)}/>
        <path d="M30,-10 L4,2" ${stroke(`stroke-width="3.4"`)}/>
      `;
    },
  }),
  part({
    id: "eyes-unibrow",
    category: "eyes",
    layer: "eyes",
    label: "un sourcil",
    rarity: "uncommon",
    tags: ["unibrow"],
    glyphBox: "-40 -22 80 40",
    draw() {
      return `
        <path d="M-34,-6 Q0,-22 34,-6 Q0,-10 -34,-6Z" ${fill(C.charcoal)}/>
        ${eye(-14, 10, 8)}
        ${eye(14, 10, 8)}
      `;
    },
  }),

  /* ——— bouches ——— */
  part({
    id: "mouth-smile",
    category: "mouth",
    layer: "mouth",
    label: "sourire",
    rarity: "common",
    tags: ["smile"],
    glyphBox: "-28 -14 56 32",
    draw() {
      return `
        <path d="M-20,0 Q0,20 20,0 Q0,8 -20,0Z" ${fill(C.gum)}/>
        <rect x="-10" y="1" width="8" height="8" ${fill(C.white)}/>
        <rect x="2" y="1" width="8" height="8" ${fill(C.white)}/>
        <path d="M-20,0 Q0,20 20,0" ${stroke()}/>
      `;
    },
  }),
  part({
    id: "mouth-fangs",
    category: "mouth",
    layer: "mouth",
    label: "crocs",
    rarity: "uncommon",
    tags: ["fangs"],
    glyphBox: "-30 -8 60 36",
    draw() {
      return `
        <path d="M-22,-2 Q0,22 22,-2 Q0,6 -22,-2Z" ${fill(C.gum)}/>
        <polygon points="-14,0 -8,18 -2,0" ${fill(C.white)}/>
        <polygon points="14,0 8,18 2,0" ${fill(C.white)}/>
        <rect x="-4" y="0" width="8" height="6" ${fill(C.white)}/>
        <path d="M-22,-2 Q0,22 22,-2" ${stroke()}/>
      `;
    },
  }),
  part({
    id: "mouth-none",
    category: "mouth",
    layer: "mouth",
    label: "sans bouche",
    rarity: "common",
    tags: ["no-mouth"],
    glyphBox: "-24 -10 48 20",
    draw() {
      return "";
    },
    glyph() {
      return `<line x1="-14" y1="0" x2="14" y2="0" ${stroke()}/>`;
    },
  }),
  part({
    id: "mouth-zigzag",
    category: "mouth",
    layer: "mouth",
    label: "zigzag",
    rarity: "uncommon",
    tags: ["zigzag"],
    glyphBox: "-30 -16 60 32",
    draw() {
      return `
        <polyline points="-24,6 -14,-8 -4,10 6,-8 16,10 24,2" ${stroke(`stroke-width="3"`)}/>
        <circle cx="-18" cy="4" r="1.6" ${fill(INK)}/>
        <circle cx="18" cy="6" r="1.6" ${fill(INK)}/>
      `;
    },
  }),
  part({
    id: "mouth-tongue",
    category: "mouth",
    layer: "mouth",
    label: "langue",
    rarity: "uncommon",
    tags: ["tongue"],
    glyphBox: "-28 -10 56 40",
    draw() {
      return `
        <path d="M-20,-2 Q0,6 20,-2 Q8,24 -20,-2Z" ${fill(C.charcoal)}/>
        <path d="M-6,6 Q2,30 14,12 Q4,10 -6,6Z" ${fill(C.pink)}/>
        <path d="M2,10 q2,10 8,8" ${stroke(`stroke-width="1.8"`)}/>
      `;
    },
  }),
  part({
    id: "mouth-tiny-o",
    category: "mouth",
    layer: "mouth",
    label: "petite o",
    rarity: "common",
    tags: ["tiny", "o"],
    glyphBox: "-16 -16 32 32",
    draw() {
      return `
        <ellipse cx="0" cy="0" rx="9" ry="10" ${fill(C.charcoal)}/>
        <ellipse cx="0" cy="1" rx="5" ry="6" ${fill(C.gum)}/>
        <ellipse cx="-1" cy="-3" rx="2.2" ry="1.4" ${soft(C.white)} opacity="0.35"/>
      `;
    },
  }),

  /* ——— bras ——— */
  part({
    id: "arms-sticks",
    category: "arms",
    layer: "arms",
    label: "bâtons",
    rarity: "common",
    tags: ["sticks"],
    glyphBox: "-52 -8 60 68",
    hand: { x: -36, y: 48 },
    draw() {
      return `
        <path d="M0,0 Q-10,18 -28,36" ${stroke(`stroke-width="4.2"`)}/>
        <circle cx="-30" cy="40" r="8" ${fill(C.mustard)}/>
        <path d="M-34,36 l-12,-10" ${stroke(`stroke-width="2.4"`)}/>
        <path d="M-36,42 l-14,0" ${stroke(`stroke-width="2.4"`)}/>
        <path d="M-32,46 l-10,10" ${stroke(`stroke-width="2.4"`)}/>
      `;
    },
  }),
  part({
    id: "arms-claws",
    category: "arms",
    layer: "arms",
    label: "griffes",
    rarity: "uncommon",
    tags: ["claws"],
    glyphBox: "-62 -8 72 80",
    hand: { x: -48, y: 58 },
    draw() {
      return `
        <path d="M0,0 Q-12,16 -28,36" ${stroke(`stroke-width="4.6"`)}/>
        <circle cx="-30" cy="40" r="7" ${fill(C.tomato)}/>
        <polygon points="-34,36 -62,22 -40,42" ${fill(C.cream)}/>
        <polygon points="-38,44 -68,50 -36,52" ${fill(C.cream)}/>
        <polygon points="-32,50 -54,76 -26,54" ${fill(C.cream)}/>
      `;
    },
  }),
  part({
    id: "arms-none",
    category: "arms",
    layer: "arms",
    label: "sans bras",
    rarity: "common",
    tags: ["none"],
    glyphBox: "-24 -12 48 24",
    copies: 0,
    hand: { x: -30, y: 38 },
    draw() {
      return "";
    },
    glyph() {
      return `<line x1="-16" y1="0" x2="16" y2="0" ${stroke()}/>`;
    },
  }),
  part({
    id: "arms-many",
    category: "arms",
    layer: "arms",
    label: "plein de bras",
    rarity: "rare",
    tags: ["many"],
    copies: 3,
    angles: [-28, 8, 42],
    hand: { x: -34, y: 40 },
    glyphBox: "-52 -16 64 78",
    draw() {
      return `
        <path d="M0,0 Q-12,16 -28,32" ${stroke(`stroke-width="3.6"`)}/>
        <circle cx="-30" cy="36" r="6" ${fill(C.teal)}/>
        <path d="M-34,32 l-10,-8 M-36,38 l-12,2 M-32,42 l-8,8" ${stroke(`stroke-width="2.2"`)}/>
      `;
    },
    glyph() {
      return `
        <path d="M6,-8 Q-8,0 -24,8" ${stroke(`stroke-width="3"`)}/>
        <path d="M6,4 Q-10,18 -28,34" ${stroke(`stroke-width="3"`)}/>
        <path d="M4,14 Q-6,30 -16,46" ${stroke(`stroke-width="3"`)}/>
        <circle cx="-26" cy="10" r="4.5" ${fill(C.teal)}/>
        <circle cx="-30" cy="36" r="4.5" ${fill(C.teal)}/>
        <circle cx="-18" cy="48" r="4.5" ${fill(C.teal)}/>
      `;
    },
  }),
  part({
    id: "arms-tiny",
    category: "arms",
    layer: "arms",
    label: "bras minuscules",
    rarity: "uncommon",
    tags: ["tiny"],
    glyphBox: "-28 -8 36 36",
    hand: { x: -16, y: 18 },
    draw() {
      return `
        <path d="M0,0 L-10,10" ${stroke(`stroke-width="3.4"`)}/>
        <circle cx="-12" cy="13" r="5.5" ${fill(C.tomato)}/>
        <path d="M-15,10 l-7,-5 M-16,14 l-8,1 M-13,17 l-5,6" ${stroke(`stroke-width="2"`)}/>
      `;
    },
  }),
  part({
    id: "arms-noodle",
    category: "arms",
    layer: "arms",
    label: "nouilles",
    rarity: "uncommon",
    tags: ["noodle"],
    glyphBox: "-58 -8 68 110",
    hand: { x: -46, y: 96 },
    draw() {
      return `
        <path d="M0,0 Q-26,18 -12,34 T-38,58 T-16,80 T-44,98" ${stroke(`stroke-width="4"`)}/>
        <circle cx="-46" cy="100" r="7" ${fill(C.mustard)}/>
        <path d="M-50,96 l-10,-8 M-52,102 l-12,0 M-48,106 l-8,8" ${stroke(`stroke-width="2.2"`)}/>
      `;
    },
  }),

  /* ——— jambes ——— */
  part({
    id: "legs-stumps",
    category: "legs",
    layer: "legs",
    label: "moignons",
    rarity: "common",
    tags: ["stumps", "ground"],
    glyphBox: "-22 -4 44 48",
    draw() {
      return `
        <rect x="-10" y="0" width="20" height="22" rx="8" ${fill(C.charcoal)}/>
        <path d="M-16,20 h32 l4,12 h-40 z" ${fill(C.charcoal)}/>
        <path d="M-12,32 v6 M-2,32 v7 M8,32 v6" ${stroke(`stroke-width="2"`)}/>
      `;
    },
  }),
  part({
    id: "legs-long",
    category: "legs",
    layer: "legs",
    label: "jambes longues",
    rarity: "common",
    tags: ["tall", "ground"],
    glyphBox: "-28 -4 48 76",
    draw() {
      return `
        <path d="M2,0 Q-2,24 -6,46" ${stroke(`stroke-width="4.4"`)}/>
        <path d="M-20,50 h28 l6,12 h-40 z" ${fill(C.charcoal)}/>
        <ellipse cx="-6" cy="62" rx="16" ry="5" ${soft(INK)} opacity="0.12"/>
      `;
    },
  }),
  part({
    id: "legs-wheel",
    category: "legs",
    layer: "legs",
    label: "roue",
    rarity: "rare",
    tags: ["wheel"],
    single: true,
    glyphBox: "-44 -8 88 88",
    draw() {
      return `
        <circle cx="0" cy="38" r="34" ${fill(C.mustard)}/>
        <circle cx="0" cy="38" r="22" ${fill("#c49a00")}/>
        <circle cx="0" cy="38" r="10" ${fill(C.paper)}/>
        <path d="M0,38 L0,8 M0,38 L24,54 M0,38 L-24,54" ${stroke()}/>
        <circle cx="0" cy="38" r="4" ${fill(C.charcoal)}/>
      `;
    },
  }),
  part({
    id: "legs-hover",
    category: "legs",
    layer: "legs",
    label: "volant",
    rarity: "uncommon",
    tags: ["hover", "no-legs"],
    single: true,
    float: 18,
    glyphBox: "-56 -8 112 52",
    draw() {
      return `
        <ellipse cx="0" cy="22" rx="42" ry="7" ${stroke(`stroke-dasharray="8 5"`)}/>
        <ellipse cx="0" cy="32" rx="54" ry="8" ${stroke(`stroke-width="2" stroke-dasharray="4 7"`)}/>
        <circle cx="-18" cy="22" r="2.4" ${fill(C.teal)}/>
        <circle cx="18" cy="22" r="2.4" ${fill(C.teal)}/>
      `;
    },
  }),
  part({
    id: "legs-boots",
    category: "legs",
    layer: "legs",
    label: "bottes",
    rarity: "uncommon",
    tags: ["boots", "ground"],
    glyphBox: "-24 -4 52 64",
    draw() {
      return `
        <rect x="-8" y="0" width="16" height="26" rx="3" ${fill(C.charcoal)}/>
        <path d="M-12,24 h28 v8 h-6 l-8,-6 h-14 z" ${fill(C.tomato)}/>
        <path d="M-12,32 h28 v10 h-8 l-10,-6 h-10 z" ${fill("#8a2f28")}/>
        <path d="M-2,10 h8 M-2,16 h8" ${stroke(`stroke-width="1.8" stroke="${C.cream}"`)}/>
      `;
    },
  }),
  part({
    id: "legs-extra",
    category: "legs",
    layer: "legs",
    label: "jambe en trop",
    rarity: "rare",
    tags: ["extra-legs", "ground"],
    tripod: true,
    glyphBox: "-36 -4 72 64",
    draw() {
      return `
        <path d="M0,0 L0,38" ${stroke(`stroke-width="3.6"`)}/>
        <path d="M-12,38 h24 l4,10 h-32 z" ${fill(C.charcoal)}/>
        <path d="M-8,48 v5 M2,48 v6 M10,48 v5" ${stroke(`stroke-width="1.8"`)}/>
      `;
    },
    glyph() {
      return `
        <line x1="-16" y1="0" x2="-16" y2="36" ${stroke()}/>
        <line x1="0" y1="0" x2="0" y2="40" ${stroke()}/>
        <line x1="16" y1="0" x2="16" y2="36" ${stroke()}/>
        <ellipse cx="-16" cy="40" rx="7" ry="4" ${fill(C.charcoal)}/>
        <ellipse cx="0" cy="44" rx="7" ry="4" ${fill(C.charcoal)}/>
        <ellipse cx="16" cy="40" rx="7" ry="4" ${fill(C.charcoal)}/>
      `;
    },
  }),

  /* ——— plus ——— */
  part({
    id: "acc-hat",
    category: "accessory",
    layer: "accessory",
    label: "chapeau",
    rarity: "common",
    tags: ["hat"],
    slot: "crown",
    glyphBox: "-40 -36 80 48",
    draw() {
      return `
        <ellipse cx="0" cy="12" rx="38" ry="7" ${fill(C.charcoal)}/>
        <rect x="-16" y="-22" width="32" height="28" rx="3" ${fill(C.charcoal)}/>
        <ellipse cx="0" cy="-22" rx="16" ry="5" ${fill("#2a2722")}/>
        <path d="M-10,-10 h20" ${stroke(`stroke-width="2" stroke="${C.mustard}"`)}/>
      `;
    },
  }),
  part({
    id: "acc-horn",
    category: "accessory",
    layer: "accessory",
    label: "corne",
    rarity: "uncommon",
    tags: ["horn"],
    slot: "crown",
    glyphBox: "-18 -48 40 58",
    draw() {
      return `
        <path d="M-8,8 Q-20,-6 -4,-44 Q16,-16 14,8 Z" ${fill(C.cream)}/>
        <path d="M-2,-8 Q4,-20 2,-32" ${stroke(`stroke-width="2"`)}/>
        <ellipse cx="2" cy="6" rx="10" ry="4" ${fill("#d9c9a8")}/>
      `;
    },
  }),
  part({
    id: "acc-antenna",
    category: "accessory",
    layer: "accessory",
    label: "antenne",
    rarity: "uncommon",
    tags: ["antenna"],
    slot: "crown",
    glyphBox: "-16 -52 40 62",
    draw() {
      return `
        <path d="M0,6 Q-10,-8 4,-20 Q-8,-30 8,-40" ${stroke(`stroke-width="2.6"`)}/>
        <circle cx="10" cy="-42" r="8" ${fill(C.tomato)}/>
        <circle cx="13" cy="-45" r="2.4" ${soft(C.white)} opacity="0.55"/>
      `;
    },
  }),
  part({
    id: "acc-bowtie",
    category: "accessory",
    layer: "accessory",
    label: "nœud papillon",
    rarity: "common",
    tags: ["bowtie"],
    slot: "neck",
    glyphBox: "-32 -16 64 32",
    draw() {
      return `
        <polygon points="-28,0 -6,-14 -6,14" ${fill(C.tomato)}/>
        <polygon points="28,0 6,-14 6,14" ${fill(C.tomato)}/>
        <rect x="-6" y="-6" width="12" height="12" rx="2" ${fill(C.charcoal)}/>
        <path d="M-20,-4 q6,4 0,8 M20,-4 q-6,4 0,8" ${stroke(`stroke-width="1.8"`)}/>
      `;
    },
  }),
  part({
    id: "acc-mug",
    category: "accessory",
    layer: "accessory",
    label: "tasse",
    rarity: "rare",
    tags: ["mug"],
    slot: "hand",
    glyphBox: "-24 -28 52 56",
    draw() {
      return `
        <rect x="-16" y="-6" width="28" height="26" rx="4" ${fill(C.cream)}/>
        <path d="M12,-2 h10 a9,9 0 0 1 0,16 h-10" ${stroke()}/>
        <ellipse cx="-2" cy="-6" rx="14" ry="4" ${fill("#d9c9a8")}/>
        <path d="M-8,-6 c0,-12 8,-16 14,-8" ${stroke(`stroke-width="2"`)}/>
        <path d="M4,-6 c2,-10 10,-12 12,-4" ${stroke(`stroke-width="2"`)}/>
      `;
    },
  }),
  part({
    id: "acc-nothing",
    category: "accessory",
    layer: "accessory",
    label: "rien",
    rarity: "common",
    tags: ["nothing"],
    slot: "crown",
    glyphBox: "-24 -10 48 20",
    draw() {
      return "";
    },
    glyph() {
      return `<line x1="-16" y1="0" x2="16" y2="0" ${stroke()}/>`;
    },
  }),
];

const BY_ID = new Map(PARTS.map((p) => [p.id, p]));

export function getPart(id) {
  return BY_ID.get(id);
}

export function partsIn(category) {
  return PARTS.filter((p) => p.category === category);
}

export function resolveParts(state) {
  return {
    head: getPart(state.head),
    eyes: getPart(state.eyes),
    mouth: getPart(state.mouth),
    body: getPart(state.body),
    arms: getPart(state.arms),
    legs: getPart(state.legs),
    accessory: getPart(state.accessory),
  };
}

export function allTags(state) {
  const tags = new Set();
  for (const part of Object.values(resolveParts(state))) {
    if (!part) continue;
    for (const tag of part.tags) tags.add(tag);
  }
  return tags;
}
