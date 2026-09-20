import { CATEGORY_LABELS, LAYERS, UI_CATEGORIES, cloneState, defaultState } from "./state.js";
import { getPart, partsIn } from "./parts.js";
import { dirtyLayersFor, renderMonster } from "./render.js";
import { detectCombo, randomMonster } from "./random.js";
import { describeMonster } from "./names.js";

export function createUI(svg) {
  const catsEl = document.getElementById("cats");
  const partsEl = document.getElementById("parts");
  const pickerEl = document.getElementById("picker");
  const finaleEl = document.getElementById("finale");
  const nameEl = document.getElementById("monsterName");
  const traitEl = document.getElementById("monsterTrait");
  const actionsEl = document.getElementById("actions");
  const wrap = document.getElementById("creatureWrap");

  let state = defaultState();
  let category = "head";
  let present = false;
  let identity = describeMonster(state);

  function syncCombo() {
    const combo = detectCombo(state);
    state.extras = { combo: combo ? combo.id : null };
  }

  function paint(dirty) {
    renderMonster(state, svg, dirty || LAYERS);
  }

  function setPart(nextId) {
    const piece = getPart(nextId);
    if (!piece) return;
    const prev = state[piece.category];
    if (prev === nextId) return;
    state = cloneState(state);
    state[piece.category] = nextId;
    syncCombo();
    paint(dirtyLayersFor(piece.category));
    markParts();
    if (present) showIdentity();
  }

  function markCats() {
    for (const btn of catsEl.querySelectorAll("button")) {
      btn.setAttribute("aria-selected", btn.dataset.cat === category ? "true" : "false");
    }
  }

  function markParts() {
    const current = state[category];
    for (const btn of partsEl.querySelectorAll("button")) {
      btn.setAttribute("aria-pressed", btn.dataset.id === current ? "true" : "false");
    }
  }

  function drawPartGrid() {
    partsEl.replaceChildren();
    for (const piece of partsIn(category)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "part-btn";
      btn.dataset.id = piece.id;
      btn.setAttribute("aria-label", piece.label);
      btn.innerHTML = `<svg viewBox="${piece.glyphBox}" aria-hidden="true">${piece.glyph()}</svg>`;
      btn.addEventListener("click", () => setPart(piece.id));
      partsEl.append(btn);
    }
    markParts();
  }

  function drawCats() {
    catsEl.replaceChildren();
    for (const id of UI_CATEGORIES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.cat = id;
      btn.id = `tab-${id}`;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", "parts");
      btn.textContent = CATEGORY_LABELS[id];
      btn.addEventListener("click", () => setCategory(id));
      catsEl.append(btn);
    }
    markCats();
  }

  function setCategory(id) {
    if (!UI_CATEGORIES.includes(id)) return;
    category = id;
    markCats();
    drawPartGrid();
  }

  function showIdentity() {
    identity = describeMonster(state);
    nameEl.textContent = identity.name;
    traitEl.textContent = identity.trait;
    wrap.querySelector("svg").setAttribute(
      "aria-label",
      `${identity.name}. ${identity.trait}`,
    );
  }

  function enterPresent() {
    present = true;
    document.body.classList.add("is-present");
    pickerEl.hidden = true;
    finaleEl.hidden = false;
    showIdentity();
    renderActions();
  }

  function exitPresent() {
    present = false;
    document.body.classList.remove("is-present");
    pickerEl.hidden = false;
    finaleEl.hidden = true;
    wrap.querySelector("svg").setAttribute("aria-label", "Le monstre");
    renderActions();
  }

  async function copyName() {
    const text = `${identity.name} — ${identity.trait}`;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById("btnCopy");
      if (!btn) return;
      btn.textContent = "copié";
      window.setTimeout(() => {
        if (btn.isConnected) btn.textContent = "copier le nom";
      }, 900);
    } catch {
      /* silencieux */
    }
  }

  function renderActions() {
    actionsEl.replaceChildren();
    if (present) {
      addAction("btnEdit", "modifier", exitPresent);
      addAction("btnAnother", "un autre", () => randomize(true));
      addAction("btnCopy", "copier le nom", copyName);
      return;
    }
    addAction("btnRandom", "au hasard", () => randomize(false));
    addAction("btnReset", "recommencer", reset);
    addAction("btnVoila", "voilà", enterPresent);
  }

  function addAction(id, label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    actionsEl.append(btn);
  }

  function randomize(keepPresent) {
    state = randomMonster();
    paint(LAYERS);
    markParts();
    if (keepPresent || present) {
      if (!present) enterPresent();
      else showIdentity();
    }
  }

  function reset() {
    state = defaultState();
    category = "head";
    if (present) exitPresent();
    markCats();
    drawPartGrid();
    paint(LAYERS);
  }

  function cyclePart(dir) {
    if (present) return;
    const list = partsIn(category);
    const i = list.findIndex((p) => p.id === state[category]);
    const next = list[(i + dir + list.length) % list.length];
    setPart(next.id);
  }

  function cycleCategory(dir) {
    if (present) return;
    const i = UI_CATEGORIES.indexOf(category);
    setCategory(UI_CATEGORIES[(i + dir + UI_CATEGORIES.length) % UI_CATEGORIES.length]);
  }

  function onKey(event) {
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      cyclePart(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      cyclePart(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      cycleCategory(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      cycleCategory(1);
    } else if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      randomize(present);
    } else if (event.key === "Enter") {
      if (!present) {
        event.preventDefault();
        enterPresent();
      }
    }
  }

  drawCats();
  drawPartGrid();
  renderActions();
  paint(LAYERS);
  document.addEventListener("keydown", onKey);

  return {
    randomize,
    reset,
    enterPresent,
    getState: () => state,
  };
}
