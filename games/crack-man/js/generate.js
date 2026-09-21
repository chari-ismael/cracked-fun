/* Générateur de labyrinthes Pac-Man : 28×31, symétrie gauche-droite,
   maison + tunnel figés, couloirs sculptés (growing tree) en haut et en bas. */

import { COLS, ROWS, PLAYER_SPAWN, HOUSE_EXIT_TILE } from "./config.js";

/* Même valeurs que CELL dans maze.js — pas d'import pour éviter le cycle. */
const VOID = 0;
const WALL = 1;
const EMPTY = 2;
const PELLET = 3;
const POWER = 4;
const DOOR = 5;
const HOUSE = 6;
const TUNNEL = 7;

const CHARS = {
  "#": WALL,
  ".": PELLET,
  o: POWER,
  " ": VOID,
  _: TUNNEL,
  "-": DOOR,
  H: HOUSE,
};

const WALK = new Set([EMPTY, PELLET, POWER, TUNNEL]);

/* Bande centrale classique : maison, porte, tunnel, encoches. Rows 9–19. */
const HOUSE_BAND = [
  "######.#####.##.#####.######",
  "     #.#####.##.#####.#     ",
  "     #.##..........##.#     ",
  "     #.##.###--###.##.#     ",
  "######.##.#HHHHHH#.##.######",
  "______....#HHHHHH#....______",
  "######.##.#HHHHHH#.##.######",
  "     #.##.########.##.#     ",
  "     #.##..........##.#     ",
  "     #.##.########.##.#     ",
  "######.##.########.##.######",
];

export const CLASSIC = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.#####.##.#####.######",
  "     #.#####.##.#####.#     ",
  "     #.##..........##.#     ",
  "     #.##.###--###.##.#     ",
  "######.##.#HHHHHH#.##.######",
  "______....#HHHHHH#....______",
  "######.##.#HHHHHH#.##.######",
  "     #.##.########.##.#     ",
  "     #.##..........##.#     ",
  "     #.##.########.##.#     ",
  "######.##.########.##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#..##........_.........##..#",
  "###.##.##.########.##.##.###",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const CRITICAL = new Set([
  "1,1", "12,1", "12,5", "1,5", "6,5", "1,3",
  "13,23", "14,23", "13,11", "14,11",
  "26,1", "15,1", "15,5", "26,5", "21,5", "26,3",
]);
for (let x = 1; x <= 12; x += 1) {
  CRITICAL.add(`${x},1`);
  CRITICAL.add(`${x},5`);
  CRITICAL.add(`${x},23`);
}
for (let y = 1; y <= 5; y += 1) {
  CRITICAL.add(`1,${y}`);
  CRITICAL.add(`12,${y}`);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function idx(x, y) {
  return y * COLS + x;
}

function inBounds(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

function mirrorX(x) {
  return COLS - 1 - x;
}

function houseBand(y) {
  return y >= 9 && y <= 19;
}

class Grid {
  constructor(fill = WALL) {
    this.a = new Uint8Array(COLS * ROWS);
    this.a.fill(fill);
  }

  get(x, y) {
    if (!inBounds(x, y)) return WALL;
    return this.a[idx(x, y)];
  }

  set(x, y, v) {
    if (!inBounds(x, y)) return;
    this.a[idx(x, y)] = v;
  }

  setBoth(x, y, v) {
    this.set(x, y, v);
    this.set(mirrorX(x), y, v);
  }

  walk(x, y) {
    return WALK.has(this.get(x, y));
  }
}

export function parseLayout(lines) {
  const g = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y += 1) {
    const row = lines[y];
    for (let x = 0; x < COLS; x += 1) {
      const cell = CHARS[row[x]];
      if (cell === undefined) throw new Error(`generate: caractère inconnu "${row[x]}"`);
      g[idx(x, y)] = cell;
    }
  }
  return g;
}

function applyRow(g, y, row) {
  for (let x = 0; x < COLS; x += 1) g.set(x, y, CHARS[row[x]]);
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function growingTree(g, rng, x0, x1, y0, y1, twist) {
  const cells = [];
  const yStart = y0 % 2 === 1 ? y0 : y0 + 1;
  const xStart = x0 % 2 === 1 ? x0 : x0 + 1;
  for (let y = yStart; y <= y1; y += 2) {
    for (let x = xStart; x <= x1; x += 2) {
      cells.push({ x, y });
    }
  }
  if (!cells.length) return;

  const inReg = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const start = cells[Math.floor(rng() * cells.length)];
  g.set(start.x, start.y, EMPTY);
  const stack = [start];

  while (stack.length) {
    const pickLast = rng() > twist;
    const i = pickLast ? stack.length - 1 : Math.floor(rng() * stack.length);
    const cur = stack[i];
    const neigh = [];
    for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!inReg(nx, ny)) continue;
      if (g.get(nx, ny) !== WALL) continue;
      neigh.push([nx, ny, cur.x + dx / 2, cur.y + dy / 2]);
    }
    if (!neigh.length) {
      stack.splice(i, 1);
      continue;
    }
    const [nx, ny, wx, wy] = neigh[Math.floor(rng() * neigh.length)];
    if (inReg(wx, wy)) g.set(wx, wy, EMPTY);
    g.set(nx, ny, EMPTY);
    stack.push({ x: nx, y: ny });
  }

  for (const c of cells) {
    if (g.get(c.x, c.y) !== WALL) continue;
    for (const [dx, dy] of shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]], rng)) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      const wx = c.x + dx / 2;
      const wy = c.y + dy / 2;
      if (inReg(nx, ny) && g.walk(nx, ny) && inReg(wx, wy)) {
        g.set(c.x, c.y, EMPTY);
        g.set(wx, wy, EMPTY);
        break;
      }
    }
  }
}

