export const audio = {
  ctx: null,
  muted: false,

  resume() {
    if (this.muted) return;
    try {
      this.ctx = this.ctx || new AudioContext();
      this.ctx.resume?.();
    } catch {
      /* ignore */
    }
  },

  beep(freq, dur, type = "square", gain = 0.03) {
    if (this.muted || !this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch {
      /* ignore */
    }
  },

  open() {
    this.beep(620, 0.05, "square", 0.025);
  },

  close() {
    this.beep(220, 0.07, "square", 0.02);
  },

  tick() {
    this.beep(880, 0.03, "square", 0.018);
  },

  deny() {
    this.beep(140, 0.12, "sawtooth", 0.03);
  },

  boot() {
    this.beep(392, 0.08, "triangle", 0.03);
    this.beep(523, 0.1, "triangle", 0.03);
  },
};
