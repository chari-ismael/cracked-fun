/* Toutes les collisions passent ici. Aucune collision dans le renderer. */

import { POINTS } from "./config.js";
import { STATE } from "./state.js";

export function resolveCollisions(game) {
  eatPellets(game);
  collideGhosts(game);
}

function eatPellets(game) {
  const { x, y } = game.player.tile;
  const kind = game.maze.eat(x, y);
  if (!kind) return;
  game.player.chomp = 1;
  if (kind === "pellet") {
    game.addScore(POINTS.pellet);
    game.audio.waka();
  } else {
    game.addScore(POINTS.power);
    game.pop(POINTS.power, game.player.actor.px, game.player.actor.py - 12);
    game.frightenAll();
    game.audio.power();
  }
  if (game.maze.pelletsLeft === 0) game.completeLevel();
}

function collideGhosts(game) {
  if (game.status !== STATE.PLAYING) return;
  const p = game.player.actor.tile;
  const pPrev = game.playerPrev;
  for (const g of game.ghosts) {
    if (g.state === "inHouse" || g.state === "leaving" || g.state === "entering" || g.state === "eaten") continue;
    const t = g.actor.tile;
    const same = t.x === p.x && t.y === p.y;
    const swapped = t.x === pPrev.x && t.y === pPrev.y && p.x === g.prevTile.x && p.y === g.prevTile.y;
    if (!same && !swapped) continue;
    if (g.state === "frightened") {
      g.state = "eaten";
      game.eatGhost(g);
      game.audio.eatGhost();
    } else {
      game.killPlayer();
      return;
    }
  }
}
