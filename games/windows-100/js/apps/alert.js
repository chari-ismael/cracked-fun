import { h } from "../window.js";

const LINES = [
  "Un fichier a décidé de partir.",
  "La corbeille a faim.",
  "Ceci n’est pas une alerte.",
  "Mémoire : assez. Trop. Pas assez.",
  "Bureau a entendu un clic de trop.",
];

export default {
  id: "alert",
  title: "Alerte système",
  menu: false,
  icon: "gear",
  w: 340,
  h: 180,
  chrome: { hideMax: true },
  mount(win, ctx) {
    const line = LINES[Math.floor(Math.random() * LINES.length)];
    const ok = h("button", { type: "button", class: "sys-btn", text: "entendu" });
    const onOk = () => ctx.wm.close(win.id, { force: true, toTrash: false });
    ok.addEventListener("click", onOk);
    win.body.append(
      h("div", { class: "dlg" },
        h("p", { class: "dlg-lead", text: line }),
        ok,
      ),
    );
    queueMicrotask(() => ok.focus());
    return {
      destroy() {
        ok.removeEventListener("click", onOk);
      },
    };
  },
};
