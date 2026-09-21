/* Grille du labyrinthe : source de vérité unique pour murs, pastilles, maison.
   28 colonnes x 31 lignes. Les colonnes s'enroulent (tunnel), les lignes non. */

import { COLS, ROWS } from "./config.js";
import { hashGrid } from "./generate.js";
import { findMap, gridFromMap } from "./maps.js";

export const CELL = {
  VOID: 0, // hors labyrinthe, infranchissable
  WALL: 1,
  EMPTY: 2, // couloir sans pastille
  PELLET: 3,
  POWER: 4,
  DOOR: 5, // porte de la maison : franchie uniquement en mouvement scripté
  HOUSE: 6, // intérieur de la maison : idem
  TUNNEL: 7, // couloir du tunnel (ralentit les fantômes)
};

export class Maze {
  constructor() {
    this.base = new Uint8Array(COLS * ROWS);
    this.stamp = 0;
    this.level = 1;
    this.mapId = "classic";
    this.newLevel(1, "classic");
  }

  /* Charge un labyrinthe pour ce niveau et cette map. */
  newLevel(level, mapId = this.mapId) {
    const map = findMap(mapId);
    this.mapId = map.id;
    this.base = gridFromMap(map, level);
    this.level = level;
    this.stamp += 1;
    this.reset();
  }

  hash() {
    return hashGrid(this.base);
  }

  reset() {
    this.grid = this.base.slice();
    this.pellets = new Set();
    for (let i = 0; i < this.grid.length; i += 1) {
      if (this.grid[i] === CELL.PELLET || this.grid[i] === CELL.POWER) this.pellets.add(i);
    }
  }

  get pelletsLeft() {
    return this.pellets.size;
  }

  cell(x, y) {
    if (y < 0 || y >= ROWS) return CELL.WALL;
    const wx = ((x % COLS) + COLS) % COLS;
    return this.grid[y * COLS + wx];
  }

  /* Praticable en mouvement normal (joueur ET fantômes) :
     la porte et la maison ne sont traversées qu'en mouvement scripté. */
  isWalkable(x, y) {
    const c = this.cell(x, y);
    return c === CELL.EMPTY || c === CELL.PELLET || c === CELL.POWER || c === CELL.TUNNEL;
  }

  isTunnel(x, y) {
    return this.cell(x, y) === CELL.TUNNEL;
  }

  /* Mange la pastille de la case. Retourne "pellet", "power" ou null. */
  eat(x, y) {
    if (y < 0 || y >= ROWS) return null;
    const wx = ((x % COLS) + COLS) % COLS;
    const i = y * COLS + wx;
    const c = this.grid[i];
    if (c === CELL.PELLET || c === CELL.POWER) {
      this.grid[i] = CELL.EMPTY;
      this.pellets.delete(i);
      return c === CELL.PELLET ? "pellet" : "power";
    }
    return null;
  }

  pelletTiles() {
    return [...this.pellets].map((i) => ({ x: i % COLS, y: Math.floor(i / COLS) }));
  }

  /* Aide aux tests : ne garde que certaines pastilles. */
  clearPelletsExcept(keep = []) {
    const keepSet = new Set(keep.map((t) => t.y * COLS + ((t.x % COLS) + COLS) % COLS));
    for (const i of [...this.pellets]) {
      if (!keepSet.has(i)) {
        this.grid[i] = CELL.EMPTY;
        this.pellets.delete(i);
      }
    }
  }
}
