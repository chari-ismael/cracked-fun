/* File de commandes unique. Tous les contrôles envoient UP/DOWN/LEFT/RIGHT. */

const P1_KEYS = {
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  KeyZ: "up",
  KeyQ: "left",
};
const P2_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export class Input {
  constructor(canvas, padRoot) {
    this.split = false;
    this.queued = [null, null];
    this.held = [[], []];
    this.paused = false;
    this.touch0 = null;
    this._onKey = (e) => this.onKey(e);
    this._onKeyUp = (e) => this.onKeyUp(e);
    this._onPad = (e) => this.onPad(e);
    this._onTouchStart = (e) => this.onTouchStart(e);
    this._onTouchMove = (e) => this.onTouchMove(e);
    this._onTouchEnd = () => { this.touch0 = null; };

    window.addEventListener("keydown", this._onKey);
    window.addEventListener("keyup", this._onKeyUp);
    padRoot?.querySelectorAll("[data-dir]").forEach((btn) => {
      btn.addEventListener("pointerdown", this._onPad);
    });
    canvas.addEventListener("touchstart", this._onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", this._onTouchMove, { passive: true });
    canvas.addEventListener("touchend", this._onTouchEnd, { passive: true });
    this.canvas = canvas;
    this.padRoot = padRoot;
  }

  onKey(e) {
    if (e.code === "Space") {
      if (!e.repeat) {
        e.preventDefault();
        this.paused = true;
      }
      return;
    }
    const slot = this.slotFor(e.code);
    const dir = slot === 1 ? P2_KEYS[e.code] : P1_KEYS[e.code] || P2_KEYS[e.code];
    if (slot < 0 || !dir) return;
    e.preventDefault();
    this.queued[slot] = dir;
    this.held[slot] = this.held[slot].filter((d) => d !== dir);
    this.held[slot].push(dir);
    if (!this.split && slot === 0 && P2_KEYS[e.code]) {
      this.queued[0] = dir;
    }
  }

  slotFor(code) {
    if (this.split) {
      if (P1_KEYS[code]) return 0;
      if (P2_KEYS[code]) return 1;
      return -1;
    }
    if (P1_KEYS[code] || P2_KEYS[code]) return 0;
    return -1;
  }

  onKeyUp(e) {
    const slot = this.slotFor(e.code);
    const dir = P1_KEYS[e.code] || P2_KEYS[e.code];
    if (slot < 0 || !dir) return;
    this.held[slot] = this.held[slot].filter((d) => d !== dir);
  }

  onPad(e) {
    e.preventDefault();
    const dir = e.currentTarget.dataset.dir;
    if (dir) this.queued[0] = dir;
  }

  onTouchStart(e) {
    const t = e.changedTouches[0];
    this.touch0 = { x: t.clientX, y: t.clientY, used: false };
  }

  onTouchMove(e) {
    if (!this.touch0 || this.touch0.used) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touch0.x;
    const dy = t.clientY - this.touch0.y;
    if (Math.hypot(dx, dy) < 18) return;
    this.touch0.used = true;
    this.queued[0] = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  }

  consume(slot = 0) {
    const dir = this.queued[slot] || this.held[slot][this.held[slot].length - 1] || null;
    this.queued[slot] = null;
    return dir;
  }

  consumePause() {
    const p = this.paused;
    this.paused = false;
    return p;
  }
}
