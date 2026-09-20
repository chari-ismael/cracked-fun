import { createState } from "./state.js";
import { createStage } from "./stage.js";
import { createRenderer } from "./render.js";
import { bindInput } from "./input.js";
import { createAudio } from "./audio.js";

const els = {
  btn: document.getElementById("btn"),
  label: document.getElementById("label"),
  count: document.getElementById("count"),
  caption: document.getElementById("caption"),
  picture: document.getElementById("picture"),
  stageSvg: document.getElementById("stage"),
  cosmos: document.getElementById("cosmos"),
  dialog: document.getElementById("dialog"),
  dialogOk: document.getElementById("dialog-ok"),
  dialogBody: document.getElementById("dialog-body"),
  theme: document.querySelector('meta[name="theme-color"]'),
};

const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const audio = createAudio();
const state = createState();
const stage = createStage(els.stageSvg, els.cosmos);
const render = createRenderer(stage, els);

const ctx = {
  state,
  els,
  audio,
  reduced: motion.matches,
  paint() {
    render.paint(ctx);
  },
  commit() {
    const kind = render.step(ctx);
    audio.tap(state.clicks, kind);
  },
  closeDialog() {
    state.dialog = null;
    render.apply(ctx);
    els.btn.focus({ preventScroll: true });
  },
};

audio.setReduced(ctx.reduced);
motion.addEventListener("change", (e) => {
  ctx.reduced = e.matches;
  audio.setReduced(e.matches);
  document.body.classList.toggle("is-dance", Boolean(state.flags.dance) && !ctx.reduced);
});

function qaFromQuery() {
  const q = new URLSearchParams(location.search);
  const raw = q.get("n") ?? q.get("clicks");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return;
  render.jump(ctx, n);
}

try {
  bindInput(ctx);
  render.apply(ctx);
  qaFromQuery();
  els.btn.focus();
} catch (err) {
  console.error(err);
}

window.crackedButton = {
  jump(n) {
    render.jump(ctx, n);
  },
  get clicks() {
    return state.clicks;
  },
  get era() {
    return state.era;
  },
};

document.body.addEventListener("btn:jump", (e) => {
  render.jump(ctx, Number(e.detail) || 0);
});
