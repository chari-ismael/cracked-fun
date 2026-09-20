import { Assets } from "./assets.js";
import { Audio } from "./audio.js";
import { Input } from "./input.js";
import { UI } from "./ui.js";
import { Renderer } from "./renderer.js";
import { Game } from "./game.js";
import { STATE } from "./state.js";
import { HEROES, COLS, ROWS } from "./config.js";
import { nextDirOnPath, nearestWalkable } from "./path.js";

document.documentElement.dataset.crack = "booting";

const canvas = document.getElementById("game");
const stage = document.getElementById("stage");
const muteBtn = document.getElementById("muteBtn");
const fullBtn = document.getElementById("fullBtn");
const assets = new Assets();
const audio = new Audio();
const ui = new UI();
const input = new Input(canvas, document.querySelector(".pad"));
const renderer = new Renderer(canvas);

let game;
let last = 0;

function syncMute() {
  if (!muteBtn) return;
  muteBtn.textContent = audio.muted ? "muet" : "son";
  muteBtn.setAttribute("aria-pressed", audio.muted ? "true" : "false");
}

function toggleFullscreen() {
  if (!stage) return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else stage.requestFullscreen?.();
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  if (game.status === STATE.PICK) {
    const dir = input.consume();
    if (dir === "left") game.highlightHero("s");
    else if (dir === "right") game.highlightHero("b");
    input.consumePause();
  } else {
    if (input.consumePause()) game.togglePause();
    const dir = input.consume();
    if (dir) game.applyInput(dir);
  }
  game.tick(dt);
  renderer.draw(game);
  requestAnimationFrame(loop);
}

function dispatch(cmd) {
  const g = game;
  switch (cmd.op) {
    case "playNow":
      g.start(cmd.hero || "s");
      g.status = STATE.PLAYING;
      g.ui.hide();
      return g.snapshot();
    case "start":
      g.start(cmd.hero);
      return g.snapshot();
    case "pick":
      g.highlightHero(cmd.hero);
      return g.snapshot();
    case "snapshot":
      return g.snapshot();
    case "dir":
      g.applyInput(cmd.dir);
      return { ...g.snapshot(), playerDir: g.player.actor.nextDir };
    case "update":
      for (let i = 0; i < (cmd.n || 1); i += 1) g.update(cmd.dt || 1 / 120);
      return extra(g, cmd);
    case "tick":
      for (let i = 0; i < (cmd.n || 1); i += 1) g.tick(cmd.dt || 1 / 30);
      return extra(g, cmd);
    case "placePlayer":
      g.player.actor.place({ x: cmd.x, y: cmd.y }, cmd.facing || "left");
      if (cmd.next) g.player.setDirection(cmd.next);
      return g.snapshot();
    case "placeGhost": {
      const gh = g.ghosts[cmd.i];
      if (cmd.state) gh.state = cmd.state;
      if (cmd.exitTimer != null) gh.exitTimer = cmd.exitTimer;
      gh.actor.place({ x: cmd.x, y: cmd.y }, cmd.facing || "left");
      return g.snapshot();
    }
    case "freezeGhosts":
      g.ghosts.forEach((gh) => {
        gh.state = "inHouse";
        gh.exitTimer = 99;
      });
      return g.snapshot();
    case "kill":
      g.killPlayer();
      return g.snapshot();
    case "set":
      if (cmd.score != null) g.score = cmd.score;
      if (cmd.lives != null) g.lives = cmd.lives;
      if (cmd.fright != null) g.frightTimer = cmd.fright;
      return g.snapshot();
    case "powerCell":
      g.maze.grid[cmd.i] = 4;
      g.maze.pellets.add(cmd.i);
      return g.snapshot();
    case "clearPelletsExcept":
      g.maze.clearPelletsExcept(cmd.tiles);
      return g.snapshot();
    case "simMove":
      return simMove(g, cmd);
    case "fpsCompare":
      return fpsCompare(g);
    case "wallLeaks":
      return wallLeaks(g);
    case "hasRun":
      return "undefined";
    case "mazeInfo":
      return mazeInfo(g);
    case "loadLevel":
      g.level = cmd.level || 1;
      g.resetLevel();
      g.status = STATE.PLAYING;
      g.ui.hide();
      return mazeInfo(g);
    case "ghostPick": {
      const gh = g.ghosts[cmd.i ?? 0];
      if (cmd.state) gh.state = cmd.state;
      if (cmd.x != null) gh.actor.place({ x: cmd.x, y: cmd.y }, cmd.facing || gh.actor.dir);
      const ctx = { player: g.player, ghosts: g.ghosts, phase: "chase", speedMul: 1 };
      gh.chooseDir(ctx);
      const raw = gh.target(ctx);
      const goal = nearestWalkable(g.maze, raw);
      return {
        nextDir: gh.actor.nextDir,
        tile: { ...gh.actor.tile },
        target: raw,
        goal,
        personality: gh.personality,
        state: gh.state,
      };
    }
    case "pathDir":
      return {
        dir: nextDirOnPath(
          g.maze,
          { x: cmd.fx, y: cmd.fy },
          { x: cmd.tx, y: cmd.ty },
          cmd.forbid || null,
        ),
      };
    default:
      throw new Error("unknown op");
  }
}

function extra(g, cmd) {
  const snap = g.snapshot();
  if (cmd.ghost === 0 || cmd.ghost) {
    const gh = g.ghosts[cmd.ghost];
    snap.ghostState = gh?.state;
    snap.ghostTile = gh ? { x: gh.actor.tileX, y: gh.actor.tileY } : null;
    snap.blocked = g.player.actor.blocked;
    snap.py = g.player.actor.py;
  }
  snap.blocked = g.player.actor.blocked;
  snap.py = g.player.actor.py;
  snap.playerDir = g.player.actor.nextDir;
  return snap;
}

