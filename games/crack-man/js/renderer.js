/* Vue complète du labyrinthe. Aucune logique de jeu ici. */

import { TILE, WIDTH, HEIGHT, COLS, ROWS, CAST, DIRS } from "./config.js";
import { CELL } from "./maze.js";
import { STATE, GHOST } from "./state.js";
import { prefersReducedMotion } from "./prefs.js";

const BG = "#0d0c0a";
const FLOOR = "#1a1712";
const HOUSE_FLOOR = "#201c16";
const WALL_FILL = "#14110e";
const WALL = "#d4c19a";
const WALL_INNER = "#c4b089";
const PELLET = "#f0e2bc";
const POWER = "#f8f0d8";
const DOOR = "#e7a9b6";
const OUTSET = 3.25;
const INSET = 6.15;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.wallOuter = null;
    this.wallInner = null;
    this.mazeStamp = -1;
    this.floorTiles = [];
    this.houseTiles = [];
    this.wallTiles = [];
    this.doors = [];
    this.reduced = prefersReducedMotion();
    this.shakeX = 0;
    this.shakeY = 0;
    this._onResize = () => this.fit();
    this._onMotion = (e) => {
      this.reduced = e.matches;
    };
    this.fit();
    window.addEventListener("resize", this._onResize);
    try {
      this._motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      this._motion.addEventListener?.("change", this._onMotion);
    } catch {
      /* ignore */
    }
  }

  fit() {
    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    this.canvas.width = Math.round(WIDTH * dpr);
    this.canvas.height = Math.round(HEIGHT * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  invalidateMaze() {
    this.wallOuter = null;
    this.wallInner = null;
    this.mazeStamp = -1;
    this.floorTiles = [];
    this.houseTiles = [];
    this.wallTiles = [];
    this.doors = [];
  }

  ensureMaze(maze) {
    if (this.wallOuter && this.mazeStamp === maze.stamp) return;
    this.invalidateMaze();
    this.mazeStamp = maze.stamp;
    const loops = extractWallLoops(maze);
    this.wallOuter = loopsToPath(loops, maze, OUTSET);
    this.wallInner = loopsToPath(loops, maze, INSET);
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const t = maze.base[r * COLS + c];
        if (t === CELL.PELLET || t === CELL.POWER || t === CELL.EMPTY || t === CELL.TUNNEL) {
          this.floorTiles.push(c, r);
        } else if (t === CELL.HOUSE || t === CELL.DOOR) {
          this.houseTiles.push(c, r);
          if (t === CELL.DOOR) this.doors.push(c, r);
        } else if (t === CELL.WALL) {
          this.wallTiles.push(c, r);
        }
      }
    }
  }

  draw(game) {
    const { ctx } = this;
    this.ensureMaze(game.maze);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (game.shake > 0 && !this.reduced) {
      this.shakeX = (Math.random() - 0.5) * 5 * game.shake;
      this.shakeY = (Math.random() - 0.5) * 5 * game.shake;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    this.drawFloor();
    this.drawWalls();
    this.drawPellets(game);
    this.drawDoors();
    if (game.status === STATE.READY) this.drawBanner("PRÊT", WIDTH / 2, 20 * TILE + 4);
    if (game.status === STATE.LEVEL_COMPLETE) this.drawBanner("NIVEAU SUIVANT", WIDTH / 2, 20 * TILE + 4);
    for (const g of game.ghosts) this.drawGhost(g, game);
    if (game.status !== STATE.DYING || game.player.deathT < 0.92) {
      this.drawPlayer(game.player, game);
    }
    this.drawPops(game);
    this.drawLives(game);
    ctx.restore();
  }

  drawFloor() {
    const { ctx } = this;
    ctx.fillStyle = FLOOR;
    for (let i = 0; i < this.floorTiles.length; i += 2) {
      ctx.fillRect(this.floorTiles[i] * TILE, this.floorTiles[i + 1] * TILE, TILE, TILE);
    }
    ctx.fillStyle = HOUSE_FLOOR;
    for (let i = 0; i < this.houseTiles.length; i += 2) {
      ctx.fillRect(this.houseTiles[i] * TILE, this.houseTiles[i + 1] * TILE, TILE, TILE);
    }
  }

  drawWalls() {
    const { ctx } = this;
    ctx.fillStyle = WALL_FILL;
    for (let i = 0; i < this.wallTiles.length; i += 2) {
      ctx.fillRect(this.wallTiles[i] * TILE, this.wallTiles[i + 1] * TILE, TILE, TILE);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = WALL;
    ctx.lineWidth = 2.35;
    ctx.stroke(this.wallOuter);
    ctx.strokeStyle = WALL_INNER;
    ctx.lineWidth = 1.55;
    ctx.stroke(this.wallInner);
  }

  drawDoors() {
    const { ctx } = this;
    ctx.fillStyle = DOOR;
    for (let i = 0; i < this.doors.length; i += 2) {
      const x = this.doors[i] * TILE;
      const y = this.doors[i + 1] * TILE + TILE / 2 - 1;
      ctx.fillRect(x, y, TILE, 2);
    }
  }

  drawPellets(game) {
    const { ctx } = this;
    const t = game.clock;
    const pulse = this.reduced ? 5.35 : 5.2 + Math.sin(t * 5.2) * 0.55;
    ctx.fillStyle = PELLET;
    ctx.beginPath();
    for (const i of game.maze.pellets) {
      if (game.maze.grid[i] === CELL.POWER) continue;
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      const x = c * TILE + TILE / 2;
      const y = r * TILE + TILE / 2;
      ctx.moveTo(x + 2.55, y);
      ctx.arc(x, y, 2.55, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = POWER;
    for (const i of game.maze.pellets) {
      if (game.maze.grid[i] !== CELL.POWER) continue;
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      ctx.beginPath();
      ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBanner(text, x, y) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = "#f3e6c4";
    ctx.font = "700 14px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawLives(game) {
    const { ctx } = this;
    const n = Math.max(0, game.lives);
    for (let i = 0; i < n; i += 1) {
      const x = 18 + i * 16;
      const y = HEIGHT - 12;
      ctx.fillStyle = game.heroInfo.color;
      ctx.beginPath();
      ctx.arc(x, y, 5.2, 0.35, Math.PI * 2 - 0.35);
      ctx.lineTo(x, y);
      ctx.fill();
    }
  }

  drawPops(game) {
    const { ctx } = this;
    for (const p of game.pops) {
      const a = Math.max(0, Math.min(1, p.t / 0.7));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "#f6e7b8";
      ctx.font = "700 11px Segoe UI, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }

  drawPlayer(player, game) {
    const { ctx } = this;
    const a = player.actor;
    const info = game.heroInfo;
    const face = game.assets.faces[game.hero];
    const dying = game.status === STATE.DYING;
    const open = dying
      ? 0.16 + player.deathT * 0.9
      : 0.05 + (Math.sin(player.mouth) * 0.5 + 0.5) * (0.22 + player.chomp * 0.16);
    ctx.save();
    ctx.translate(a.px, a.py);
    if (a.dir === "left") ctx.scale(-1, 1);
    if (!this.reduced && !dying && !a.blocked) {
      const s = 1 + Math.sin(player.mouth * 2) * 0.02;
      ctx.scale(s, 2 - s);
    }
    drawSplitJaw(ctx, face, info, 22.8, this.reduced ? Math.min(open, 0.16) : open);
    ctx.restore();
  }

  drawGhost(g, game) {
    const { ctx } = this;
    const a = g.actor;
    const look = DIRS[a.dir] || DIRS.left;
    ctx.save();
    ctx.translate(a.px, a.py);

    const eyesOnly = g.state === GHOST.EATEN || g.state === GHOST.ENTERING;
    if (eyesOnly) {
      drawEyes(ctx, look, 1.15);
      ctx.restore();
      return;
    }

    const frightened = g.state === GHOST.FRIGHTENED;
    const blink = frightened && game.frightTimer < 2 && Math.floor(game.clock * 8) % 2 === 0;
    const rim = blink ? "#d9d3c6" : frightened ? "#2f4a8c" : g.color;

    ghostPath(ctx);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.save();
    ghostPath(ctx);
    ctx.clip();
    const face = game.assets.faces[g.id];
    if (face) drawCover(ctx, face, CAST[g.id]?.crop, 0, -2.0, 20.2);
    if (frightened) {
      ctx.fillStyle = blink ? "rgba(255,255,255,0.30)" : "rgba(22,42,96,0.40)";
      ctx.fillRect(-22, -24, 44, 46);
    }
    ctx.restore();

    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.05;
    ghostPath(ctx);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.lineWidth = 1.15;
    ghostPath(ctx);
    ctx.stroke();
    ctx.restore();
  }
}

function isSolidWall(maze, x, y) {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return false;
  return maze.cell(x, y) === CELL.WALL;
}

function extractWallLoops(maze) {
  const adj = new Map();
  const add = (x1, y1, x2, y2) => {
    const a = `${x1},${y1}`;
    const b = `${x2},${y2}`;
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push({ x: x2, y: y2, k: b });
    adj.get(b).push({ x: x1, y: y1, k: a });
  };

  for (let y = 0; y <= ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (isSolidWall(maze, x, y - 1) !== isSolidWall(maze, x, y)) add(x, y, x + 1, y);
    }
  }
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x <= COLS; x += 1) {
      if (isSolidWall(maze, x - 1, y) !== isSolidWall(maze, x, y)) add(x, y, x, y + 1);
    }
  }

  const used = new Set();
  const ekey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const loops = [];

  for (const [start, nbs] of adj) {
    for (const nb of nbs) {
      if (used.has(ekey(start, nb.k))) continue;
      const loop = [];
      let prev = start;
      let cur = start;
      let next = nb.k;
      let guard = 0;
      while (next && guard < 4096) {
        guard += 1;
        used.add(ekey(cur, next));
        const [cx, cy] = cur.split(",").map(Number);
        loop.push({ x: cx, y: cy });
        const candidates = (adj.get(next) || []).filter((n) => n.k !== cur && !used.has(ekey(next, n.k)));
        const chosen = pickNext(prev, cur, next, candidates);
        prev = cur;
        cur = next;
        next = chosen;
        if (cur === start) break;
      }
      if (loop.length >= 4) loops.push(loop);
    }
  }
  return loops;
}

function pickNext(prevKey, curKey, nextKey, candidates) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].k;
  const [px, py] = prevKey.split(",").map(Number);
  const [cx, cy] = curKey.split(",").map(Number);
  const [nx, ny] = nextKey.split(",").map(Number);
  const ix = nx - cx || cx - px;
  const iy = ny - cy || cy - py;
  let best = candidates[0];
  let bestScore = -1e9;
  for (const n of candidates) {
    const ox = n.x - nx;
    const oy = n.y - ny;
    const cross = ix * oy - iy * ox;
    const dot = ix * ox + iy * oy;
    const score = -cross * 10 + (dot > 0 ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best.k;
}

function insetVertex(vx, vy, maze, inset) {
  let sx = 0;
  let sy = 0;
  for (const [cx, cy] of [
    [vx - 1, vy - 1],
    [vx, vy - 1],
    [vx - 1, vy],
    [vx, vy],
  ]) {
    if (isSolidWall(maze, cx, cy)) {
      sx += cx + 0.5 - vx;
      sy += cy + 0.5 - vy;
    }
  }
  const ax = sx === 0 ? 0 : Math.sign(sx);
  const ay = sy === 0 ? 0 : Math.sign(sy);
  return { x: vx * TILE + ax * inset, y: vy * TILE + ay * inset };
}

function loopsToPath(loops, maze, inset) {
  const path = new Path2D();
  for (const loop of loops) {
    const pts = loop.map((v) => insetVertex(v.x, v.y, maze, inset));
    const n = pts.length;
    if (n < 3) continue;
    const mid = (i, j) => ({
      x: (pts[i].x + pts[j].x) / 2,
      y: (pts[i].y + pts[j].y) / 2,
    });
    const m0 = mid(n - 1, 0);
    path.moveTo(m0.x, m0.y);
    for (let i = 0; i < n; i += 1) {
      const m = mid(i, (i + 1) % n);
      path.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
    }
    path.closePath();
  }
  return path;
}

function ghostPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-17.5, 2);
  ctx.arc(0, -2.5, 17.5, Math.PI, 0, false);
  ctx.lineTo(17.5, 17);
  ctx.quadraticCurveTo(13.1, 12.2, 8.75, 17.2);
  ctx.quadraticCurveTo(4.4, 12.2, 0, 17.2);
  ctx.quadraticCurveTo(-4.4, 12.2, -8.75, 17.2);
  ctx.quadraticCurveTo(-13.1, 12.2, -17.5, 17);
  ctx.closePath();
}

function drawEyes(ctx, look, scale) {
  const ox = look.x * 2.2 * scale;
  const oy = look.y * 2.2 * scale;
  const r = 5.1 * scale;
  ctx.fillStyle = "#f6f3ea";
  ctx.beginPath();
  ctx.ellipse(-6.2 * scale, -2.2 * scale, r * 0.82, r, 0, 0, Math.PI * 2);
  ctx.ellipse(6.2 * scale, -2.2 * scale, r * 0.82, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a3f8f";
  ctx.beginPath();
  ctx.arc(-6.2 * scale + ox, -2.2 * scale + oy, 2.15 * scale, 0, Math.PI * 2);
  ctx.arc(6.2 * scale + ox, -2.2 * scale + oy, 2.15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawCover(ctx, img, crop, x, y, r) {
  const iw = img.width || 1;
  const ih = img.height || 1;
  const cx = (crop?.x ?? 0.5) * iw;
  const cy = (crop?.y ?? 0.5) * ih;
  const z = crop?.z ?? 1;
  const size = Math.min(iw, ih) / z;
  const scale = (r * 2) / size;
  ctx.drawImage(img, x - cx * scale, y - cy * scale, iw * scale, ih * scale);
}

function drawSplitJaw(ctx, img, info, r, open) {
  const mouthY = r * 0.22;
  const jaw = Math.min(open, 0.34);

  ctx.fillStyle = info.color;
  ctx.beginPath();
  ctx.arc(0, 0, r + 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1a140c";
  ctx.fill();
  ctx.clip();

  ctx.save();
  ctx.translate(0, mouthY);
  ctx.rotate(-jaw);
  ctx.translate(0, -mouthY);
  ctx.beginPath();
  ctx.rect(-r - 6, -r - 6, (r + 6) * 2, r + mouthY + 6);
  ctx.clip();
  if (img) drawCover(ctx, img, info.crop, 0, 0, r);
  ctx.restore();

  ctx.save();
  ctx.translate(0, mouthY);
  ctx.rotate(jaw);
  ctx.translate(0, -mouthY);
  ctx.beginPath();
  ctx.rect(-r - 6, mouthY, (r + 6) * 2, r + 10);
  ctx.clip();
  if (img) drawCover(ctx, img, info.crop, 0, 0, r);
  ctx.restore();
  ctx.restore();
}
