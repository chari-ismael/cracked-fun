import { emit, onChange, resetSession, setChaos, state, touch } from "./state.js";
import { kickMotion, startChaos, stopChaos } from "./chaos.js";
import { audio } from "./audio.js";
import { WM } from "./wm.js";
import { mountDesktop } from "./desktop.js";
import { mountTaskbar } from "./taskbar.js";
import { h } from "./window.js";

const desktop = document.getElementById("desktop");
const windowsRoot = document.getElementById("windows");
const taskbar = document.getElementById("taskbar");
const boot = document.getElementById("boot");

const wm = new WM({ desktop, windowsRoot });
const ctx = { wm, audio, desktop, boot: showBoot };
wm.ctx = ctx;

let toastEl = null;
let toastTimer = 0;

ctx.toast = (text) => {
  if (!toastEl) {
    toastEl = h("div", { class: "toast", role: "status" });
    document.body.append(toastEl);
  }
  toastEl.textContent = text;
  toastEl.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 1600);
};

ctx.hideToast = () => {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = 0;
  }
  if (toastEl) toastEl.hidden = true;
};

mountDesktop(desktop, ctx);
mountTaskbar(taskbar, ctx);

windowsRoot.addEventListener("pointerdown", (e) => wm.handlePointerDown(e));

document.addEventListener("pointerdown", () => audio.resume(), { once: true });
document.addEventListener("keydown", () => audio.resume(), { once: true });

document.addEventListener("pointerdown", (e) => {
  touch();
  if (!e.target.closest(".start-menu") && !e.target.closest(".start-btn")) ctx.menu?.close();
  if (!e.target.closest(".ctx-menu") && !e.target.closest(".task-btn")) ctx.ctxMenu?.close();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (ctx.ctxMenu && !document.querySelector(".ctx-menu")?.hidden) {
    ctx.ctxMenu.close();
    return;
  }
  if (ctx.menu?.isOpen()) {
    ctx.menu.close();
    return;
  }
  wm.closeFocused();
});

window.addEventListener("resize", () => wm.clampAll());

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  state.lastInput = performance.now();
});

function showBoot(ms = 800) {
  state.flags.booting = true;
  emit();
  boot.hidden = false;
  audio.boot();
  window.setTimeout(() => {
    boot.hidden = true;
    state.flags.booting = false;
    state.startedAt = performance.now();
    state.lastInput = performance.now();
    emit();
    applyChaosHook();
    kickMotion(ctx);
  }, ms);
}

function chaosFromUrl() {
  const query = new URLSearchParams(location.search).get("chaos");
  const hash = /(?:^#|[?&])chaos=(\d+)/i.exec(location.hash)?.[1];
  const raw = query ?? hash;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

let bootHookUsed = false;

function applyChaosHook() {
  if (bootHookUsed) return;
  bootHookUsed = true;
  const n = chaosFromUrl();
  if (n == null) return;
  setChaos(n);
}

window.addEventListener("hashchange", () => {
  if (state.flags.booting) return;
  const n = chaosFromUrl();
  if (n == null) return;
  setChaos(n);
});

onChange(() => {
  if (state.chaos >= 100 && !state.flags.finale && !state.flags.booting) {
    wm.enterFinale();
  }
});

resetSession();
startChaos(ctx);
showBoot(800);

window.addEventListener("pagehide", () => {
  stopChaos();
  wm.bindDrag(false);
});
