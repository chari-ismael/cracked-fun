/* Toutes les collisions passent ici. Aucune collision dans le renderer. */

import { POINTS } from "./config.js";
import { STATE } from "./state.js";

export function resolveCollisions(game) {
  eatPellets(game);
  collideGhosts(game);
}

function eatAt(game, player) {
  if (!player) return;
  const { x, y } = player.tile;
  const kind = game.maze.eat(x, y);
  if (!kind) return;
  player.chomp = 1;
  if (kind === "pellet") {
    game.addScore(POINTS.pellet);
    game.audio.waka();
  } else {
    game.addScore(POINTS.power);
    game.pop(POINTS.power, player.actor.px, player.actor.py - 12);
    game.frightenAll();
    game.audio.power();
  }
  if (game.maze.pelletsLeft === 0) game.completeLevel();
}

function eatPellets(game) {
  eatAt(game, game.player);
  if (game.isCoop) eatAt(game, game.player2);
}

function hitsGhost(player, prev, g) {
  if (!player || !prev) return false;
  const p = player.actor.tile;
  const t = g.actor.tile;
  const same = t.x === p.x && t.y === p.y;
  const swapped = t.x === prev.x && t.y === prev.y && p.x === g.prevTile.x && p.y === g.prevTile.y;
  return same || swapped;
}

function collideGhosts(game) {
  if (game.status !== STATE.PLAYING) return;
  const pack = [{ p: game.player, prev: game.playerPrev }];
  if (game.isCoop && game.player2) pack.push({ p: game.player2, prev: game.player2Prev });
  for (const { p, prev } of pack) {
    for (const g of game.ghosts) {
      if (g.state === "inHouse" || g.state === "leaving" || g.state === "entering" || g.state === "eaten") continue;
      if (!hitsGhost(p, prev, g)) continue;
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
}
