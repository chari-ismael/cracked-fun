import { beatFor, proceduralBeat, rareKind, AUTHORED_MAX, TITLES, DIALOGS } from "./catalog.js";
import { TITLE, eraOf, pick, rngAt } from "./state.js";
import { placeStamp } from "./stamps.js";

const SKY = {
  void: "#ffffff",
  marks: "#ffffff",
  land: "#d7eef8",
  life: "#cfe4f4",
  town: "#c6e4f2",
  dense: "#c6e4f2",
  beast: "#c9dff0",
  max: "#bfd8ec",
  globe: "#140f12",
  inf: "#0e0c10",
};

function setText(el, value) {
  if (el.textContent !== value) el.textContent = value;
}

export function createRenderer(stage, els) {
  let captionTimer = 0;
  let danceTimer = 0;

  function parentFor(beat) {
    return stage.getLayer(beat.layer);
  }

  function extras(beat, ctx) {
    const rng = rngAt(ctx.state, beat.n, 4);
    if (beat.flag === "sky") {
      stage.add(
        "sky",
        stage.el("rect", {
          x: 0,
          y: 0,
          width: 1200,
          height: 400,
          fill: "url(#pat-cloud)",
          opacity: "0.14",
          stroke: "none",
          class: "sky-tex",
        }),
      );
    }
    if (beat.flag === "night") {
      for (let i = 0; i < 12; i++) {
        placeStamp(stage.getLayer("sky"), "star", {
          n: beat.n,
          x: 40 + rng() * 1120,
          y: 24 + rng() * 180,
          s: 0.35 + rng() * 0.5,
          rot: rng() * 40,
        });
      }
    }
    if (beat.flag === "creature") {
      placeStamp(stage.getLayer("ground"), "crack", {
        n: beat.n,
        x: 600,
        y: 430,
        s: 1.35,
      });
      for (let i = 0; i < 6; i++) {
        placeStamp(stage.getLayer("under"), "scale", {
          n: beat.n,
          x: 80 + i * 180 + rng() * 40,
          y: 600 + rng() * 40,
          s: 1.4 + rng() * 0.8,
          rot: (rng() - 0.5) * 20,
          color: rng() > 0.5 ? "#6a8f6e" : "#4e6f55",
        });
      }
    }
    if (beat.flag === "globe") {
      for (let i = 0; i < 14; i++) {
        placeStamp(stage.getLayer("fx"), "snow", {
          n: beat.n,
          x: 200 + rng() * 800,
          y: 80 + rng() * 400,
          s: 0.6 + rng() * 0.7,
        });
      }
      for (let i = 0; i < 18; i++) {
        placeStamp(stage.getLayer("space"), "star", {
          n: beat.n,
          x: 30 + rng() * 1140,
          y: 20 + rng() * 640,
          s: 0.3 + rng() * 0.7,
          rot: rng() * 50,
        });
      }
    }
    if (beat.n === 9) {
      const far = stage.getLayer("far");
      const dirt = stage.el("rect", { x: 0, y: 402, width: 1200, height: 280, fill: "#cbb892", stroke: "none" });
      const tex = stage.el("rect", {
        x: 0,
        y: 402,
        width: 1200,
        height: 280,
        fill: "url(#pat-grass)",
        opacity: "0.22",
        stroke: "none",
      });
      far.insertBefore(dirt, far.firstChild);
      far.insertBefore(tex, dirt.nextSibling);
    }
  }

  function spawn(beat, ctx) {
    if (beat.hidden) return;
    const rng = rngAt(ctx.state, beat.n, 2);
    placeStamp(parentFor(beat), beat.stamp, {
      ...beat,
      rng,
    });
    extras(beat, ctx);
  }

  function say(ctx, text) {
    ctx.state.caption = text || "";
    setText(els.caption, ctx.state.caption);
    els.caption.classList.toggle("on", Boolean(text));
    window.clearTimeout(captionTimer);
    if (text) {
      captionTimer = window.setTimeout(() => {
        ctx.state.caption = "";
        setText(els.caption, "");
        els.caption.classList.remove("on");
      }, 2400);
    }
  }

  function applyFlags(ctx) {
    const s = ctx.state;
    const b = document.body;
    const era = eraOf(s.clicks);
    s.era = era;
    b.dataset.era = era;
    b.dataset.n = String(s.clicks);
    b.classList.toggle("is-sky", s.clicks >= 5);
    b.classList.toggle("is-land", s.clicks >= 9);
    b.classList.toggle("is-night", Boolean(s.flags.night));
    b.classList.toggle("is-creature", Boolean(s.flags.creature));
    b.classList.toggle("is-crown", Boolean(s.flags.crown));
    b.classList.toggle("is-globe", Boolean(s.flags.globe));
    b.classList.toggle("is-eclipse", Boolean(s.flags.eclipse));
    b.classList.toggle("is-dance", Boolean(s.flags.dance) && !ctx.reduced);
    b.classList.toggle("has-count", s.clicks >= 12);
    const sky = s.flags.night ? "#1b2438" : s.flags.globe ? SKY.globe : SKY[era] || "#ffffff";
    b.style.setProperty("--sky", sky);
    b.style.setProperty("--zoom", s.flags.globe ? "0.4" : "1");
    b.style.setProperty("--bx", `${s.btnX}px`);
    b.style.setProperty("--by", `${s.btnY}px`);
    b.style.setProperty("--press", s.pressed ? "0.97" : "1");
    if (els.theme) els.theme.content = s.flags.night ? "#1b2438" : s.flags.globe ? "#140f12" : "#ffffff";
  }

  function paint(ctx) {
    const s = ctx.state;
    document.body.style.setProperty("--press", s.pressed ? "0.97" : "1");
    document.body.style.setProperty("--bx", `${s.btnX}px`);
    document.body.style.setProperty("--by", `${s.btnY}px`);
    if (els.btn.dataset.pressed !== (s.pressed ? "1" : "0")) {
      els.btn.dataset.pressed = s.pressed ? "1" : "0";
    }
  }

  function apply(ctx) {
    const s = ctx.state;
    applyFlags(ctx);
    setText(els.count, s.clicks ? String(s.clicks) : "");
    setText(els.label, s.label);
    if (document.title !== s.title) document.title = s.title;
    const open = Boolean(s.dialog);
    els.dialog.hidden = !open;
    els.dialog.classList.toggle("open", open);
    if (open) setText(els.dialogBody, s.dialog);
  }

  function setFlagFromBeat(beat, state) {
    if (beat.flag === "sky") state.flags.sky = true;
    if (beat.flag === "shadow") state.flags.shadow = true;
    if (beat.flag === "night") {
      state.flags.night = true;
      state.flags.moon = false;
    }
    if (beat.flag === "dayMoon") {
      state.flags.night = false;
      state.flags.moon = true;
    }
    if (beat.flag === "creature") state.flags.creature = true;
    if (beat.flag === "crown") {
      state.flags.crown = true;
      state.label = "ok";
    }
    if (beat.flag === "globe") {
      state.flags.globe = true;
      state.label = ".";
    }
    if (beat.flag === "traffic") state.flags.traffic = true;
    if (beat.flag === "window") state.flags.window = true;
  }

  function runRare(kind, ctx, beat) {
    const s = ctx.state;
    const rng = rngAt(s, s.clicks, 21);
    if (kind === "eclipse") {
      s.flags.eclipse = true;
      placeStamp(stage.getLayer("sky"), "eclipse", { n: s.clicks, x: 210, y: 128, s: 1.05 });
      window.setTimeout(() => {
        s.flags.eclipse = false;
        apply(ctx);
      }, 1800);
      return "mile";
    }
    if (kind === "dance") {
      s.flags.dance = true;
      window.clearTimeout(danceTimer);
      danceTimer = window.setTimeout(() => {
        s.flags.dance = false;
        apply(ctx);
      }, 1400);
      return "rare";
    }
    if (kind === "face") {
      placeStamp(stage.getLayer("proc2"), "face", {
        n: s.clicks,
        x: 600,
        y: 220,
        s: 2.4 + rng() * 0.6,
      });
      return "rare";
    }
    if (kind === "teleport") {
      const ang = rng() * Math.PI * 2;
      s.btnX = Math.cos(ang) * 40;
      s.btnY = Math.sin(ang) * 40;
      return "rare";
    }
    if (kind === "title") {
      s.title = pick(rng, TITLES);
      return "rare";
    }
    if (kind === "dialog") {
      s.dialog = pick(rng, DIALOGS);
      return "rare";
    }
    return beat?.mile ? "mile" : "tap";
  }

  function step(ctx, opts = {}) {
    const s = ctx.state;
    s.clicks += 1;
    const rng = rngAt(s, s.clicks, 1);
    const beat =
      s.clicks <= AUTHORED_MAX ? beatFor(s.clicks, rng) : proceduralBeat(s.clicks, rng);
    setFlagFromBeat(beat, s);
    spawn(beat, ctx);
    const rare = rareKind(s.clicks);
    let kind = beat.mile ? "mile" : "tap";
    if (rare && !opts.silent) kind = runRare(rare, ctx, beat);
    if (beat.caption && !opts.silent) say(ctx, beat.caption);
    if (s.clicks >= 250) s.label = ".";
    else if (s.flags.crown) s.label = "ok";
    apply(ctx);
    return kind;
  }

  function reset(ctx) {
    stage.clear();
    const s = ctx.state;
    s.clicks = 0;
    s.flags = Object.create(null);
    s.btnX = 0;
    s.btnY = 0;
    s.caption = "";
    s.label = "ok";
    s.title = TITLE;
    s.dialog = null;
    s.era = "void";
    window.clearTimeout(captionTimer);
    window.clearTimeout(danceTimer);
    apply(ctx);
  }

  function jump(ctx, n) {
    const seed = ctx.state.seed;
    reset(ctx);
    ctx.state.seed = seed;
    const target = Math.max(0, Math.floor(n));
    for (let i = 0; i < target; i++) step(ctx, { silent: true });
    apply(ctx);
  }

  return { spawn, paint, apply, step, reset, jump, say };
}
