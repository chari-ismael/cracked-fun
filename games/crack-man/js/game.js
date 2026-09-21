/* Machine à états + orchestration. Aucun setTimeout. */

import { STEP, TIMINGS, POINTS, PHASES, HEROES, PLAYER2_SPAWN } from "./config.js";
import { STATE } from "./state.js";
import { Maze } from "./maze.js";
import { Player } from "./player.js";
import { createGhosts } from "./ghost.js";
import { resolveCollisions } from "./collision.js";
import { findMap } from "./maps.js";
import { loadHighScore, saveHighScore, loadHero, saveHero, loadMapId, saveMapId, loadPlayMode, savePlayMode } from "./prefs.js";

export class Game {
  constructor({ assets, audio, ui }) {
    this.assets = assets;
    this.audio = audio;
    this.ui = ui;
    this.maze = new Maze();
    this.player = new Player(this.maze);
    this.player2 = null;
    this.ghosts = createGhosts(this.maze);
    this.mapId = loadMapId();
    this.playMode = loadPlayMode();
    this.status = STATE.TITLE;
    this.score = 0;
    this.high = loadHighScore();
    this.lives = 3;
    this.level = 1;
    this.timer = 0;
    this.frightTimer = 0;
    this.eatStreak = 0;
    this.phaseIndex = 0;
    this.phaseTimer = PHASES[0].duration;
    this.playerPrev = { x: 0, y: 0 };
    this.acc = 0;
    this.clock = 0;
    this.shake = 0;
    this.pops = [];
    this.hero = loadHero();
    this.netRole = "local";
    this.remoteGuest = false;
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
    this.ui.renderPicker(assets, HEROES);
    this.showPick();
  }

  get mapInfo() {
    return findMap(this.mapId);
  }

  setMap(id) {
    this.mapId = findMap(id).id;
    saveMapId(this.mapId);
    this.ui.highlightMap(this.mapId);
    this.ui.setMapName(this.mapInfo.name);
  }

  setPlayMode(mode) {
    if (mode !== "solo" && mode !== "coop" && mode !== "versus") return;
    this.playMode = mode;
    savePlayMode(mode);
    this.ui.highlightMode(mode);
    if (mode === "coop") this.ui.hint && (this.ui.hint.textContent = "P1 : ZQSD. P2 : flèches. Vous mangez ensemble.");
    if (mode === "versus") this.ui.hint && (this.ui.hint.textContent = "P1 (héros) : ZQSD. P2 (elmedhor) : flèches.");
    if (mode === "solo") this.ui.hint && (this.ui.hint.textContent = "Une map, un mode, un visage. Puis c’est parti.");
  }

  get heroInfo() {
    return HEROES[this.hero] || HEROES.s;
  }

  get phase() {
    return PHASES[this.phaseIndex].mode;
  }

  get speedMul() {
    return 1 + Math.min(this.level - 1, 6) * 0.04;
  }

  showPick() {
    this.status = STATE.PICK;
    this.ui.show("pick", "CRACK-MAN", "Une map, un mode, un visage. Puis c’est parti.", "C’est parti");
    this.ui.highlightPick(this.hero);
    this.ui.highlightMap(this.mapId);
    this.ui.highlightMode(this.playMode);
    this.ui.setMapName(this.mapInfo.name);
  }

  highlightHero(id) {
    if (!HEROES[id]) return;
    this.hero = id;
    this.ui.highlightPick(id);
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
  }

  start(heroId) {
    if (heroId && HEROES[heroId]) this.hero = heroId;
    saveHero(this.hero);
    this.audio.resume();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.pops = [];
    this.shake = 0;
    this.resetLevel();
    this.enterReady();
  }

  resetLevel() {
    this.maze.newLevel(this.level, this.mapId);
    this.player.respawn();
    this.ghosts.forEach((g) => {
      g.reset();
      g.controlled = this.playMode === "versus" && g.id === "red";
    });
    if (this.playMode === "coop") {
      this.player2 = this.player2 || new Player(this.maze);
      this.player2.maze = this.maze;
      this.player2.respawn(PLAYER2_SPAWN, "right");
    } else {
      this.player2 = null;
    }
    this.frightTimer = 0;
    this.eatStreak = 0;
    this.phaseIndex = 0;
    this.phaseTimer = PHASES[0].duration;
    this.pops = [];
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
  }

