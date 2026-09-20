/* File de commandes unique. Tous les contrôles envoient UP/DOWN/LEFT/RIGHT. */

const KEY_TO_DIR = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  KeyZ: "up",
  KeyQ: "left",
};

export class Input {
  constructor(canvas, padRoot) {
    this.queued = null;
    this.held = [];
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
    const dir = KEY_TO_DIR[e.code];
    if (!dir) return;
    e.preventDefault();
    this.queued = dir;
    this.held = this.held.filter((d) => d !== dir);
    this.held.push(dir);
  }

  onKeyUp(e) {
    const dir = KEY_TO_DIR[e.code];
    if (!dir) return;
    this.held = this.held.filter((d) => d !== dir);
  }

  onPad(e) {
    e.preventDefault();
    const dir = e.currentTarget.dataset.dir;
    if (dir) this.queued = dir;
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
    this.queued = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  }

  consume() {
    const dir = this.queued || this.held[this.held.length - 1] || null;
    this.queued = null;
    return dir;
  }

  consumePause() {
    const p = this.paused;
    this.paused = false;
    return p;
  }
}