function addLoops(g, rng, x0, x1, y0, y1, n) {
  const walls = [];
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (g.get(x, y) !== WALL) continue;
      const horiz = x > x0 && x < x1 && g.walk(x - 1, y) && g.walk(x + 1, y);
      const vert = y > y0 && y < y1 && g.walk(x, y - 1) && g.walk(x, y + 1);
      if (horiz || vert) walls.push({ x, y });
    }
  }
  const picks = shuffle(walls, rng);
  for (let i = 0; i < Math.min(n, picks.length); i += 1) {
    g.set(picks[i].x, picks[i].y, EMPTY);
  }
}

function stampHouse(g) {
  for (let i = 0; i < HOUSE_BAND.length; i += 1) {
    applyRow(g, 9 + i, HOUSE_BAND[i]);
  }
}

function stampBorders(g) {
  for (let x = 0; x < COLS; x += 1) {
    g.set(x, 0, WALL);
    g.set(x, ROWS - 1, WALL);
  }
  for (let y = 0; y < ROWS; y += 1) {
    if (houseBand(y)) continue;
    g.set(0, y, WALL);
    g.set(COLS - 1, y, WALL);
  }
}

function forceArteries(g) {
  for (let x = 1; x <= 12; x += 1) {
    g.set(x, 1, EMPTY);
    g.set(x, 5, EMPTY);
  }
  for (let y = 1; y <= 8; y += 1) {
    g.set(1, y, EMPTY);
    g.set(6, y, EMPTY);
  }
  for (let y = 1; y <= 5; y += 1) g.set(12, y, EMPTY);
  g.set(1, 3, EMPTY);
  g.set(6, 5, EMPTY);
  g.set(6, 8, EMPTY);

  for (let x = 1; x <= 12; x += 1) {
    g.set(x, 20, EMPTY);
    g.set(x, 23, EMPTY);
    g.set(x, 29, EMPTY);
  }
  for (let y = 20; y <= 29; y += 1) {
    g.set(1, y, EMPTY);
    g.set(6, y, EMPTY);
  }
  for (let y = 20; y <= 23; y += 1) g.set(9, y, EMPTY);
  g.set(6, 20, EMPTY);
  g.set(9, 20, EMPTY);

  g.set(13, 5, EMPTY);
  g.set(13, 20, EMPTY);
  g.set(13, 29, EMPTY);
}

