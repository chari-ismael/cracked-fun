/* HUD et overlays : mis à jour uniquement quand l'état change. */

export class UI {
  constructor() {
    this.overlay = document.getElementById("overlay");
    this.title = document.getElementById("overlayTitle");
    this.hint = document.getElementById("overlayHint");
    this.btn = document.getElementById("startBtn");
    this.changeBtn = document.getElementById("changeBtn");
    this.picker = document.getElementById("picker");
    this.score = document.getElementById("score");
    this.high = document.getElementById("high");
    this.level = document.getElementById("level");
    this.heroLabel = document.getElementById("heroLabel");
    this.last = {};
  }

  renderPicker(assets, heroes) {
    if (!this.picker) return;
    for (const btn of this.picker.querySelectorAll("[data-hero]")) {
      const id = btn.dataset.hero;
      const img = btn.querySelector("img");
      const info = heroes[id];
      if (!img || !info) continue;
      img.alt = "";
      const face = assets?.faces?.[id];
      const file = info.file || "";
      const loadedSrc = typeof face?.src === "string" && face.src ? face.src : "";
      const placeholder = typeof face?.toDataURL === "function" ? face.toDataURL() : "";
      // File path first — don't wait for Image() decode, and never leave src empty
      // (empty src shows alt text on the dark circle).
      img.src = file || loadedSrc || placeholder || img.getAttribute("src") || "";
      img.onerror = () => {
        const fallback = assets?.faces?.[id];
        const data = fallback?.toDataURL?.();
        if (data && img.src !== data) img.src = data;
      };
    }
  }

  highlightPick(id) {
    if (!this.picker) return;
    for (const btn of this.picker.querySelectorAll("[data-hero]")) {
      const on = btn.dataset.hero === id;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  hud(score, high, level, lives, heroName) {
    if (this.score && this.last.score !== score) this.score.textContent = String(score);
    if (this.high && this.last.high !== high) this.high.textContent = String(high);
    if (this.level && this.last.level !== level) this.level.textContent = String(level);
    if (this.heroLabel && heroName && this.last.hero !== heroName) this.heroLabel.textContent = heroName;
    this.last = { score, high, level, lives, hero: heroName };
  }

  show(mode, title, hint, button) {
    this.overlay.classList.remove("hidden");
    this.overlay.dataset.mode = mode;
    this.title.textContent = title;
    this.hint.textContent = hint || "";
    const pick = mode === "pick";
    if (this.picker) this.picker.hidden = !pick;
    if (button) {
      this.btn.hidden = false;
      this.btn.textContent = button;
    } else {
      this.btn.hidden = true;
    }
    if (this.changeBtn) this.changeBtn.hidden = mode !== "dead";
  }

  hide() {
    this.overlay.classList.add("hidden");
    this.btn.hidden = true;
    if (this.changeBtn) this.changeBtn.hidden = true;
    if (this.picker) this.picker.hidden = true;
  }
}
