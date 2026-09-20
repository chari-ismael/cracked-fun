import { h } from "../window.js";
import { flags } from "../chaos.js";
import { onChange } from "../state.js";

const items = [];

export function pushTrash(item) {
  items.push({ id: `${Date.now()}-${items.length}`, title: item.title, appId: item.appId });
  if (items.length > 12) items.shift();
}

export function resetTrash() {
  items.length = 0;
}

export function listTrash() {
  return items.slice();
}

export default {
  id: "trash",
  title: "Corbeille",
  menu: true,
  icon: "bin",
  trashes: false,
  single: true,
  w: 360,
  h: 260,
  mount(win, ctx) {
    const head = h("p", { class: "trash-head" });
    const list = h("ul", { class: "file-list", "aria-label": "corbeille" });
    const restore = h("button", { type: "button", class: "sys-btn", text: "restaurer" });
    win.body.append(h("div", { class: "set-wrap" }, head, list, restore));
    let selected = 0;

    const paint = () => {
      const lie = flags().trashLie;
      const n = items.length;
      head.textContent = lie
        ? "13 467 éléments"
        : n === 0
          ? "vide"
          : n === 1
            ? "1 élément"
            : `${n} éléments`;
      list.replaceChildren();
      const shown = items.slice();
      if (shown.length === 0) {
        list.append(h("li", { class: "file-item mute", text: lie ? "(aucun nom lisible)" : "rien ici." }));
      } else {
        shown.forEach((item, i) => {
          const row = h("li", {
            class: "file-item" + (i === selected ? " is-on" : ""),
            tabindex: "0",
            text: item.title,
          });
          row.addEventListener("click", () => {
            selected = i;
            paint();
          });
          list.append(row);
        });
      }
      restore.disabled = items.length === 0;
    };

    const onRestore = () => {
      const item = items[selected] || items[0];
      if (!item) return;
      items.splice(items.indexOf(item), 1);
      selected = 0;
      paint();
      ctx.wm.open(item.appId, { title: item.title });
    };

    restore.addEventListener("click", onRestore);
    const off = onChange(paint);
    win.instanceRefresh = paint;
    paint();

    return {
      refresh: paint,
      destroy() {
        restore.removeEventListener("click", onRestore);
        off();
      },
    };
  },
};
