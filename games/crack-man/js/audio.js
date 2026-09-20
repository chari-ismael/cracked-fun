import { loadMuted, saveMuted } from "./prefs.js";

export class Audio {
  constructor() {
    this.ctx = null;
    this.wakaHigh = false;
    this.muted = loadMuted();
  }

  setMuted(muted) {
    this.muted = !!muted;
    saveMuted(this.muted);
    if (this.muted && this.ctx) {
      try { this.ctx.suspend(); } catch { /* ignore */ }
    } else if (!this.muted) {
      this.resume();
    }
  }

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  resume() {
    if (this.muted) return;
    try {
      this.ctx = this.ctx || new AudioContext();
      this.ctx.resume?.();
    } catch {
      /* ignore */
    }
  }

  beep(freq, dur, type = "square", gain = 0.04, delay = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime + delay;
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain, t);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.stop(t + dur);
    } catch {
      /* ignore */
    }
  }

  waka() {
    this.wakaHigh = !this.wakaHigh;
    this.beep(this.wakaHigh ? 540 : 380, 0.05, "square", 0.03);
  }

  power() {
    this.beep(220, 0.14, "sawtooth", 0.05);
  }

  eatGhost() {
    this.beep(660, 0.16, "triangle", 0.06);
  }

  death() {
    this.beep(110, 0.4, "sawtooth", 0.08);
  }

  level() {
    this.beep(520, 0.1, "square", 0.035);
    this.beep(740, 0.14, "square", 0.035, 0.1);
  }
}