  enterReady() {
    this.status = STATE.READY;
    this.timer = TIMINGS.ready;
    this.player.respawn();
    this.player2?.respawn(PLAYER2_SPAWN, "right");
    this.ghosts.forEach((g) => {
      g.reset();
      g.controlled = this.playMode === "versus" && g.id === "red";
    });
    this.frightTimer = 0;
    this.eatStreak = 0;
    this.phaseIndex = 0;
    this.phaseTimer = PHASES[0].duration;
    this.ui.hide();
  }

  tick(dt) {
    if (this.remoteGuest) {
      this.clock += dt;
      this.updatePops(dt);
      return;
    }
    this.acc += dt;
    if (this.acc > 0.25) this.acc = 0.25;
    while (this.acc >= STEP) {
      this.update(STEP);
      this.acc -= STEP;
    }
  }

  update(dt) {
    this.clock += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3.2);
    this.updatePops(dt);

    if (this.status === STATE.PICK || this.status === STATE.TITLE || this.status === STATE.GAME_OVER) return;
    if (this.status === STATE.PAUSED) return;

    if (this.status === STATE.READY) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.status = STATE.PLAYING;
        this.ui.hide();
      }
      return;
    }

    if (this.status === STATE.DYING) {
      this.timer -= dt;
      this.player.deathT = 1 - Math.max(0, this.timer) / TIMINGS.dying;
      if (this.timer <= 0) {
        if (this.lives <= 0) this.enterGameOver(this.playMode === "versus" ? "ghost" : "ghosts");
        else this.enterReady();
      }
      return;
    }

    if (this.status === STATE.LEVEL_COMPLETE) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.level += 1;
        this.resetLevel();
        this.enterReady();
      }
      return;
    }

    if (this.status !== STATE.PLAYING) return;

    this.updatePhases(dt);
    if (this.frightTimer > 0) {
      this.frightTimer -= dt;
      if (this.frightTimer <= 0) {
        this.frightTimer = 0;
        for (const g of this.ghosts) {
          if (g.state === "frightened") g.state = this.phase;
        }
      }
    }

    this.playerPrev = { ...this.player.actor.tile };
    this.player2Prev = this.player2 ? { ...this.player2.actor.tile } : null;
    this.player.update(dt);
    this.player2?.update(dt);
    const ctx = { player: this.player, ghosts: this.ghosts, phase: this.phase, speedMul: this.speedMul };
    for (const g of this.ghosts) g.update(dt, ctx);
    resolveCollisions(this);
  }

  updatePops(dt) {
    for (let i = this.pops.length - 1; i >= 0; i -= 1) {
      this.pops[i].t -= dt;
      this.pops[i].y -= 28 * dt;
      if (this.pops[i].t <= 0) this.pops.splice(i, 1);
    }
  }

  pop(text, x, y) {
    this.pops.push({ text: String(text), x, y, t: 0.7 });
  }

  updatePhases(dt) {
    if (this.frightTimer > 0) return;
    const cur = PHASES[this.phaseIndex];
    if (cur.duration === Infinity) return;
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.phaseIndex = Math.min(this.phaseIndex + 1, PHASES.length - 1);
      this.phaseTimer = PHASES[this.phaseIndex].duration;
      const mode = this.phase;
      for (const g of this.ghosts) g.onPhaseChange(mode);
    }
  }

  applyInput(dir, slot = 0) {
    if (!dir) return;
    if (this.status !== STATE.PLAYING && this.status !== STATE.READY) return;
    if (slot === 0) {
      this.player.setDirection(dir);
      return;
    }
    if (this.playMode === "versus") {
      const hunter = this.ghosts.find((g) => g.controlled) || this.ghosts[0];
      hunter.actor.nextDir = dir;
      return;
    }
    this.player2?.setDirection(dir);
  }

  togglePause() {
    if (this.status === STATE.PLAYING) {
      this.status = STATE.PAUSED;
      this.ui.show("paused", "PAUSE", "Espace pour reprendre.", "");
    } else if (this.status === STATE.PAUSED) {
      this.status = STATE.PLAYING;
      this.ui.hide();
    }
  }

  addScore(n) {
    this.score += n;
    if (this.score > this.high) {
      this.high = this.score;
      saveHighScore(this.high);
    }
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
  }

  frightenAll() {
    this.frightTimer = Math.max(TIMINGS.frightMin, TIMINGS.frightBase - (this.level - 1) * TIMINGS.frightLevelDrop);
    this.eatStreak = 0;
    for (const g of this.ghosts) g.frighten();
  }

  eatGhost(g) {
    const pts = Math.min(POINTS.ghostMax, POINTS.ghostBase * 2 ** this.eatStreak);
    this.eatStreak += 1;
    this.addScore(pts);
    if (g) this.pop(pts, g.actor.px, g.actor.py - 10);
  }

  killPlayer() {
    if (this.status !== STATE.PLAYING) return;
    this.status = STATE.DYING;
    this.timer = TIMINGS.dying;
    this.player.deathT = 0;
    this.lives -= 1;
    this.shake = 1;
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
    this.audio.death();
  }

  completeLevel() {
    if (this.status !== STATE.PLAYING) return;
    this.status = STATE.LEVEL_COMPLETE;
    this.timer = TIMINGS.levelComplete;
    this.audio.level();
    this.ui.hide();
  }

  enterGameOver(winner) {
    this.status = STATE.GAME_OVER;
    if (this.playMode === "versus") {
      const hunt = winner === "ghost";
      this.ui.show("dead", hunt ? "le chasseur gagne" : `${this.heroInfo.name} s’est fait manger`, "Entrée pour une revanche.", "Revanche");
      return;
    }
    this.ui.show(
      "dead",
      `${this.heroInfo.name} s’est fait manger`,
      "Tes potes ont gagné. Entrée pour une revanche.",
      "Revanche",
    );
  }

  snapshot() {
    return {
      status: this.status,
      hero: this.hero,
      score: this.score,
      lives: this.lives,
      level: this.level,
      mapId: this.mapId,
      playMode: this.playMode,
      pellets: this.maze.pelletsLeft,
      player: { ...this.player.actor.tile, px: this.player.actor.px, py: this.player.actor.py, dir: this.player.actor.dir },
      player2: this.player2 ? { px: this.player2.actor.px, py: this.player2.actor.py, dir: this.player2.actor.dir } : null,
      ghosts: this.ghosts.map((g) => ({ id: g.id, state: g.state, ...g.actor.tile, px: g.actor.px, py: g.actor.py, dir: g.actor.dir })),
      fright: this.frightTimer,
    };
  }

  packNet() {
    return {
      t: "state",
      st: this.status,
      sc: this.score,
      lv: this.lives,
      le: this.level,
      fr: this.frightTimer,
      md: this.playMode,
      mp: this.mapId,
      hr: this.hero,
      p: [this.player.actor.px, this.player.actor.py, this.player.actor.dir, this.player.mouth],
      p2: this.player2 ? [this.player2.actor.px, this.player2.actor.py, this.player2.actor.dir, this.player2.mouth] : null,
      g: this.ghosts.map((gh) => [gh.actor.px, gh.actor.py, gh.actor.dir, gh.state]),
      grid: Array.from(this.maze.grid),
    };
  }

  applyNet(s) {
    if (!s || s.t !== "state") return;
    if (s.mp && s.mp !== this.maze.mapId) {
      this.mapId = s.mp;
      this.maze.newLevel(s.le || 1, s.mp);
    }
    this.playMode = s.md || this.playMode;
    this.status = s.st;
    this.score = s.sc;
    this.lives = s.lv;
    this.level = s.le;
    this.frightTimer = s.fr;
    if (s.hr) this.hero = s.hr;
    if (s.grid && s.grid.length === this.maze.grid.length) {
      this.maze.grid = Uint8Array.from(s.grid);
      this.maze.pellets = new Set();
      for (let i = 0; i < s.grid.length; i += 1) {
        if (s.grid[i] === 3 || s.grid[i] === 4) this.maze.pellets.add(i);
      }
    }
    placeActor(this.player.actor, s.p);
    if (s.p2) {
      if (!this.player2) this.player2 = new Player(this.maze);
      placeActor(this.player2.actor, s.p2);
    }
    s.g?.forEach((row, i) => {
      const gh = this.ghosts[i];
      if (!gh) return;
      placeActor(gh.actor, row);
      if (row[3]) gh.state = row[3];
    });
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
    if (this.status === STATE.PLAYING || this.status === STATE.READY) this.ui.hide();
    else if (this.status === STATE.GAME_OVER) this.enterGameOver();
    else if (this.status === STATE.PAUSED) this.ui.show("paused", "PAUSE", "", "");
  }
}

function placeActor(actor, row) {
  if (!actor || !row) return;
  actor.px = row[0];
  actor.py = row[1];
  actor.dir = row[2] || actor.dir;
}