function stampSpawn(g) {
  g.set(13, 22, WALL);
  g.set(14, 22, WALL);
  g.set(13, 23, EMPTY);
  g.set(14, 23, EMPTY);
  for (let x = 6; x <= 12; x += 1) {
    if (g.get(x, 23) === WALL) g.set(x, 23, EMPTY);
  }
  g.set(12, 23, EMPTY);
  g.set(9, 23, EMPTY);
}

function mirrorLeft(g) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < 14; x += 1) {
      g.set(mirrorX(x), y, g.get(x, y));
    }
  }
}

function flood(g, start) {
  const seen = new Set();
  if (!g.walk(start.x, start.y)) return seen;
  const q = [{ x: start.x, y: start.y }];
  seen.add(`${start.x},${start.y}`);
  let head = 0;
  while (head < q.length) {
    const cur = q[head];
    head += 1;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      let nx = cur.x + dx;
      const ny = cur.y + dy;
      if (ny < 0 || ny >= ROWS) continue;
      nx = ((nx % COLS) + COLS) % COLS;
      const k = `${nx},${ny}`;
      if (seen.has(k) || !g.walk(nx, ny)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  return seen;
}

function walkableTiles(g) {
  const tiles = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (g.walk(x, y)) tiles.push({ x, y });
    }
  }
  return tiles;
}

function connected(g) {
  const all = walkableTiles(g);
  return flood(g, PLAYER_SPAWN).size === all.length;
}

function open2x2(g, x, y) {
  return g.walk(x, y) && g.walk(x + 1, y) && g.walk(x, y + 1) && g.walk(x + 1, y + 1);
}

function killCourtyards(g) {
  let changed = true;
  let guard = 0;
  while (changed && guard < 64) {
    changed = false;
    guard += 1;
    for (let y = 1; y < ROWS - 1; y += 1) {
      if (houseBand(y) || houseBand(y + 1)) continue;
      for (let x = 1; x < 14; x += 1) {
        if (!open2x2(g, x, y)) continue;
        const cands = [[x + 1, y + 1], [x, y + 1], [x + 1, y], [x, y]];
        for (const [cx, cy] of cands) {
          if (CRITICAL.has(`${cx},${cy}`) || houseBand(cy)) continue;
          const prev = g.get(cx, cy);
          if (prev === TUNNEL) continue;
          g.setBoth(cx, cy, WALL);
          if (connected(g)) {
            changed = true;
            break;
          }
          g.setBoth(cx, cy, prev);
        }
      }
    }
  }
}

function placePellets(g) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (g.get(x, y) === EMPTY) g.set(x, y, PELLET);
    }
  }
  g.set(13, 23, EMPTY);
  g.set(14, 23, EMPTY);
}

function placePowers(g) {
  const spots = [
    { x: 1, y: 3 },
    { x: 26, y: 3 },
    { x: 1, y: 26 },
    { x: 26, y: 26 },
  ];
  for (const s of spots) {
    let { x, y } = s;
    if (!g.walk(x, y) || g.get(x, y) === TUNNEL) {
      const found = nearestWalkInQuad(g, x, y);
      if (!found) continue;
      x = found.x;
      y = found.y;
    }
    g.set(x, y, POWER);
  }
}

function nearestWalkInQuad(g, tx, ty) {
  let best = null;
  let bestD = Infinity;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!g.walk(x, y) || g.get(x, y) === TUNNEL) continue;
      if (houseBand(y)) continue;
      const d = Math.abs(x - tx) + Math.abs(y - ty);
      if (d < bestD) {
        bestD = d;
        best = { x, y };
      }
    }
  }
  return best;
}

function countKind(g, kind) {
  let n = 0;
  for (let i = 0; i < g.a.length; i += 1) if (g.a[i] === kind) n += 1;
  return n;
}

