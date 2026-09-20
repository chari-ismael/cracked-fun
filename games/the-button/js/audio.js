export function createAudio() {
  let ctx = null;
  let dead = false;
  let reduced = false;

  function ac() {
    if (dead) return null;
    try {
      ctx = ctx || new AudioContext();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch {
      dead = true;
      return null;
    }
  }

  function blip(freq, dur, gain, type = "sine", slide = 0) {
    const a = ac();
    if (!a) return;
    try {
      const o = a.createOscillator();
      const g = a.createGain();
      const t = a.currentTime;
      const vol = reduced ? gain * 0.4 : gain;
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) {
        o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      }
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch {
      dead = true;
    }
  }

  return {
    setReduced(v) {
      reduced = v;
    },
    resume() {
      ac();
    },
    tap(n, kind) {
      const base = 310 + Math.min(n, 220) * 0.55;
      if (kind === "rare") {
        blip(base + 80, 0.07, 0.045, "triangle", 50);
        blip(base * 0.5, 0.12, 0.02, "sine", -30);
        return;
      }
      if (kind === "mile") {
        blip(base, 0.05, 0.04, "square", 20);
        blip(base * 1.5, 0.09, 0.028, "sine", 40);
        return;
      }
      const tex = n > 180 ? "triangle" : n > 40 ? "sine" : "sine";
      blip(base + (n % 7) * 6, 0.038, 0.032, tex, n > 250 ? 25 : 0);
    },
  };
}
