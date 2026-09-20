import { addChaos, emit, MAX_WINDOWS, reducedMotion, resetSession, state, touch } from "./state.js";
import { flags, kickMotion } from "./chaos.js";
import { applyBox, clampWin, createWindowRecord, mountWindow, nextId, resetIds, setTitle } from "./window.js";
import { getApp } from "./apps.js";
import { pushTrash, resetTrash } from "./apps/trash.js";
import { audio } from "./audio.js";

export class WM {
  constructor({ desktop, windowsRoot }) {
    this.desktop = desktop;
    this.root = windowsRoot;
    this.windows = [];
    this.zCounter = 20;
    this.cascade = 0;
    this.activeId = null;
    this.drag = null;
    this.ctx = null;
    this.hooks = {
      focus: (id, e) => this.focus(id, e),
      minimize: (id) => this.minimize(id),
      maximize: (id) => this.maximize(id),
      close: (id) => this.close(id),
    };
    this._onMove = (e) => this.onPointerMove(e);
    this._onUp = (e) => this.onPointerUp(e);
    this.listeningDrag = false;
  }

  bounds() {
    return {
      w: this.desktop.clientWidth,
      h: Math.max(120, this.desktop.clientHeight),
    };
  }

  live() {
    return this.windows.filter((w) => !w.closed);
  }

  liveCount() {
    return this.live().length;
  }

  get(id) {
    return this.windows.find((w) => w.id === id && !w.closed) || null;
  }

  defaultRect(app, opts) {
    const b = this.bounds();
    const mobile = b.w < 720;
    const w = opts.w || (mobile ? Math.max(200, b.w - 12) : app.w || 420);
    const h = opts.h || (mobile ? Math.min(app.h || 300, b.h - 12) : app.h || 280);
    this.cascade = (this.cascade + 1) % 8;
    let x = opts.x ?? (mobile ? 6 : 56 + this.cascade * 22);
    let y = opts.y ?? (mobile ? 6 : 32 + this.cascade * 22);
    if (flags().spawnOff) {
      x += 10 + Math.random() * 10;
      y += 12 + Math.random() * 8;
    }
    const rect = { x, y, w: Math.min(w, b.w), h: Math.min(h, b.h) };
    clampWin(rect, b);
    return rect;
  }

  open(appId, opts = {}) {
    if (state.flags.finale && appId !== "finale") return null;
    const app = getApp(appId);
    if (!app) return null;

    const existing = this.live().filter((w) => w.appId === appId);
    if (app.single && existing.length) {
      this.restore(existing[0].id);
      this.focus(existing[0].id);
      if (opts.title) setTitle(existing[0], opts.title);
      if (opts.data) Object.assign(existing[0].data, opts.data);
      existing[0].instance?.refresh?.();
      this.ctx?.taskbar?.sync();
      return existing[0];
    }

    if (this.liveCount() >= MAX_WINDOWS) {
      const same = existing[0] || this.live()[this.live().length - 1];
      if (same && (existing[0] || flags().id < 3)) {
        this.restore(same.id);
        this.focus(same.id);
        this.toast(existing[0] ? "déjà ouvert." : "Bureau : trop de fenêtres.");
        return same;
      }
      this.toast(flags().id >= 3 ? (Math.random() < 0.5 ? "oui" : "plein plein plein") : "8 fenêtres, c’est le plafond.");
      audio.deny();
      return null;
    }

    const rect = this.defaultRect(app, opts);
    const win = createWindowRecord({
      id: nextId(),
      appId,
      title: opts.title || app.title,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      z: ++this.zCounter,
      data: { ...(opts.data || {}) },
    });
    win.chrome = app.chrome || {};
    const view = mountWindow(win, this.hooks);
    win.destroyView = view.destroy;
    this.root.append(win.el);
    win.instance = app.mount(win, this.ctx) || null;
    this.windows.push(win);
    if (!opts.silent && !state.flags.finale) addChaos(0.4);
    this.focus(win.id);
    applyBox(win, this.bounds());
    this.ctx?.taskbar?.sync();
    audio.open();
    kickMotion(this.ctx);
    return win;
  }

  focus(id) {
    const win = this.get(id);
    if (!win || win.minimized) return;
    this.activeId = id;
    win.z = ++this.zCounter;
    win.focused = true;
    for (const other of this.live()) {
      if (other.id !== id) other.focused = false;
      applyBox(other, this.bounds());
    }
    this.ctx?.taskbar?.sync();
  }

  minimize(id) {
    const win = this.get(id);
    if (!win) return;
    win.minimized = true;
    win.focused = false;
    if (this.activeId === id) this.activeId = null;
    applyBox(win, this.bounds());
    const next = this.live().filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
    if (next) this.focus(next.id);
    else this.ctx?.taskbar?.sync();
    kickMotion(this.ctx);
  }

  restore(id) {
    const win = this.get(id);
    if (!win) return;
    win.minimized = false;
    if (win.maximized) {
      /* keep max */
    }
    applyBox(win, this.bounds());
    this.focus(id);
  }