function tunePellets(g, rng) {
  let pellets = countKind(g, PELLET) + countKind(g, POWER);
  const tryOpen = () => {
    const walls = [];
    for (let y = 1; y <= 8; y += 1) {
      for (let x = 1; x <= 12; x += 1) {
        if (g.get(x, y) !== WALL) continue;
        if (g.walk(x - 1, y) || g.walk(x + 1, y) || g.walk(x, y - 1) || g.walk(x, y + 1)) {
          walls.push({ x, y });
        }
      }
    }
    for (let y = 20; y <= 29; y += 1) {
      for (let x = 1; x <= 12; x += 1) {
        if (g.get(x, y) !== WALL) continue;
        if (g.walk(x - 1, y) || g.walk(x + 1, y) || g.walk(x, y - 1) || g.walk(x, y + 1)) {
          walls.push({ x, y });
        }
      }
    }
    const picks = shuffle(walls, rng);
    for (const p of picks) {
      if (pellets >= 240) break;
      g.setBoth(p.x, p.y, PELLET);
      if (!connected(g) || open2x2(g, p.x, p.y) || open2x2(g, p.x - 1, p.y) || open2x2(g, p.x, p.y - 1)) {
        g.setBoth(p.x, p.y, WALL);
        continue;
      }
      pellets = countKind(g, PELLET) + countKind(g, POWER);
    }
  };

  const tryClose = () => {
    const dots = [];
    for (let y = 1; y <= 8; y += 1) {
      for (let x = 1; x <= 12; x += 1) {
        if (g.get(x, y) !== PELLET) continue;
        if (CRITICAL.has(`${x},${y}`)) continue;
        dots.push({ x, y });
      }
    }
    for (let y = 20; y <= 29; y += 1) {
      for (let x = 1; x <= 12; x += 1) {
        if (g.get(x, y) !== PELLET) continue;
        if (CRITICAL.has(`${x},${y}`)) continue;
        dots.push({ x, y });
      }
    }
    const picks = shuffle(dots, rng);
    for (const p of picks) {
      if (pellets <= 300) break;
      const prev = g.get(p.x, p.y);
      g.setBoth(p.x, p.y, WALL);
      if (!connected(g)) {
        g.setBoth(p.x, p.y, prev);
        continue;
      }
      pellets = countKind(g, PELLET) + countKind(g, POWER);
    }
  };

  if (pellets < 240) tryOpen();
  if (pellets > 300) tryClose();
}

function wallWalkable(g) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (g.get(x, y) === WALL && g.walk(x, y)) return true;
    }
  }
  return false;
}

function validate(g) {
  if (wallWalkable(g)) return false;
  if (!g.walk(PLAYER_SPAWN.x, PLAYER_SPAWN.y)) return false;
  if (g.get(13, 22) !== WALL || g.get(14, 22) !== WALL) return false;
  if (!g.walk(HOUSE_EXIT_TILE.x, HOUSE_EXIT_TILE.y)) return false;
  if (g.get(13, 12) !== DOOR || g.get(14, 12) !== DOOR) return false;
  if (g.get(13, 14) !== HOUSE) return false;
  if (g.get(0, 14) !== TUNNEL || g.get(27, 14) !== TUNNEL) return false;
  for (let x = 0; x < COLS; x += 1) {
    if (g.get(x, 0) !== WALL || g.get(x, ROWS - 1) !== WALL) return false;
  }

  const pellets = [];
  let powers = 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const c = g.get(x, y);
      if (c === PELLET || c === POWER) pellets.push({ x, y });
      if (c === POWER) powers += 1;
    }
  }
  if (pellets.length < 240 || pellets.length > 300) return false;
  if (powers !== 4) return false;

  const reach = flood(g, PLAYER_SPAWN);
  if (!reach.has(`${HOUSE_EXIT_TILE.x},${HOUSE_EXIT_TILE.y}`)) return false;
  for (const t of pellets) {
    if (!reach.has(`${t.x},${t.y}`)) return false;
  }
  if (!g.walk(1, 1) || !g.walk(12, 1) || !g.walk(12, 5) || !g.walk(1, 5)) return false;
  return true;
}

