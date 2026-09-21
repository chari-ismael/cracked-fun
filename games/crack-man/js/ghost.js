/* Un fantôme : états stables, IA simple, sortie/entrée de maison scriptées. */

import { Actor } from "./actor.js";
import { nextDirOnPath, nearestWalkable } from "./path.js";
import {
  TILE, DIRS, OPPOSITE, TURN_ORDER, SPEEDS, CAST, GHOST_DEFS,
  HOUSE_EXIT_TILE, HOUSE_EXIT_X, HOUSE_EXIT_Y, HOUSE_INSIDE_Y,
} from "./config.js";

const NEAR = 0.6;

export class Ghost {
  constructor(def, maze) {
    this.id = def.id;
    this.personality = def.personality;
    this.scatter = def.scatter;
    this.spawn = def.spawn;
    this.startsInHouse = def.inHouse;
    this.exitDelay = def.exitDelay;
    this.color = CAST[def.id].color;
    this.name = CAST[def.id].name;
    this.maze = maze;
    this.actor = new Actor(SPEEDS.ghost);
    this.state = "scatter";
    this.exitTimer = 0;
    this.bounceDir = -1; // -1 = vers le haut dans la maison
    this.controlled = false;
    this.reset();
  }

  reset() {
    this.actor.place(this.spawn, this.startsInHouse ? "up" : "left");
    this.actor.speed = this.startsInHouse ? SPEEDS.house : SPEEDS.ghost;
    this.state = this.startsInHouse ? "inHouse" : "scatter";
    this.exitTimer = this.exitDelay;
    this.bounceDir = -1;
    this.prevTile = { ...this.actor.tile };
  }

  frighten() {
    if (this.state === "eaten" || this.state === "entering" || this.state === "inHouse" || this.state === "leaving") return;
    this.state = "frightened";
    this.reverse();
  }

  onPhaseChange(mode) {
    if (this.state === "chase" || this.state === "scatter") {
      this.state = mode;
      this.reverse();
    }
  }

  reverse() {
    const opp = OPPOSITE[this.actor.dir];
    this.actor.dir = opp;
    this.actor.nextDir = opp;
  }

  update(dt, ctx) {
    this.prevTile = { ...this.actor.tile };
    if (this.state === "inHouse") this.updateInHouse(dt);
    else if (this.state === "leaving") this.updateLeaving(dt, ctx.phase);
    else if (this.state === "entering") this.updateEntering(dt);
    else this.updateMaze(dt, ctx);
  }

  updateInHouse(dt) {
    this.exitTimer -= dt;
    const top = 13 * TILE + TILE / 2;
    const bot = 15 * TILE + TILE / 2;
    this.actor.py += this.bounceDir * SPEEDS.house * dt;
    if (this.actor.py <= top) {
      this.actor.py = top;
      this.bounceDir = 1;
    } else if (this.actor.py >= bot) {
      this.actor.py = bot;
      this.bounceDir = -1;
    }
    if (this.exitTimer <= 0) this.state = "leaving";
  }

  /* Monter au centre de la maison, puis sortir par la porte jusqu'à (13,11). */
  updateLeaving(dt, phase) {
    const speed = SPEEDS.house * dt;
    if (Math.abs(this.actor.px - HOUSE_EXIT_X) > NEAR) {
      this.actor.px += Math.sign(HOUSE_EXIT_X - this.actor.px) * Math.min(speed, Math.abs(HOUSE_EXIT_X - this.actor.px));
      return;
    }
    this.actor.px = HOUSE_EXIT_X;
    if (this.actor.py > HOUSE_EXIT_Y + NEAR) {
      this.actor.py -= Math.min(speed, this.actor.py - HOUSE_EXIT_Y);
      this.actor.dir = "up";
      return;
    }
    this.actor.py = HOUSE_EXIT_Y;
    this.actor.dir = "left";
    this.actor.nextDir = "left";
    this.state = phase === "chase" ? "chase" : "scatter";
    this.actor.speed = SPEEDS.ghost;
  }

