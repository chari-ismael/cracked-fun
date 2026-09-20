import { el } from "./stage.js";

const INK = "#2a2622";

function ink(extra = {}) {
  return {
    fill: "none",
    stroke: INK,
    "stroke-width": 2.2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    ...extra,
  };
}

function fill(color, extra = {}) {
  return { fill: color, stroke: INK, "stroke-width": 1.85, "stroke-linejoin": "round", ...extra };
}

function line(x1, y1, x2, y2, extra = {}) {
  return el("line", { x1, y1, x2, y2, ...ink(extra) });
}

function circ(cx, cy, r, extra = {}) {
  return el("circle", { cx, cy, r, ...extra });
}

function rect(x, y, width, height, extra = {}) {
  return el("rect", { x, y, width, height, ...extra });
}

function path(d, extra = {}) {
  return el("path", { d, ...extra });
}

function ellipse(cx, cy, rx, ry, extra = {}) {
  return el("ellipse", { cx, cy, rx, ry, ...extra });
}

function txt(x, y, text, extra = {}) {
  return el("text", {
    x,
    y,
    text,
    fill: extra.fill || INK,
    "font-size": extra.size || 11,
    "font-family": extra.font || "Georgia, 'Times New Roman', serif",
    "text-anchor": extra.anchor || "middle",
    "font-weight": extra.weight || "700",
  });
}

function person(x, y, s, color, rng) {
  const g = el("g", { transform: `translate(${x} ${y}) scale(${s})` });
  const skin = color;
  g.append(
    circ(0, -11, 3.1, { fill: skin, stroke: INK, "stroke-width": 1.1 }),
    line(0, -8, 0, 1, { "stroke-width": 1.5 }),
    line(0, 1, -3.2, 9, { "stroke-width": 1.3 }),
    line(0, 1, 3.2, 9, { "stroke-width": 1.3 }),
    line(0, -5, -4.2, 0, { "stroke-width": 1.25 }),
    line(0, -5, 4.2, rng && rng() > 0.5 ? -1 : 1, { "stroke-width": 1.25 }),
  );
  return g;
}