  maximize(id) {
    const win = this.get(id);
    if (!win || win.chrome?.hideMax) return;
    if (win.maximized) {
      win.maximized = false;
      if (win.restore) {
        win.x = win.restore.x;
        win.y = win.restore.y;
        win.w = win.restore.w;
        win.h = win.restore.h;
      }
      if (win.btnMax) {
        win.btnMax.textContent = "□";
        win.btnMax.setAttribute("aria-label", "agrandir");
      }
    } else {
      win.restore = { x: win.x, y: win.y, w: win.w, h: win.h };
      win.maximized = true;
      if (win.btnMax) {
        win.btnMax.textContent = "❐";
        win.btnMax.setAttribute("aria-label", "restaurer");
      }
    }
    applyBox(win, this.bounds());
    this.focus(id);
  }

  close(id, { force = false, toTrash = true } = {}) {
    const win = this.get(id);
    if (!win) return;
    if (win.appId === "finale" && !force) return;
    if (!force && flags().closeMin && Math.random() < 0.3) {
      this.minimize(id);
      return;
    }
    const app = getApp(win.appId);
    if (toTrash && app?.trashes) {
      pushTrash({ title: win.title, appId: win.appId });
    }
    win.closed = true;
    win.destroyView?.();
    win.destroyView = null;
    this.windows = this.windows.filter((w) => w.id !== id);
    if (this.activeId === id) this.activeId = null;
    const next = this.live().filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
    if (next) this.focus(next.id);
    this.ctx?.taskbar?.sync();
    audio.close();
    kickMotion(this.ctx);
    if (state.flags.finale && win.appId === "finale") {
      this.open("finale", { silent: true });
    }
  }

  closeAll({ keepFinale = false } = {}) {
    for (const win of [...this.live()]) {
      if (keepFinale && win.appId === "finale") continue;
      this.close(win.id, { force: true, toTrash: false });
    }
  }

  enterFinale() {
    if (state.flags.finale) return;
    state.flags.finale = true;
    emit();
    this.ctx?.hideToast?.();
    this.closeAll();
    const b = this.bounds();
    this.open("finale", {
      silent: true,
      x: Math.max(8, (b.w - 360) / 2),
      y: Math.max(16, (b.h - 220) / 2),
      w: Math.min(360, b.w - 16),
      h: 220,
    });
    this.ctx?.menu?.close();
  }

  restart() {
    state.flags.finale = false;
    this.ctx?.hideToast?.();
    this.closeAll();
    resetTrash();
    resetIds();
    this.zCounter = 20;
    this.cascade = 0;
    this.activeId = null;
    this.endDrag();
    resetSession();
    this.ctx?.taskbar?.sync();
    if (this.ctx?.desktop?.reset) this.ctx.desktop.reset();
    else this.ctx?.desktop?.refresh();
    this.ctx?.boot?.(800);
  }

  toast(text) {
    this.ctx?.toast(text);
  }

  setTitleSwap(on) {
    for (const win of this.live()) {
      win.bar?.classList.toggle("swap", on);
    }
  }

  hasDriftable() {
    return this.live().some((w) => !w.minimized && !w.maximized && !w.focused);
  }

  tickMotion(dt) {
    const f = flags();
    const b = this.bounds();
    const barH = 28;
    for (const win of this.live()) {
      if (win.minimized || win.maximized || win.focused) continue;
      if (this.drag && this.drag.id === win.id) continue;
      if (f.gravity) {
        win.y += 22 * dt;
      } else if (f.drift) {
        win.y += 1 * dt;
      }
      win.y = Math.min(win.y, Math.max(0, b.h - barH));
      applyBox(win, b);
    }
  }

  clampAll() {
    const b = this.bounds();
    for (const win of this.live()) {
      clampWin(win, b);
      applyBox(win, b);
    }
  }

  onBarPointerDown(e, win) {
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;
    if (win.maximized) return;
    this.focus(win.id);
    const delay = flags().dragDelay && !reducedMotion() && Math.random() < 0.42;
    this.drag = {
      id: win.id,
      pointerId: e.pointerId,
      ox: e.clientX - win.x,
      oy: e.clientY - win.y,
      readyAt: performance.now() + (delay ? 80 : 0),
      moved: false,
    };
    try {
      win.bar.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    this.bindDrag(true);
  }

  onPointerMove(e) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    if (performance.now() < this.drag.readyAt) return;
    const win = this.get(this.drag.id);
    if (!win || win.maximized) return;
    win.x = e.clientX - this.drag.ox;
    win.y = e.clientY - this.drag.oy;
    clampWin(win, this.bounds());
    applyBox(win, this.bounds());
    this.drag.moved = true;
  }

  onPointerUp(e) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    if (this.drag.moved) addChaos(0.08);
    this.endDrag();
    touch();
  }

  endDrag() {
    this.drag = null;
    this.bindDrag(false);
  }

  bindDrag(on) {
    if (on === this.listeningDrag) return;
    this.listeningDrag = on;
    const target = document;
    if (on) {
      target.addEventListener("pointermove", this._onMove);
      target.addEventListener("pointerup", this._onUp);
      target.addEventListener("pointercancel", this._onUp);
    } else {
      target.removeEventListener("pointermove", this._onMove);
      target.removeEventListener("pointerup", this._onUp);
      target.removeEventListener("pointercancel", this._onUp);
    }
  }

  handlePointerDown(e) {
    const bar = e.target.closest?.(".win-bar");
    if (!bar) return;
    const wrap = bar.closest(".win");
    if (!wrap) return;
    const win = this.get(wrap.dataset.id);
    if (win) this.onBarPointerDown(e, win);
  }

  focused() {
    return this.get(this.activeId);
  }

  closeFocused() {
    const win = this.focused();
    if (win) this.close(win.id);
  }
}
