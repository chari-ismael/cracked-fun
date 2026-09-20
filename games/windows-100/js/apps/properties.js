import { h } from "../window.js";
import { clockLabel } from "../state.js";

export default {
  id: "properties",
  title: "Propriétés",
  menu: false,
  icon: "folder",
  w: 300,
  h: 220,
  chrome: { hideMax: true },
  mount(win) {
    const name = win.data.name || "fichier";
    const kind = win.data.kind || "document Bureau";
    win.body.append(
      h("div", { class: "set-wrap" },
        h("p", { class: "prop-line" }, h("b", { text: "nom" }), ` ${name}`),
        h("p", { class: "prop-line" }, h("b", { text: "type" }), ` ${kind}`),
        h("p", { class: "prop-line" }, h("b", { text: "taille" }), " 12 Ko"),
        h("p", { class: "prop-line" }, h("b", { text: "modifié" }), ` ${clockLabel()}`),
        h("p", { class: "set-hint", text: "ce n’est pas une photo. c’est une plante, dit Bureau." }),
      ),
    );
    return { destroy() {} };
  },
};