  /* Yeux : descendre dans la maison puis en ressortir. */
  updateEntering(dt) {
    const speed = SPEEDS.eyes * dt;
    if (this.actor.py < HOUSE_INSIDE_Y - NEAR) {
      this.actor.px = HOUSE_EXIT_X;
      this.actor.py += Math.min(speed, HOUSE_INSIDE_Y - this.actor.py);
      this.actor.dir = "down";
      return;
    }
    this.actor.py = HOUSE_INSIDE_Y;
    const homeX = this.spawn.x * TILE + TILE / 2;
    if (Math.abs(this.actor.px - homeX) > NEAR) {
      this.actor.px += Math.sign(homeX - this.actor.px) * Math.min(speed, Math.abs(homeX - this.actor.px));
      return;
    }
    this.actor.px = homeX;
    this.exitTimer = 1.35;
    this.state = "inHouse";
    this.actor.speed = SPEEDS.house;
  }

  updateMaze(dt, ctx) {
    const t = this.actor.tile;
    const tunnel = this.maze.isTunnel(t.x, t.y);
    if (this.state === "eaten") this.actor.speed = SPEEDS.eyes;
    else if (this.state === "frightened") this.actor.speed = SPEEDS.ghostFright;
    else if (tunnel) this.actor.speed = SPEEDS.ghostTunnel;
    else this.actor.speed = SPEEDS.ghost * ctx.speedMul;

    if (this.state === "eaten" && this.actor.atCenter()) {
      if (this.actor.tileX === HOUSE_EXIT_TILE.x && this.actor.tileY === HOUSE_EXIT_TILE.y) {
        this.state = "entering";
        this.actor.px = HOUSE_EXIT_X;
        this.actor.py = HOUSE_EXIT_Y;
        return;
      }
    }

    if (this.actor.atCenter() && !this.controlled) this.chooseDir(ctx);
    this.actor.update(dt, (n) => this.maze.isWalkable(n.x, n.y));
  }

  chooseDir(ctx) {
    if (this.state === "eaten") {
      const step = nextDirOnPath(this.maze, this.actor.tile, HOUSE_EXIT_TILE);
      this.actor.nextDir = step || OPPOSITE[this.actor.dir];
      return;
    }
    const reverse = OPPOSITE[this.actor.dir];
    const options = TURN_ORDER.filter((dir) => {
      if (dir === reverse) return false;
      return this.maze.isWalkable(this.actor.neighbor(dir).x, this.actor.neighbor(dir).y);
    });
    if (!options.length) {
      this.actor.nextDir = reverse;
      return;
    }
    if (this.state === "frightened") {
      this.actor.nextDir = options[Math.floor(Math.random() * options.length)];
      return;
    }
    const goal = nearestWalkable(this.maze, this.target(ctx));
    const step = nextDirOnPath(this.maze, this.actor.tile, goal, reverse);
    this.actor.nextDir = step && options.includes(step) ? step : options[0];
  }

  target(ctx) {
    const p = ctx.player.actor;
    const pTile = p.tile;
    const v = DIRS[p.dir];
    if (this.state === "eaten") return HOUSE_EXIT_TILE;
    if (this.state === "scatter") return this.scatter;
    if (this.personality === "chase") return pTile;
    if (this.personality === "ambush") {
      return { x: pTile.x + v.x * 4, y: pTile.y + v.y * 4 };
    }
    if (this.personality === "flank") {
      const red = ctx.ghosts[0];
      const redOut = red && (red.state === "chase" || red.state === "scatter" || red.state === "frightened");
      if (!redOut) return pTile;
      const blinky = red.actor.tile;
      const pivot = { x: pTile.x + v.x * 2, y: pTile.y + v.y * 2 };
      return { x: pivot.x * 2 - blinky.x, y: pivot.y * 2 - blinky.y };
    }
    /* shy : poursuit si loin, sinon scatter. */
    const manh = Math.abs(this.actor.tileX - pTile.x) + Math.abs(this.actor.tileY - pTile.y);
    return manh > 8 ? pTile : this.scatter;
  }
}

export function createGhosts(maze) {
  return GHOST_DEFS.map((def) => new Ghost(def, maze));
}
