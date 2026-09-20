import { chaosLabel, clockLabel, onChange, touch } from "./state.js";
import { flags } from "./chaos.js";
import { getApp, menuApps } from "./apps.js";
import { h } from "./window.js";
import { makeGlyph } from "./desktop.js";

export function mountTaskbar(bar, ctx) {
  const start = h("button", { type: "button", class: "start-btn", "aria-expanded": "false", "aria-haspopup": "true", text: "Bureau" });
  const tasks = h("div", { class: "tasks", "aria-label": "fenêtres" });
  const trayClock = h("span", { class: "tray-clock" });
  const trayChaos = h("span", { class: "tray-chaos" });
  const tray = h("div", { class: "tray", "aria-label": "barre d’état" }, trayClock, trayChaos);
  bar.append(start, tasks, tray);

  const menu = h("div", { class: "start-menu", hidden: "", role: "menu", "aria-label": "menu Bureau" });
  bar.parentElement.append(menu);

  const ctxMenu = h("div", { class: "ctx-menu", hidden: "", role: "menu" });
  bar.parentElement.append(ctxMenu);

  let menuOpen = false;
  let ctxId = null;

  const closeMenu = () => {
    menuOpen = false;
    menu.hidden = true;
    start.setAttribute("aria-expanded", "false");
  };

  const closeCtx = () => {
    ctxId = null;
    ctxMenu.hidden = true;
  };

  const appTitle = (app) => {
    if (flags().startLie && app.id === "clock") return "Horlogg";
    return app.title;
  };

  const paintMenu = () => {
    menu.replaceChildren();
    const apps = menuApps().slice();
    if (flags().terminal) apps.push(getApp("terminal"));
    for (const app of apps) {
      const item = h("button", {
        type: "button",
        class: "menu-item",
        role: "menuitem",
      }, makeGlyph(app.icon), h("span", { text: appTitle(app) }));
      item.addEventListener("click", () => {
        closeMenu();
        touch();
        ctx.wm.open(app.id);
      });
      menu.append(item);
    }
  };

  const toggleMenu = () => {
    touch();
    if (menuOpen) {
      closeMenu();
      return;
    }
    closeCtx();
    paintMenu();
    menuOpen = true;
    menu.hidden = false;
    start.setAttribute("aria-expanded", "true");
  };

  start.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  const refreshTray = () => {
    trayClock.textContent = clockLabel();
    trayChaos.textContent = `dérèglement ${chaosLabel()}`;
  };

  const sync = () => {
    const live = ctx.wm.live();
    tasks.replaceChildren();
    for (const win of live) {
      const btn = h("button", {
        type: "button",
        class: "task-btn" + (win.focused && !win.minimized ? " is-on" : ""),
        dataset: { id: win.id },
        text: win.title,
      });
      btn.addEventListener("click", () => {
        touch();
        closeMenu();
        if (win.minimized || !win.focused) ctx.wm.restore(win.id);
        else ctx.wm.minimize(win.id);
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        touch();
        closeMenu();
        ctxId = win.id;
        ctxMenu.replaceChildren();
        const closer = h("button", { type: "button", class: "menu-item", role: "menuitem", text: "fermer" });
        closer.addEventListener("click", () => {
          ctx.wm.close(ctxId, { force: true });
          closeCtx();
        });
        ctxMenu.append(closer);
        ctxMenu.hidden = false;
        const r = bar.getBoundingClientRect();
        const x = Math.min(e.clientX, window.innerWidth - 140);
        ctxMenu.style.left = `${x}px`;
        ctxMenu.style.bottom = `${r.height + 4}px`;
      });
      tasks.append(btn);
    }
    refreshTray();
  };

  const off = onChange(() => {
    refreshTray();
    if (menuOpen) paintMenu();
  });

  ctx.taskbar = { sync, refreshTray, destroy: () => off() };
  ctx.menu = { close: closeMenu, isOpen: () => menuOpen };
  ctx.ctxMenu = { close: closeCtx };

  refreshTray();
  return { closeMenu, closeCtx };
}
