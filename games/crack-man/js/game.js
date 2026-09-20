/* Machine à états + orchestration. Aucun setTimeout. */

import { STEP, TIMINGS, POINTS, PHASES, HEROES } from "./config.js";
import { STATE } from "./state.js";
import { Maze } from "./maze.js";
import { Player } from "./player.js";
import { createGhosts } from "./ghost.js";
import { resolveCollisions } from "./collision.js";
import { loadHighScore, saveHighScore, loadHero, saveHero } from "./prefs.js";

export class Game {
  constructor({ assets, audio, ui }) {
    this.assets = assets;
    this.audio = audio;
    this.ui = ui;
    this.maze = new Maze();
    this.player = new Player(this.maze);
    this.ghosts = createGhosts(this.maze);
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
    this.ui.hud(this.score, this.high, this.level, this.lives, this.heroInfo.name);
    this.ui.renderPicker(assets, HEROES);
    this.showPick();
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
    this.ui.show("pick", "qui tu es ?", "Choisis le S ou le B, puis C’est parti.", "C’est parti");
    this.ui.highlightPick(this.hero);
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
    this.maze.newLevel(this.level);
    this.player.respawn();
    this.ghosts.forEach((g) => g.reset());
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
    this.ghosts.forEach((g) => g.reset());
    this.frightTimer = 0;
    this.eatStreak = 0;
    this.phaseIndex = 0;
    this.phaseTimer = PHASES[0].duration;
    this.ui.hide();
  }

  tick(dt) {
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
        if (this.lives <= 0) this.enterGameOver();
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
    this.player.update(dt);
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

  applyInput(dir) {
    if (!dir) return;
    if (this.status === STATE.PLAYING || this.status === STATE.READY) this.player.setDirection(dir);
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

  enterGameOver() {
    this.status = STATE.GAME_OVER;
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
      pellets: this.maze.pelletsLeft,
      player: { ...this.player.actor.tile, px: this.player.actor.px, py: this.player.actor.py, dir: this.player.actor.dir },
      ghosts: this.ghosts.map((g) => ({ id: g.id, state: g.state, ...g.actor.tile })),
      fright: this.frightTimer,
    };
  }
}