function simMove(g, cmd) {
  const seen = new Set();
  let turns = 0;
  let lastDir = g.player.actor.dir;
  const marks = cmd.marks || [];
  for (let i = 0; i < cmd.n; i += 1) {
    const t = g.player.tile;
    seen.add(`${t.x},${t.y}`);
    for (const m of marks) {
      if (t.x === m.x && t.y === m.y) g.player.setDirection(m.dir);
    }
    g.update(1 / 120);
    if (g.player.actor.dir !== lastDir) {
      turns += 1;
      lastDir = g.player.actor.dir;
    }
  }
  return { tiles: seen.size, turns, tile: g.player.tile, hero: g.hero };
}

function fpsCompare(g) {
  g.ghosts.forEach((gh) => {
    gh.state = "inHouse";
    gh.exitTimer = 99;
  });
  g.player.actor.place({ x: 1, y: 5 }, "right");
  g.player.setDirection("right");
  const start = g.player.actor.px;
  for (let i = 0; i < 15; i += 1) g.tick(1 / 30);
  const d30 = g.player.actor.px - start;
  g.player.actor.place({ x: 1, y: 5 }, "right");
  g.player.setDirection("right");
  const start2 = g.player.actor.px;
  for (let i = 0; i < 60; i += 1) g.tick(1 / 120);
  const d120 = g.player.actor.px - start2;
  return { d30, d120, diff: Math.abs(d30 - d120) };
}

function wallLeaks(g) {
  let leaks = 0;
  for (let y = 0; y < 31; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      if (g.maze.grid[y * 28 + x] === 1 && g.maze.isWalkable(x, y)) leaks += 1;
    }
  }
  return leaks;
}

function mazeInfo(g) {
  const maze = g.maze;
  let wallWalk = 0;
  let walkable = 0;
  let powers = 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (maze.cell(x, y) === 1 && maze.isWalkable(x, y)) wallWalk += 1;
      if (maze.isWalkable(x, y)) walkable += 1;
      if (maze.cell(x, y) === 4) powers += 1;
    }
  }
  const spawn = { x: 13, y: 23 };
  const reach = new Set();
  const q = [];
  if (maze.isWalkable(spawn.x, spawn.y)) {
    q.push(spawn);
    reach.add("13,23");
  }
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
      if (reach.has(k) || !maze.isWalkable(nx, ny)) continue;
      reach.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  const pellets = maze.pelletTiles();
  let pelletsReachable = 0;
  let far = null;
  let farD = -1;
  for (const t of pellets) {
    if (reach.has(`${t.x},${t.y}`)) {
      pelletsReachable += 1;
      const d = Math.abs(t.x - spawn.x) + Math.abs(t.y - spawn.y);
      if (d > farD) {
        farD = d;
        far = t;
      }
    }
  }
  return {
    pellets: maze.pelletsLeft,
    powers,
    walkable,
    wallWalk,
    pelletsReachable,
    exitReach: reach.has("13,11"),
    far,
    pathToFar: !!(far && reach.has(`${far.x},${far.y}`)),
    hash: maze.hash(),
    level: g.level,
    stamp: maze.stamp,
    spawnWalk: maze.isWalkable(13, 23),
    exitWalk: maze.isWalkable(13, 11),
    wallAboveSpawn: maze.cell(13, 22) === 1,
  };
}

function boot() {
  game = new Game({ assets, audio, ui });
  window.CRACKED = {
    get game() { return game; },
    playNow(hero = "s") { return dispatch({ op: "playNow", hero }); },
    start: (hero) => dispatch({ op: "start", hero }),
    pick: (hero) => dispatch({ op: "pick", hero }),
    snapshot: () => dispatch({ op: "snapshot" }),
    dir: (d) => dispatch({ op: "dir", dir: d }),
  };
  const html = document.documentElement;
  html.dataset.crack = "ok";
  new MutationObserver(() => {
    const raw = html.dataset.crackCmd;
    if (!raw) return;
    html.dataset.crackCmd = "";
    let result = null;
    let error = null;
    try {
      result = dispatch(JSON.parse(raw));
    } catch (e) {
      error = String(e && e.message ? e.message : e);
    }
    html.dataset.crackOut = JSON.stringify({ result, error });
  }).observe(html, { attributes: true, attributeFilter: ["data-crack-cmd"] });
  last = performance.now();
  requestAnimationFrame(loop);
}

ui.picker?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-hero]");
  if (!btn) return;
  game.highlightHero(btn.dataset.hero);
});

ui.btn.addEventListener("click", () => {
  if (game.status === STATE.GAME_OVER || game.status === STATE.PICK) game.start();
});

ui.changeBtn?.addEventListener("click", () => game.showPick());

muteBtn?.addEventListener("click", () => {
  audio.toggle();
  syncMute();
});
fullBtn?.addEventListener("click", () => toggleFullscreen());

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM") {
    audio.toggle();
    syncMute();
  }
  if (e.code === "KeyF") toggleFullscreen();
  if (e.code === "Escape" && document.fullscreenElement) {
    document.exitFullscreen?.();
    e.preventDefault();
    return;
  }
  if (game.status === STATE.PICK) {
    if (e.code === "Digit1") game.highlightHero("s");
    if (e.code === "Digit2" || e.code === "KeyB") game.highlightHero("b");
    if (e.code === "Enter") game.start(game.hero);
    return;
  }
  if (e.code === "Enter" && game.status === STATE.GAME_OVER) game.start();
});

syncMute();
boot();
assets.load().then(() => ui.renderPicker(assets, HEROES)).catch(() => {});
