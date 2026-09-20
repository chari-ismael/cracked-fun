import { h } from "../window.js";

export default {
  id: "prompt",
  title: "?",
  menu: false,
  icon: "note",
  w: 220,
  h: 150,
  chrome: { hideMax: true, hideMin: true },
  mount(win, ctx) {
    const ok = h("button", { type: "button", class: "sys-btn", text: "ok" });
    const onOk = () => ctx.wm.close(win.id, { force: true, toTrash: false });
    ok.addEventListener("click", onOk);
    win.body.append(h("div", { class: "dlg dlg-q" }, h("p", { class: "dlg-qmark", text: "?" }), ok));
    queueMicrotask(() => ok.focus());
    return {
      destroy() {
        ok.removeEventListener("click", onOk);
      },
    };
  },
};
