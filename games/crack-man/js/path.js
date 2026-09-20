/* Plus court chemin sur la grille (BFS). Gère le wrap du tunnel. */

import { COLS, ROWS, DIRS, TURN_ORDER } from "./config.js";

/* Premier pas d'un plus court chemin. `forbid` exclut un premier coup (anti-reverse). */
export function nextDirOnPath(maze, from, to, forbid = null) {
  if (from.x === to.x && from.y === to.y) return null;
  const key = (x, y) => `${x},${y}`;
  const goalX = ((to.x % COLS) + COLS) % COLS;
  const goalY = Math.max(0, Math.min(ROWS - 1, to.y));
  const goal = key(goalX, goalY);
  const startX = ((from.x % COLS) + COLS) % COLS;
  const start = key(startX, from.y);
  const seen = new Set([start]);
  const q = [{ x: startX, y: from.y, first: null }];
  let head = 0;
  while (head < q.length) {
    const cur = q[head];
    head += 1;
    for (const dir of TURN_ORDER) {
      if (cur.first === null && forbid && dir === forbid) continue;
      const v = DIRS[dir];
      let nx = cur.x + v.x;
      const ny = cur.y + v.y;
      if (ny < 0 || ny >= ROWS) continue;
      nx = ((nx % COLS) + COLS) % COLS;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      if (!maze.isWalkable(nx, ny) && k !== goal) continue;
      const first = cur.first || dir;
      if (k === goal) return first;
      seen.add(k);
      q.push({ x: nx, y: ny, first });
    }
  }
  return null;
}

/* Case praticable la plus proche (ambush / flank / scatter dans un mur). */
export function nearestWalkable(maze, tile) {
  let x = ((tile.x % COLS) + COLS) % COLS;
  let y = tile.y;
  if (y < 0) y = 0;
  if (y >= ROWS) y = ROWS - 1;
  if (maze.isWalkable(x, y)) return { x, y };
  const seen = new Set([`${x},${y}`]);
  const q = [{ x, y }];
  let head = 0;
  while (head < q.length) {
    const cur = q[head];
    head += 1;
    for (const dir of TURN_ORDER) {
      const v = DIRS[dir];
      let nx = ((cur.x + v.x) % COLS + COLS) % COLS;
      const ny = cur.y + v.y;
      if (ny < 0 || ny >= ROWS) continue;
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (maze.isWalkable(nx, ny)) return { x: nx, y: ny };
      q.push({ x: nx, y: ny });
    }
  }
  return { x, y };
}
