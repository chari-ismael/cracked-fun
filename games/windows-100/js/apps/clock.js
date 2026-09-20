import { clockLabel, onChange, onPulse } from "../state.js";
import { h } from "../window.js";

export default {
  id: "clock",
  title: "Horloge",
  menu: true,
  icon: "clock",
  trashes: true,
  w: 280,
  h: 180,
  mount(win) {
    const face = h("p", { class: "clock-face", "aria-live": "off" });
    const cap = h("p", { class: "clock-cap", text: "heure du bureau" });
    win.body.append(h("div", { class: "clock-wrap" }, cap, face));

    const paint = () => {
      face.textContent = clockLabel();
    };

    const offChange = onChange(paint);
    const offPulse = onPulse(paint);
    paint();

    return {
      destroy() {
        offChange();
        offPulse();
      },
    };
  },
};
