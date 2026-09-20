import { addChaos, chaosLabel, onChange, state } from "../state.js";
import { flags } from "../chaos.js";
import { h } from "../window.js";

export default {
  id: "settings",
  title: "Réglages",
  menu: true,
  icon: "gear",
  trashes: false,
  w: 360,
  h: 260,
  mount(win) {
    const meter = h("p", { class: "set-meter" });
    const hint = h("p", { class: "set-hint" });
    const repair = h("button", { type: "button", class: "sys-btn", text: "réparer" });
    const fond = h("button", {
      type: "button",
      class: "sys-btn",
      "aria-pressed": state.flags.wallpaperAlt ? "true" : "false",
      text: "fond",
    });
    const row = h("div", { class: "set-row" }, repair, fond);
    win.body.append(
      h("div", { class: "set-wrap" },
        h("p", { class: "set-k", text: "dérèglement" }),
        meter,
        hint,
        row,
      ),
    );

    const paint = () => {
      meter.textContent = chaosLabel();
      hint.textContent = flags().repairLies
        ? "réparer. oui. ça va s’arranger."
        : "lecture seule. le dérèglement n’aime pas qu’on le touche.";
    };

    const onRepair = () => {
      if (flags().repairLies) addChaos(2);
      else addChaos(-8);
      paint();
    };
    const onFond = () => {
      state.flags.wallpaperAlt = !state.flags.wallpaperAlt;
      fond.setAttribute("aria-pressed", state.flags.wallpaperAlt ? "true" : "false");
      document.body.classList.toggle("wall-b", state.flags.wallpaperAlt);
    };

    repair.addEventListener("click", onRepair);
    fond.addEventListener("click", onFond);
    const off = onChange(paint);
    paint();

    return {
      destroy() {
        repair.removeEventListener("click", onRepair);
        fond.removeEventListener("click", onFond);
        off();
      },
    };
  },
};
