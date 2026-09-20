import { h } from "../window.js";

export default {
  id: "finale",
  title: "100%",
  menu: false,
  icon: "note",
  single: true,
  w: 360,
  h: 220,
  chrome: { hideMin: true, hideMax: true, hideClose: true },
  mount(win, ctx) {
    const go = h("button", { type: "button", class: "sys-btn sys-btn-big", text: "redémarrer" });
    const onGo = () => ctx.wm.restart();
    go.addEventListener("click", onGo);
    win.body.append(
      h("div", { class: "finale-body" },
        h("p", { class: "finale-pct", text: "100%" }),
        h("p", { class: "finale-line", text: "Bureau n’a plus de bureaux." }),
        go,
      ),
    );
    queueMicrotask(() => go.focus());
    return {
      destroy() {
        go.removeEventListener("click", onGo);
      },
    };
  },
};
