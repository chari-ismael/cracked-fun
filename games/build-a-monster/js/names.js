import { detectCombo } from "./random.js";
import { resolveParts } from "./parts.js";

const HEAD_WORDS = {
  "head-round": ["Rondou", "Caboche", "Boubou"],
  "head-square": ["Pavé", "Tofu", "Caisse"],
  "head-long": ["Poteau", "Chevrot", "Girafe"],
  "head-onion": ["Oignon", "Bulbe", "Trognon"],
  "head-cube": ["Dé", "Caisson", "Bloc"],
  "head-banana": ["Banano", "Courbe", "Peau"],
};

const BODY_WORDS = {
  "body-blob": ["mou", "flasque", "patapouf"],
  "body-tall": ["perche", "fuseau", "lampadaire"],
  "body-tiny": ["pois", "miette", "bouchon"],
  "body-spiked": ["picot", "oursin", "cactus"],
  "body-rectangle": ["meuble", "carton", "placard"],
  "body-pear": ["poire", "gourde", "vase"],
};

const TRAITS = [
  { tag: "fangs", line: "sourit un peu trop" },
  { tag: "wheel", line: "roule au lieu de marcher" },
  { tag: "hover", line: "refuse le sol" },
  { tag: "mug", line: "toujours en pause café" },
  { tag: "three", line: "voit trois versions de toi" },
  { tag: "banana", line: "se pèle sous pression" },
  { tag: "no-eyes", line: "fait la sieste debout" },
  { tag: "antenna", line: "capte des trucs douteux" },
  { tag: "spiked", line: "mieux vaut pas le câliner" },
  { tag: "noodle", line: "les bras font ce qu’ils veulent" },
  { tag: "tongue", line: "goûte l’air, juge le monde" },
  { tag: "hat", line: "tient à son chapeau" },
  { tag: "horn", line: "un peu diable, beaucoup carton" },
  { tag: "boots", line: "prêt pour la flaque" },
  { tag: "extra-legs", line: "trébuche dans trois directions" },
  { tag: "many", line: "serre trop de mains à la fois" },
  { tag: "claws", line: "pas fait pour les poignées de main" },
  { tag: "unibrow", line: "un seul sourcil, trop d’opinions" },
  { tag: "angry", line: "grogne pour la forme" },
  { tag: "bowtie", line: "habillé sans raison" },
  { tag: "huge", line: "regarde trop fort" },
  { tag: "tiny-body", line: "la tête a mangé le reste" },
  { tag: "zigzag", line: "parle en éclairs" },
];

function hashState(state) {
  const key = [
    state.head,
    state.eyes,
    state.mouth,
    state.body,
    state.arms,
    state.legs,
    state.accessory,
  ].join("|");
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(list, salt) {
  return list[salt % list.length];
}

function fallbackName(state, salt) {
  const head = pick(HEAD_WORDS[state.head] || ["Monstre"], salt);
  const body = pick(BODY_WORDS[state.body] || ["bizarre"], salt >>> 3);
  let name = `${head}-${body}`;
  if (state.accessory === "acc-hat") name = `M. ${name}`;
  if (state.legs === "legs-wheel") name = `${name} roulant`;
  return name;
}

function fallbackTrait(parts, salt) {
  const tags = [];
  for (const piece of Object.values(parts)) {
    tags.push(...piece.tags);
  }
  const hits = TRAITS.filter((t) => tags.includes(t.tag));
  if (hits.length) return hits[salt % hits.length].line;
  return "ne sait pas trop ce qu’il est";
}

export function describeMonster(state) {
  const combo = detectCombo(state);
  if (combo) {
    return { name: combo.name, trait: combo.trait, combo: combo.id };
  }
  const salt = hashState(state);
  const parts = resolveParts(state);
  return {
    name: fallbackName(state, salt),
    trait: fallbackTrait(parts, salt),
    combo: null,
  };
}
