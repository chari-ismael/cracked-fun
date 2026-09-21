/* Le S : état, direction demandée, animation de mâchoire. */

import { Actor } from "./actor.js";
import { SPEEDS, PLAYER_SPAWN } from "./config.js";

export class Player {
  constructor(maze) {
    this.maze = maze;
    this.actor = new Actor(SPEEDS.player);
    this.mouth = 0;
    this.deathT = 0;
    this.chomp = 0;
    this.respawn();
  }

  respawn(spawn = PLAYER_SPAWN, facing = "left") {
    this.actor.place(spawn, facing);
    this.mouth = 0;
    this.deathT = 0;
    this.chomp = 0;
  }

  setDirection(dir) {
    this.actor.nextDir = dir;
  }

  update(dt) {
    this.actor.update(dt, (t) => this.maze.isWalkable(t.x, t.y));
    if (!this.actor.blocked) this.mouth += dt * 10;
    if (this.chomp > 0) this.chomp = Math.max(0, this.chomp - dt * 9);
  }

  get tile() {
    return this.actor.tile;
  }
}