export const STAMPS = {
  blot(g) {
    g.append(
      circ(0, 0, 9, { fill: INK }),
      circ(7, -4, 4.6, { fill: INK }),
      circ(-6, 3, 3.8, { fill: INK }),
      circ(3, 6, 2.6, { fill: INK }),
    );
  },
  dot(g) {
    STAMPS.blot(g);
  },
  line(g, o) {
    const w = o.len || 48;
    g.append(line(-w / 2, 0, w / 2, o.tilt || 5, { "stroke-width": 3.2 }));
  },
  horizon(g) {
    g.append(line(-560, 0, 560, 0, { "stroke-width": 2.4, opacity: 0.92 }));
  },
  sun(g) {
    g.append(
      circ(0, 0, 28, { fill: "#ffd056", stroke: INK, "stroke-width": 2 }),
      circ(8, -6, 8, { fill: "#ffe9a8", stroke: "none", opacity: 0.62 }),
    );
  },
  shadow(g) {
    g.append(ellipse(0, 0, 56, 12, { fill: "#2a2622", opacity: 0.22, stroke: "none" }));
  },
  pebble(g, o) {
    g.append(ellipse(0, 0, o.rx || 12, o.ry || 7.2, fill("#5c564c")));
  },
  grass(g, o) {
    const n = o.blades || 7;
    for (let i = 0; i < n; i++) {
      const x = (i - n / 2) * 5.4;
      const h = 16 + ((o.rng?.() || 0.4) * 14);
      g.append(path(`M ${x} 0 Q ${x - 3} ${-h / 2} ${x + 2} ${-h}`, ink({ stroke: "#2f5a2e", "stroke-width": 2.1 })));
    }
  },
  hill(g, o) {
    const w = o.w || 280;
    const h = o.h || 90;
    g.append(
      path(`M ${-w / 2} 20 Q 0 ${-h} ${w / 2} 20 Z`, fill(o.color || "#8fb889")),
      rect(-w / 2, 8, w, 36, { fill: "url(#pat-grass)", opacity: 0.28, stroke: "none" }),
    );
  },
  tree(g, o) {
    const c = o.color || "#3f7a46";
    g.append(
      rect(-5, -8, 10, 32, fill("#6b4a32")),
      ellipse(0, -32, 22, 20, fill(c)),
      ellipse(-12, -20, 14, 12, fill(o.color2 || "#2f5e38")),
      ellipse(12, -20, 15, 13, fill(c)),
    );
  },
  cloud(g) {
    g.append(
      ellipse(-20, 4, 28, 15, fill("#f4fbff", { "stroke-width": 1.5 })),
      ellipse(10, 2, 32, 17, fill("#ffffff", { "stroke-width": 1.5 })),
      ellipse(26, 7, 16, 11, fill("#eef7fc", { "stroke-width": 1.4 })),
    );
  },
  house(g, o) {
    const w = o.w || 62;
    const h = o.h || 42;
    g.append(
      rect(-w / 2, -h, w, h, fill(o.wall || "#f7f1e6")),
      rect(-w / 2, -h, w, h, { fill: "url(#pat-brick)", opacity: 0.32, stroke: "none" }),
      path(`M ${-w / 2 - 6} ${-h} L 0 ${-h - 22} L ${w / 2 + 6} ${-h} Z`, fill(o.roof || "#c45c4a")),
      rect(-6, -16, 12, 16, fill("#6b4a32")),
      rect(8, -h + 8, 10, 8, fill(o.win || "#b9d7ea")),
    );
  },
  chimney(g) {
    g.append(
      rect(-5, -18, 10, 18, fill("#8a5a48")),
      ellipse(2, -28, 7, 5, { fill: "#c5c5c5", opacity: 0.55, stroke: "none" }),
      ellipse(8, -38, 6, 4, { fill: "#d8d8d8", opacity: 0.4, stroke: "none" }),
    );
  },
  path(g) {
    g.append(path("M -10 0 Q 30 18 70 8 Q 130 0 210 22", ink({ stroke: "#8a7348", "stroke-width": 14, opacity: 0.9 })));
    g.append(path("M -10 0 Q 30 18 70 8 Q 130 0 210 22", ink({ stroke: "#c4a56e", "stroke-width": 8 })));
  },
  mailbox(g) {
    g.append(
      rect(-2, 0, 4, 22, fill("#4a4a4a")),
      rect(-14, -11, 24, 13, fill("#c45c4a")),
      rect(8, -8, 7, 4, fill("#e6d7a2")),
    );
  },
  bird(g, o) {
    const d = o.flip ? "M -16 0 Q -6 -12 0 0 Q 6 -12 16 0" : "M -18 3 Q -7 -10 0 1 Q 8 -11 18 0";
    g.append(path(d, ink({ "stroke-width": 2.4 })));
  },
  bush(g) {
    g.append(
      ellipse(0, 0, 20, 13, fill("#3e6f3a")),
      ellipse(-12, 3, 12, 9, fill("#2f5a2e")),
      ellipse(12, 4, 11, 8, fill("#4f7d4a")),
    );
  },
  fence(g) {
    for (let i = 0; i < 6; i++) {
      g.append(rect(i * 12, -14, 4, 18, fill("#d8c39a")));
    }
    g.append(rect(-4, -8, 72, 3, fill("#d8c39a")));
  },
  cat(g, o) {
    const c = o.color || "#3b3b3b";
    g.append(
      ellipse(0, 2, 12, 7, fill(c)),
      circ(10, -2, 5.5, fill(c)),
      path("M 7 -6 L 8 -12 L 11 -6 Z", fill(c)),
      path("M 10 -6 L 14 -12 L 15 -5 Z", fill(c)),
      path("M -12 0 Q -22 -10 -8 -2", ink({ stroke: c, "stroke-width": 1.6 })),
      circ(12, -3, 0.8, { fill: "#f2d66b" }),
    );
  },
  bike(g) {
    g.append(
      circ(-12, 6, 7, ink({ "stroke-width": 1.7 })),
      circ(12, 6, 7, ink({ "stroke-width": 1.7 })),
      path("M -12 6 L 0 0 L 12 6 M 0 0 L 0 -8 L 6 -8", ink({ "stroke-width": 1.5 })),
    );
  },
  laundry(g) {
    g.append(
      line(-28, 0, 28, 0, { "stroke-width": 1.2 }),
      rect(-18, 0, 10, 14, fill("#7eb6d6")),
      rect(-4, 0, 9, 12, fill("#f2c6d6")),
      rect(10, 0, 11, 15, fill("#f3e2a1")),
    );
  },
  satellite(g) {
    g.append(
      rect(-6, -4, 12, 8, fill("#cfd6dc")),
      rect(-18, -2, 12, 4, fill("#8aa4c0")),
      rect(6, -2, 12, 4, fill("#8aa4c0")),
      line(0, 4, 0, 14, { "stroke-width": 1.1 }),
    );
  },
  plane(g) {
    g.append(
      path("M -18 0 L 16 0 L 10 -4 Z", fill("#eef3f7")),
      line(-40, 6, -18, 0, { "stroke-width": 1.1, opacity: 0.45 }),
      line(-52, 8, -18, 1, { "stroke-width": 1, opacity: 0.28 }),
    );
  },
  lamp(g) {
    g.append(
      rect(-1.5, 0, 3, 34, fill("#5c5c5c")),
      path("M -8 0 L 8 0 L 5 -10 L -5 -10 Z", fill("#f0e2a2")),
      circ(0, -12, 6, { class: "lamp-glow", fill: "#ffe38a", opacity: 0, stroke: "none" }),
    );
  },
  moon(g) {
    g.append(
      circ(0, 0, 14, fill("#f3efe2")),
      circ(5, -3, 10, { fill: "var(--inner-sky, #cfe4f4)", stroke: "none" }),
    );
  },
  winlight(g) {
    g.append(rect(-6, -8, 12, 10, fill("#ffe38a")));
  },
  flower(g, o) {
    const c = o.color || "#e07a9a";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.append(circ(Math.cos(a) * 5, Math.sin(a) * 5 - 8, 3.1, fill(c, { "stroke-width": 1 })));
    }
    g.append(circ(0, -8, 2.2, fill("#f2d66b")), line(0, -4, 0, 8, { stroke: "#3f6b3e" }));
  },
  dog(g) {
    g.append(
      ellipse(0, 2, 11, 6, fill("#c4a574")),
      circ(10, -1, 4.5, fill("#c4a574")),
      ellipse(12, -4, 3, 2, fill("#c4a574")),
      line(-8, 6, -8, 12),
      line(4, 6, 4, 12),
    );
  },
  bench(g) {
    g.append(
      rect(-18, 0, 36, 5, fill("#8a5a32")),
      rect(-16, 5, 4, 12, fill("#6b4a32")),
      rect(12, 5, 4, 12, fill("#6b4a32")),
    );
  },
  pond(g) {
    g.append(ellipse(0, 0, 34, 12, fill("#8ec3d8", { opacity: 0.9 })));
  },
  gnome(g) {
    g.append(
      circ(0, 0, 5, fill("#f0c9a8")),
      path("M -6 -2 L 0 -16 L 6 -2 Z", fill("#c45c4a")),
      rect(-5, 4, 10, 8, fill("#3f6b3e")),
    );
  },
  balloon(g) {
    g.append(
      ellipse(0, -16, 8, 11, fill("#e05b5b")),
      line(0, -5, 0, 10, { "stroke-width": 1 }),
    );
  },
  butterfly(g) {
    g.append(
      ellipse(-6, 0, 6, 4, fill("#c9a44a", { opacity: 0.9 })),
      ellipse(6, 0, 6, 4, fill("#c9a44a", { opacity: 0.9 })),
      line(0, -4, 0, 4, { "stroke-width": 1.1 }),
    );
  },
  squirrel(g) {
    g.append(
      ellipse(0, 2, 7, 5, fill("#b56b3a")),
      circ(6, -2, 3.5, fill("#b56b3a")),
      path("M -6 0 Q -14 -12 -2 -4", ink({ stroke: "#b56b3a", "stroke-width": 2 })),
    );
  },
  car(g, o) {
    const c = o.color || "#4a6fa5";
    g.append(
      path("M -20 4 L -16 -6 L 4 -8 L 18 -2 L 20 4 Z", fill(c)),
      circ(-10, 6, 4, fill("#2a2622")),
      circ(12, 6, 4, fill("#2a2622")),
      rect(-8, -6, 8, 5, fill("#cfe4f4")),
    );
  },
  road(g) {
    g.append(
      rect(-220, -10, 440, 20, { fill: "#5a5854", stroke: INK, "stroke-width": 1.2 }),
      line(-200, 0, 200, 0, { stroke: "#f2e6a2", "stroke-width": 1.4, "stroke-dasharray": "10 12" }),
    );
  },
  shop(g, o) {
    g.append(
      rect(-28, -28, 56, 28, fill("#f3efe6")),
      rect(-28, -28, 56, 28, { fill: "url(#pat-brick)", opacity: 0.25, stroke: "none" }),
      rect(-32, -36, 64, 10, fill("#3d6b8a")),
      rect(-18, -18, 16, 12, fill("#b9d7ea")),
      rect(6, -14, 12, 14, fill("#6b4a32")),
      txt(0, -29, o.word || "PAIN", { size: 7, fill: "#f7f1e6" }),
    );
  },
  fountain(g) {
    g.append(
      ellipse(0, 8, 18, 6, fill("#8ec3d8")),
      circ(0, 0, 4, fill("#cfc8bc")),
      path("M 0 -2 Q -8 -16 0 -18 Q 8 -16 0 -2", { fill: "#a9d7ea", stroke: INK, "stroke-width": 1.1, opacity: 0.8 }),
    );
  },
  graffiti(g, o) {
    const w = o.word || "ok";
    g.append(txt(0, 0, w, { size: 13, fill: o.color || "#5b4db0", font: "Comic Sans MS, 'Segoe UI', sans-serif" }));
  },
  traffic(g) {
    g.append(
      rect(-3, 0, 6, 22, fill("#4a4a4a")),
      circ(0, -6, 4.2, fill("#3d3d3d")),
      circ(0, -10, 2.2, fill("#e05b5b")),
      circ(0, -5, 2.2, fill("#f2d66b")),
      circ(0, 0, 2.2, fill("#5bb56a")),
    );
  },
  crack(g, o) {
    const d = o.d || "M -80 0 L -40 8 L -10 -6 L 20 12 L 55 -4 L 90 10 L 140 0";
    g.append(path(d, ink({ "stroke-width": 2.4, stroke: "#1a1614" })));
    g.append(path(d, ink({ "stroke-width": 8, stroke: "#1a1614", opacity: 0.12 })));
  },
  eye(g) {
    g.append(
      ellipse(0, 0, 70, 38, fill("#f3efe2")),
      circ(8, 4, 22, fill("#3d5c46")),
      circ(12, 2, 10, fill("#1a1a1a")),
      circ(16, -2, 4, { fill: "#fff", stroke: "none" }),
      path("M -72 0 Q 0 -48 72 0", ink({ "stroke-width": 2.2 })),
    );
  },
  scale(g, o) {
    const c = o.color || "#6a8f6e";
    g.append(ellipse(0, 0, 28, 16, fill(c, { "stroke-width": 1.1 })));
  },
  ufo(g, o) {
    g.append(
      ellipse(0, 6, 28, 8, fill("#8d93a0")),
      ellipse(0, 0, 14, 10, fill("#c5e8d4")),
      ellipse(0, 14, 10, 18, { fill: "#c5e8d4", opacity: o.beam || 0.18, stroke: "none" }),
      circ(-10, 6, 2, { fill: "#f2d66b" }),
      circ(0, 6, 2, { fill: "#f2d66b" }),
      circ(10, 6, 2, { fill: "#f2d66b" }),
    );
  },
  orchestra(g, o) {
    const rng = o.rng;
    const cols = ["#2a2622", "#6b4a32", "#3d6b8a", "#c45c4a", "#3f6b3e"];
    for (let i = 0; i < 7; i++) {
      g.append(person((i - 3) * 14, (i % 2) * 6, 0.9, cols[i % cols.length], rng));
      g.append(ellipse((i - 3) * 14 + 6, (i % 2) * 6 - 6, 4, 2.5, fill("#d4b45a")));
    }
  },
  parade(g, o) {
    const rng = o.rng;
    for (let i = 0; i < 5; i++) {
      g.append(person(i * 16, 0, 0.95, ["#c45c4a", "#3d6b8a", "#e07a9a", "#4f8a57", "#f2d66b"][i], rng));
    }
    g.append(rect(-8, -28, 18, 12, fill("#c45c4a")), rect(-2, -16, 4, 16, fill("#8a5a32")));
  },
  skytext(g, o) {
    g.append(txt(0, 0, o.word || "VOILÀ", { size: o.size || 28, fill: o.color || "#2a2622", weight: "800" }));
  },
  person(g, o) {
    g.append(person(0, 0, o.s || 1, o.color || "#2a2622", o.rng));
  },
  crown(g) {
    g.append(path("M -12 6 L -10 -6 L -4 2 L 0 -8 L 4 2 L 10 -6 L 12 6 Z", fill("#f2d66b")));
  },
  queue(g, o) {
    for (let i = 0; i < 8; i++) {
      g.append(person(-i * 14, (i % 3) * 3, 0.85, ["#2a2622", "#5c4030", "#3d6b8a", "#4f8a57"][i % 4], o.rng));
    }
  },
  city(g, o) {
    const rng = o.rng || (() => 0.4);
    for (let i = 0; i < 6; i++) {
      const h = 24 + rng() * 50;
      g.append(rect(i * 16 - 48, -h, 14, h, fill(rng() > 0.5 ? "#d9d2c5" : "#b7c4ce")));
      g.append(rect(i * 16 - 44, -h + 6, 4, 4, fill("#f2d66b", { "stroke-width": 0.6 })));
    }
  },
  storm(g) {
    g.append(
      ellipse(0, 0, 40, 16, fill("#6d7c8b")),
      ellipse(18, 4, 22, 12, fill("#546270")),
      path("M 4 12 L -4 28 L 6 26 L 0 42", fill("#f2d66b", { "stroke-width": 1 })),
    );
  },
  planet(g) {
    g.append(
      ellipse(0, 40, 420, 70, fill("#1c3a5a", { "stroke-width": 1.6 })),
      ellipse(0, 20, 380, 24, { fill: "#2e6a4f", opacity: 0.55, stroke: "none" }),
    );
  },
  starbtn(g, o) {
    g.append(
      rect(-14, -8, 28, 16, fill("#f3f3f3", { rx: 3 })),
      txt(0, 4, o.word || "ok", { size: 8, fill: "#333", font: "system-ui, sans-serif", weight: "500" }),
    );
  },
  sticker(g, o) {
    const w = o.word || "oui";
    g.append(
      rect(-18, -12, 36, 24, fill("#fff6d8", { rx: 3 })),
      rect(-18, -12, 36, 24, { fill: "url(#pat-sticker)", opacity: 0.45, stroke: "none", rx: 3 }),
      txt(0, 4, w, { size: 10, fill: "#c45c4a" }),
    );
  },
  creature(g, o) {
    const rng = o.rng || (() => 0.5);
    const legs = 3 + Math.floor(rng() * 4);
    const c = o.color || "#6a4a78";
    g.append(ellipse(0, 0, 16 + rng() * 10, 10, fill(c)));
    g.append(circ(12, -6, 7, fill(c)));
    g.append(circ(15, -8, 1.4, { fill: INK }));
    for (let i = 0; i < legs; i++) {
      const x = -12 + i * (24 / legs);
      g.append(line(x, 8, x + (rng() - 0.5) * 8, 18, { stroke: c, "stroke-width": 2 }));
    }
  },
  sign(g, o) {
    g.append(
      rect(-1, 0, 3, 22, fill("#8a5a32")),
      rect(-22, -18, 44, 18, fill("#f7f1e6")),
      txt(0, -5, o.word || "ici", { size: 10 }),
    );
  },
  shape(g, o) {
    const rng = o.rng || (() => 0.3);
    const n = 3 + Math.floor(rng() * 5);
    const r = 8 + rng() * 16;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
    }
    g.append(el("polygon", { points: pts.join(" "), ...fill(o.color || "#d98a5a") }));
  },
  comet(g) {
    g.append(
      line(-28, 8, 0, 0, { "stroke-width": 1.4, opacity: 0.4 }),
      circ(0, 0, 4.5, fill("#f4f0e1")),
    );
  },
  duck(g) {
    g.append(
      ellipse(0, 2, 10, 6, fill("#f2d66b")),
      circ(8, -2, 4, fill("#f2d66b")),
      path("M 11 -2 L 16 -1 L 11 0 Z", fill("#e07a3a")),
    );
  },
  cactus(g) {
    g.append(
      rect(-5, -18, 10, 28, fill("#4f8a57", { rx: 4 })),
      rect(-14, -10, 10, 6, fill("#4f8a57", { rx: 3 })),
      rect(4, -6, 10, 6, fill("#4f8a57", { rx: 3 })),
    );
  },
  windmill(g) {
    g.append(
      rect(-4, -8, 8, 28, fill("#d8c39a")),
      line(-16, -8, 16, -8, { "stroke-width": 2 }),
      line(0, -24, 0, 8, { "stroke-width": 2 }),
    );
  },
  boat(g) {
    g.append(
      path("M -16 6 L 16 6 L 10 12 L -10 12 Z", fill("#6b4a32")),
      path("M 0 6 L 0 -16 L 12 6 Z", fill("#f7f1e6")),
    );
  },
  flag(g, o) {
    g.append(line(0, 12, 0, -16), rect(0, -16, 16, 10, fill(o.color || "#c45c4a")));
  },
  rainbow(g) {
    g.append(
      path("M -40 10 Q 0 -28 40 10", ink({ stroke: "#c45c4a", "stroke-width": 3 })),
      path("M -36 10 Q 0 -22 36 10", ink({ stroke: "#f2d66b", "stroke-width": 3 })),
      path("M -32 10 Q 0 -16 32 10", ink({ stroke: "#4f8a57", "stroke-width": 3 })),
    );
  },
  mushroom(g) {
    g.append(
      ellipse(0, -6, 12, 8, fill("#c45c4a")),
      rect(-3, -4, 6, 12, fill("#f7f1e6")),
      circ(-4, -8, 2, { fill: "#f7f1e6", stroke: "none" }),
    );
  },
  robot(g) {
    g.append(
      rect(-8, -6, 16, 14, fill("#b7c4ce")),
      rect(-6, -14, 12, 8, fill("#8d93a0")),
      circ(-3, -10, 1.4, { fill: "#e05b5b" }),
      circ(3, -10, 1.4, { fill: "#5bb56a" }),
    );
  },
  snail(g) {
    g.append(
      circ(0, 0, 8, fill("#d4b45a")),
      path("M 6 2 Q 18 0 16 -8", ink({ "stroke-width": 2, stroke: "#c4a574" })),
    );
  },
  pizza(g) {
    g.append(
      path("M 0 -14 L 12 10 L -12 10 Z", fill("#f2d66b")),
      circ(-2, 0, 2, fill("#c45c4a")),
      circ(4, 4, 2, fill("#c45c4a")),
    );
  },
  fish(g, o) {
    g.append(
      ellipse(0, 0, 12, 6, fill(o.color || "#4a6fa5")),
      path("M 12 0 L 18 -5 L 18 5 Z", fill(o.color || "#4a6fa5")),
      circ(-5, -1, 1.2, { fill: INK }),
    );
  },
  antenna(g) {
    g.append(rect(-3, 0, 6, 20, fill("#8d93a0")), line(0, 0, 0, -18), circ(0, -20, 3, fill("#e05b5b")));
  },
  pyramid(g) {
    g.append(path("M 0 -28 L 22 12 L -22 12 Z", fill("#d4b45a")));
  },
  tower(g) {
    g.append(
      rect(-8, -40, 16, 50, fill("#cfc8bc")),
      path("M -10 -40 L 0 -54 L 10 -40 Z", fill("#c45c4a")),
    );
  },
  face(g) {
    g.append(
      circ(0, 0, 48, fill("#f0c9a8")),
      circ(-16, -8, 5, { fill: INK }),
      circ(16, -8, 5, { fill: INK }),
      path("M -14 14 Q 0 24 14 14", ink({ "stroke-width": 2.2 })),
    );
  },
  eclipse(g) {
    g.append(
      circ(0, 0, 26, { fill: "#0e1016", stroke: "#f2d66b", "stroke-width": 3 }),
      circ(6, -4, 22, { fill: "#0e1016", stroke: "none" }),
    );
  },
  snow(g) {
    for (let i = 0; i < 9; i++) {
      g.append(
        circ((i % 3) * 14 - 14, Math.floor(i / 3) * 16 - 16, 3.2, {
          fill: "#fff",
          stroke: "#d8e6f0",
          "stroke-width": 0.8,
          opacity: 0.95,
        }),
      );
    }
  },
  star(g) {
    g.append(path("M 0 -8 L 2 -2 L 8 -2 L 3 2 L 5 8 L 0 4 L -5 8 L -3 2 L -8 -2 L -2 -2 Z", fill("#f2d66b")));
  },
};

export function placeStamp(parent, name, opt) {
  const fn = STAMPS[name] || STAMPS.shape;
  const g = el("g", {
    class: `stamp stamp-${name}`,
    transform: `translate(${opt.x} ${opt.y}) rotate(${opt.rot || 0}) scale(${opt.s == null ? 1 : opt.s})`,
    "data-n": String(opt.n ?? ""),
    "data-word": opt.word || "",
  });
  fn(g, opt);
  parent.append(g);
  return g;
}
