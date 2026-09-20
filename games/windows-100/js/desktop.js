import { addChaos, onChange, touch } from "./state.js";
import { flags } from "./chaos.js";
import { DESKTOP_APPS, getApp } from "./apps.js";
import { h } from "./window.js";

const LABELS = {
  notepad: { ok: "Bloc-notes", bad: "Bloc-nots" },
  files: { ok: "Dossier", bad: "Dossier" },
  settings: { ok: "Réglages", bad: "Réglages" },
  trash: { ok: "Corbeille", bad: "Corbeille" },
  clock: { ok: "Horloge", bad: "Horloge" },
};

function svgEl(tag, attrs) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

export function makeGlyph(kind) {
  const svg = svgEl("svg", { viewBox: "0 0 32 32", class: "glyph", "aria-hidden": "true" });
  if (kind === "note") {
    svg.append(
      svgEl("rect", { x: 6, y: 4, width: 20, height: 24, fill: "#efe6d2", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("rect", { x: 6, y: 4, width: 4, height: 24, fill: "#2f6a62" }),
      svgEl("path", { d: "M13 11h10M13 16h10M13 21h7", stroke: "#2a2720", "stroke-width": "1.4", fill: "none" }),
    );
  } else if (kind === "folder") {
    svg.append(
      svgEl("path", { d: "M5 10h8l2 3h12v14H5z", fill: "#c9863a", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("path", { d: "M5 13h22v14H5z", fill: "#e2b15a", stroke: "#2a2720", "stroke-width": "1.5" }),
    );
  } else if (kind === "gear") {
    svg.append(
      svgEl("circle", { cx: 16, cy: 16, r: 6, fill: "#d9d0bb", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("circle", { cx: 16, cy: 16, r: 2.4, fill: "#2f6a62" }),
      svgEl("path", {
        d: "M16 5v4M16 23v4M5 16h4M23 16h4M8 8l2.6 2.6M21.4 21.4L24 24M8 24l2.6-2.6M21.4 10.6L24 8",
        stroke: "#2a2720",
        "stroke-width": "2",
        fill: "none",
        "stroke-linecap": "square",
      }),
    );
  } else if (kind === "bin") {
    svg.append(
      svgEl("path", { d: "M8 10h16l-1.5 16H9.5z", fill: "#6b756c", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("path", { d: "M7 8h18v3H7z", fill: "#9aa397", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("path", { d: "M13 8V6h6v2", stroke: "#2a2720", "stroke-width": "1.5", fill: "none" }),
    );
  } else if (kind === "clock") {
    svg.append(
      svgEl("circle", { cx: 16, cy: 16, r: 11, fill: "#efe6d2", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("path", { d: "M16 16V8M16 16l6 3", stroke: "#2f6a62", "stroke-width": "1.8", "stroke-linecap": "square" }),
    );
  } else {
    svg.append(
      svgEl("rect", { x: 5, y: 7, width: 22, height: 18, fill: "#24322f", stroke: "#2a2720", "stroke-width": "1.5" }),
      svgEl("path", { d: "M8 20h6", stroke: "#9ad7c8", "stroke-width": "2" }),
    );
  }
  return svg;
}

export function mountDesktop(root, ctx) {
  const icons = h("nav", { class: "icons", "aria-label": "bureau" });
  root.append(icons);

  let selected = "";
  const buttons = [];

  const labelOf = (id) => {
    const pair = LABELS[id];
    if (!pair) return getApp(id).title;
    return flags().iconTypo && id === "notepad" ? pair.bad : pair.ok;
  };

  const refresh = () => {
    for (const btn of buttons) {
      const id = btn.dataset.app;
      btn.classList.toggle("is-on", selected === id);
      const label = btn.querySelector(".desk-label");
      if (label) label.textContent = labelOf(id);
    }
  };

  DESKTOP_APPS.forEach((id) => {
    const app = getApp(id);
    const btn = h("button", {
      type: "button",
      class: "desk-icon",
      dataset: { app: id },
    }, makeGlyph(app.icon), h("span", { class: "desk-label", text: labelOf(id) }));
    let lastOpen = 0;
    const open = () => {
      const now = performance.now();
      if (now - lastOpen < 320) return;
      lastOpen = now;
      ctx.wm.open(id);
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addChaos(0.05);
      touch();
      selected = id;
      refresh();
      open();
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        touch();
        selected = id;
        refresh();
        open();
      }
    });
    buttons.push(btn);
    icons.append(btn);
  });

  const onDesk = (e) => {
    if (e.target !== root) return;
    selected = "";
    refresh();
    ctx.menu?.close();
    ctx.ctxMenu?.close();
    if (flags().emptyDialog && Math.random() < 0.32) {
      ctx.wm.open("prompt");
    }
  };

  root.addEventListener("click", onDesk);
  const off = onChange(refresh);

  ctx.desktop = {
    refresh,
    reset() {
      selected = "";
      refresh();
    },
    destroy() {
      root.removeEventListener("click", onDesk);
      off();
    },
  };
}
