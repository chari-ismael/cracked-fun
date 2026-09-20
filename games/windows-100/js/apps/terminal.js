import { chaosLabel } from "../state.js";
import { h } from "../window.js";

export default {
  id: "terminal",
  title: "Terminal",
  menu: false,
  icon: "term",
  w: 420,
  h: 260,
  mount(win, ctx) {
    const out = h("pre", { class: "term-out" });
    const input = h("input", {
      class: "term-in",
      type: "text",
      spellcheck: "false",
      "aria-label": "commande",
      autocomplete: "off",
    });
    const row = h("label", { class: "term-row" }, h("span", { text: ">" }), input);
    win.body.append(h("div", { class: "term" }, out, row));

    const lines = [
      "Bureau noyau 0.9",
      `dérèglement ${chaosLabel()}`,
      "tapez aide",
    ];

    const paint = () => {
      out.textContent = lines.join("\n");
      out.scrollTop = out.scrollHeight;
    };

    const run = (raw) => {
      const cmd = raw.trim().toLowerCase();
      lines.push(`> ${raw}`);
      if (!cmd) {
        paint();
        return;
      }
      if (cmd === "aide") lines.push("aide  statut  fermer  vider  100");
      else if (cmd === "statut") lines.push(`chaos ${chaosLabel()}  fenêtres ${ctx.wm.liveCount()}`);
      else if (cmd === "fermer" || cmd === "exit") {
        paint();
        ctx.wm.close(win.id, { force: true, toTrash: false });
        return;
      } else if (cmd === "vider") {
        lines.length = 0;
        lines.push("(écran vide, bureau toujours là)");
      } else if (cmd === "100") lines.push("pas encore. presque. trop.");
      else if (cmd === "redémarrer") lines.push("le terminal ne redémarre rien. il regarde.");
      else lines.push("commande inconnue. Bureau hausse les épaules.");
      if (lines.length > 40) lines.splice(0, lines.length - 40);
      paint();
    };

    const onKey = (e) => {
      if (e.key === "Enter") {
        run(input.value);
        input.value = "";
      }
    };
    input.addEventListener("keydown", onKey);
    paint();
    queueMicrotask(() => input.focus());

    return {
      destroy() {
        input.removeEventListener("keydown", onKey);
      },
    };
  },
};
