import { h } from "../window.js";
import { flags } from "../chaos.js";
import { onChange } from "../state.js";

export const FILES = [
  { id: "lundi", name: "lundi.txt", kind: "note", seed: "lundi.\nracheter du papier.\nne pas ouvrir trop de fenêtres." },
  { id: "courses", name: "courses.txt", kind: "note", seed: "- encre\n- agrafes\n- un second bureau, au cas où" },
  { id: "secret", name: "secret.bru", kind: "note", seed: "le mot de passe c’est bureau\nnon, attends\nbureau?" },
  { id: "plante", name: "plante.jpg", kind: "props", seed: "" },
];

function misspell(name) {
  if (!flags().fileTypo) return name;
  if (name.startsWith("lundi")) return "lundii.txt";
  if (name.startsWith("courses")) return "couses.txt";
  return name;
}

export default {
  id: "files",
  title: "Dossier",
  menu: true,
  icon: "folder",
  trashes: true,
  w: 380,
  h: 280,
  mount(win, ctx) {
    const list = h("ul", { class: "file-list", role: "listbox", "aria-label": "fichiers" });
    win.body.append(list);
    let selected = 0;
    const rows = [];

    const openItem = (file) => {
      if (file.kind === "note") {
        ctx.wm.open("notepad", {
          title: `${misspell(file.name)} — Bloc-notes`,
          data: { seed: file.seed, text: file.seed },
        });
      } else {
        ctx.wm.open("properties", {
          title: "Propriétés",
          data: { name: misspell(file.name), kind: "image (non)" },
        });
      }
    };

    const paint = () => {
      rows.forEach((row, i) => {
        row.el.classList.toggle("is-on", i === selected);
        row.el.tabIndex = i === selected ? 0 : -1;
        row.el.setAttribute("aria-selected", i === selected ? "true" : "false");
        row.name.textContent = misspell(row.file.name);
      });
    };

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    FILES.forEach((file, i) => {
      const name = h("span", { class: "file-name", text: misspell(file.name) });
      const item = h("li", {
        class: "file-item",
        role: "option",
        tabindex: i === 0 ? "0" : "-1",
        "aria-selected": i === 0 ? "true" : "false",
      }, h("span", { class: "file-glyph", "aria-hidden": "true", text: file.kind === "note" ? "≡" : "▣" }), name);
      item.addEventListener("click", () => {
        selected = i;
        paint();
        item.focus();
        if (coarse) openItem(file);
      });
      item.addEventListener("dblclick", () => {
        if (!coarse) openItem(file);
      });
      rows.push({ el: item, name, file });
      list.append(item);
    });

    const onKey = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selected = Math.min(FILES.length - 1, selected + 1);
        paint();
        rows[selected]?.el.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selected = Math.max(0, selected - 1);
        paint();
        rows[selected]?.el.focus();
      } else if (e.key === "Enter") {
        openItem(FILES[selected]);
      }
    };

    list.addEventListener("keydown", onKey);
    const off = onChange(paint);
    paint();

    return {
      destroy() {
        list.removeEventListener("keydown", onKey);
        off();
      },
    };
  },
};
