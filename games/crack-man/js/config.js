/* Constantes du jeu. Toutes les vitesses sont en pixels/seconde. */

export const TILE = 16;
export const COLS = 28;
export const ROWS = 31;
export const WIDTH = COLS * TILE; // 448
export const HEIGHT = ROWS * TILE; // 496

/* Pas de simulation fixe : la logique tourne à 120 Hz quel que soit le FPS. */
export const STEP = 1 / 120;

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
/* Ordre de préférence classique en cas d'égalité de distance. */
export const TURN_ORDER = ["up", "left", "down", "right"];

export const SPEEDS = {
  player: 92,
  ghost: 84,
  ghostFright: 52,
  ghostTunnel: 50,
  eyes: 170,
  house: 60,
};

export const TIMINGS = {
  ready: 2.0,
  respawn: 1.2,
  dying: 1.4,
  levelComplete: 2.0,
  frightBase: 6.0,
  frightMin: 2.5,
  frightLevelDrop: 0.4,
  blinkWindow: 2.0,
};

/* Alternance scatter/chase (classique). Se réinitialise à chaque vie/niveau. */
export const PHASES = [
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 5 },
  { mode: "chase", duration: Infinity },
];

export const POINTS = { pellet: 10, power: 50, ghostBase: 200, ghostMax: 1600 };

export const PLAYER_SPAWN = { x: 13, y: 23 };

/* Maison des fantômes : porte en (13,12)-(14,12), sortie sur la case (13,11). */
export const HOUSE_EXIT_TILE = { x: 13, y: 11 };
export const HOUSE_EXIT_X = 13 * TILE + TILE / 2; // 216
export const HOUSE_EXIT_Y = 11 * TILE + TILE / 2; // 184
export const HOUSE_INSIDE_Y = 14 * TILE + TILE / 2; // 232

/* Héros jouables. On demande S ou B avant de lancer. */
export const HEROES = {
  s: { id: "s", name: "le S", file: "faces/le-s.png", color: "#e8b423", crop: { x: 0.50, y: 0.47, z: 1.88 } },
  b: { id: "b", name: "le B", file: "faces/le-b.png", color: "#d7b56a", crop: { x: 0.36, y: 0.48, z: 1.26 } },
};

/* crop : foyer yeux+bouche (0–1) + zoom. Plus z est bas, plus on voit le visage. */
export const CAST = {
  red: { name: "elmedhor", file: "faces/elmedhor.png", color: "#e23b32", crop: { x: 0.54, y: 0.46, z: 1.10 } },
  pink: { name: "pote rose", file: "faces/pote-rose.png", color: "#f08ab8", crop: { x: 0.51, y: 0.30, z: 1.28 } },
  cyan: { name: "pote cyan", file: "faces/pote-cyan.jpg", color: "#3db7c7", crop: { x: 0.50, y: 0.51, z: 2.28 } },
  orange: { name: "pote orange", file: "faces/pote-orange.png", color: "#e3922a", crop: { x: 0.47, y: 0.40, z: 2.05 } },
};

export const GHOST_DEFS = [
  { id: "red", personality: "chase", scatter: { x: 26, y: 1 }, spawn: { x: 13, y: 11 }, inHouse: false, exitDelay: 0 },
  { id: "pink", personality: "ambush", scatter: { x: 1, y: 1 }, spawn: { x: 13, y: 14 }, inHouse: true, exitDelay: 0.5 },
  { id: "cyan", personality: "flank", scatter: { x: 26, y: 29 }, spawn: { x: 11, y: 14 }, inHouse: true, exitDelay: 3.5 },
  { id: "orange", personality: "shy", scatter: { x: 1, y: 29 }, spawn: { x: 16, y: 14 }, inHouse: true, exitDelay: 6.5 },
];
