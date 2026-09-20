import { h } from "../window.js";
import { flags } from "../chaos.js";

const GLYPHS = "aeiouyéèàbtrn";

export default {
  id: "notepad",
  title: "Bloc-notes",
  menu: true,
  icon: "note",
  trashes: true,
  w: 440,
  h: 300,
  mount(win) {
    if (win.data.text == null) {
      win.data.text = win.data.seed || "";
    }
    const area = h("textarea", {
      class: "pad",
      spellcheck: "false",
      "aria-label": "texte",
    });
    area.value = win.data.text;
    const onInput = () => {
      let value = area.value;
      if (flags().notepadMutate && value.length > 0 && Math.random() < 0.14) {
        const i = Math.floor(Math.random() * value.length);
        const swap = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        if (value[i] !== "\n") {
          value = value.slice(0, i) + swap + value.slice(i + 1);
          const caret = area.selectionStart;
          area.value = value;
          const next = Math.min(value.length, caret);
          area.setSelectionRange(next, next);
        }
      }
      win.data.text = area.value;
    };
    area.addEventListener("input", onInput);
    win.body.append(area);
    queueMicrotask(() => area.focus());
    return {
      destroy() {
        area.removeEventListener("input", onInput);
      },
    };
  },
};