function tryGenerate(seed, level) {
  const rng = mulberry32(seed);
  const g = new Grid(WALL);
  const twist = Math.min(0.55, 0.18 + (level - 1) * 0.06);
  const loops = level <= 1 ? 20 : Math.max(8, 22 - level * 2);

  growingTree(g, rng, 1, 13, 1, 8, twist);
  growingTree(g, rng, 1, 13, 20, 29, twist);
  addLoops(g, rng, 1, 13, 1, 8, loops);
  addLoops(g, rng, 1, 13, 20, 29, loops);
  forceArteries(g);
  stampSpawn(g);
  mirrorLeft(g);
  stampHouse(g);
  stampBorders(g);
  stampSpawn(g);
  g.set(14, 22, WALL);
  g.set(14, 23, EMPTY);
  g.set(13, 5, EMPTY);
  g.set(14, 5, EMPTY);
  g.set(13, 20, EMPTY);
  g.set(14, 20, EMPTY);
  g.set(13, 29, EMPTY);
  g.set(14, 29, EMPTY);
  killCourtyards(g);
  placePellets(g);
  placePowers(g);
  tunePellets(g, rng);
  ensurePlayable(g);
  if (!validate(g)) return null;
  return g.a;
}

function ensurePlayable(g) {
  for (let x = 1; x <= 12; x += 1) {
    if (!g.walk(x, 1)) g.setBoth(x, 1, PELLET);
    if (!g.walk(x, 5)) g.setBoth(x, 5, PELLET);
    if (!g.walk(x, 23)) g.setBoth(x, 23, PELLET);
  }
  for (let y = 1; y <= 5; y += 1) {
    if (!g.walk(1, y)) g.setBoth(1, y, PELLET);
    if (!g.walk(12, y)) g.setBoth(12, y, PELLET);
  }
  if (!g.walk(1, 3)) g.setBoth(1, 3, POWER);
  if (!g.walk(6, 5)) g.setBoth(6, 5, PELLET);
  g.set(13, 22, WALL);
  g.set(14, 22, WALL);
  g.set(13, 23, EMPTY);
  g.set(14, 23, EMPTY);
}

function perturbClassic(level) {
  const g = new Grid(WALL);
  g.a = parseLayout(CLASSIC);
  if (level <= 1) return g.a;
  const rng = mulberry32((Math.imul(level, 0x9e3779b9) + 17) >>> 0);
  const walls = [];
  for (let y of [2, 4, 6, 7, 21, 24, 25, 27, 28]) {
    for (let x = 2; x <= 12; x += 1) {
      if (g.get(x, y) === WALL && (g.walk(x - 1, y) || g.walk(x + 1, y) || g.walk(x, y - 1) || g.walk(x, y + 1))) {
        walls.push({ x, y });
      }
    }
  }
  const picks = shuffle(walls, rng).slice(0, 3 + (level % 3));
  for (const p of picks) {
    const prev = g.get(p.x, p.y);
    g.setBoth(p.x, p.y, PELLET);
    if (!validate(g)) g.setBoth(p.x, p.y, prev);
  }
  return g.a;
}

export function hashGrid(grid) {
  let h = 2166136261;
  for (let i = 0; i < grid.length; i += 1) {
    h ^= grid[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function gridToAscii(grid) {
  const rev = { 0: " ", 1: "#", 2: " ", 3: ".", 4: "o", 5: "-", 6: "H", 7: "_" };
  const lines = [];
  for (let y = 0; y < ROWS; y += 1) {
    let s = "";
    for (let x = 0; x < COLS; x += 1) s += rev[grid[idx(x, y)]] ?? "?";
    lines.push(s);
  }
  return lines.join("\n");
}

export function generateMaze(level) {
  const lvl = Math.max(1, level | 0);
  const baseSeed = (Math.imul(lvl, 0x9e3779b9) ^ 0x51ed270b) >>> 0;
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const seed = (baseSeed + Math.imul(attempt, 9973)) >>> 0;
    const grid = tryGenerate(seed, lvl);
    if (grid) return { grid, seed, fallback: false };
  }
  return { grid: perturbClassic(lvl), seed: 0, fallback: true };
}