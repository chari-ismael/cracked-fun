/* Déplacement commun joueur/fantômes, verrouillé sur la grille.

   Invariants :
   - (px, py) est le CENTRE de l'acteur, en pixels monde.
   - La tuile est TOUJOURS dérivée de la position : floor(pos / TILE).
   - On se déplace sur un seul axe à la fois ; l'axe perpendiculaire est
     aligné sur le centre du couloir.
   - Les virages ne s'appliquent qu'aux centres de case ; le demi-tour est
     instantané n'importe où.
   - Aucun pas ne dépasse TILE/2 (garanti par le timestep fixe), donc on ne
     peut jamais "sauter" un centre de case. */

import { TILE, WIDTH, DIRS, OPPOSITE } from "./config.js";

const EPS = 0.01;

export class Actor {
  constructor(speed) {
    this.speed = speed;
    this.px = 0;
    this.py = 0;
    this.dir = "left";
    this.nextDir = "left";
    this.blocked = false;
  }

  place(tile, dir = "left") {
    this.px = tile.x * TILE + TILE / 2;
    this.py = tile.y * TILE + TILE / 2;
    this.dir = dir;
    this.nextDir = dir;
    this.blocked = false;
  }

  get tileX() {
    return Math.floor(this.px / TILE);
  }

  get tileY() {
    return Math.floor(this.py / TILE);
  }

  get tile() {
    return { x: this.tileX, y: this.tileY };
  }

  neighbor(dir) {
    const v = DIRS[dir];
    return { x: this.tileX + v.x, y: this.tileY + v.y };
  }

  atCenter() {
    return (
      Math.abs(this.px - (this.tileX * TILE + TILE / 2)) < EPS &&
      Math.abs(this.py - (this.tileY * TILE + TILE / 2)) < EPS
    );
  }

  snapToCenter() {
    this.px = this.tileX * TILE + TILE / 2;
    this.py = this.tileY * TILE + TILE / 2;
  }

  /* canEnter(tile) => bool, fourni par l'appelant (joueur/fantôme). */
  update(dt, canEnter) {
    /* Demi-tour instantané : légal partout (on vient de cette direction),
       sauf à l'arrêt pile au centre où l'on vérifie la case derrière. */
    if (this.nextDir === OPPOSITE[this.dir]) {
      if (!this.atCenter() || canEnter(this.neighbor(this.nextDir))) {
        this.dir = this.nextDir;
      }
    }

    let m = this.speed * dt;
    let guard = 8;
    while (m > EPS && guard > 0) {
      m = this.advance(m, canEnter);
      guard -= 1;
    }
    this.wrap();
  }

  advance(m, canEnter) {
    const v = DIRS[this.dir];

    /* Alignement strict sur l'axe perpendiculaire. */
    if (v.x !== 0) this.py = this.tileY * TILE + TILE / 2;
    else this.px = this.tileX * TILE + TILE / 2;

    const pos = v.x !== 0 ? this.px : this.py;
    const center = (v.x !== 0 ? this.tileX : this.tileY) * TILE + TILE / 2;
    const toCenter = (center - pos) * (v.x !== 0 ? v.x : v.y);

    if (toCenter > EPS) {
      /* Le centre de la case courante est devant : avancer jusqu'à lui max. */
      const step = Math.min(m, toCenter);
      this.move(v, step);
      this.blocked = false;
      return m - step;
    }

    if (toCenter > -EPS) {
      /* Pile au centre : point de décision. */
      if (this.nextDir !== this.dir && canEnter(this.neighbor(this.nextDir))) {
        this.dir = this.nextDir;
        return m; // on repart avec le nouvel axe
      }
      if (!canEnter(this.neighbor(this.dir))) {
        this.blocked = true;
        this.snapToCenter();
        return 0;
      }
      this.blocked = false;
      const step = Math.min(m, TILE / 2);
      this.move(v, step);
      return m - step;
    }

    /* Après le centre : course libre jusqu'au changement de case. */
    this.blocked = false;
    this.move(v, m);
    return 0;
  }

  move(v, dist) {
    this.px += v.x * dist;
    this.py += v.y * dist;
  }

  /* Tunnel : la position s'enroule en continu, pas de téléport visuel. */
  wrap() {
    if (this.px < 0) this.px += WIDTH;
    else if (this.px >= WIDTH) this.px -= WIDTH;
  }
}
