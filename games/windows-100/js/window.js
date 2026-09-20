let seq = 1;

export function nextId() {
  return `w${seq++}`;
}

export function resetIds() {
  seq = 1;
}

export function h(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (val == null || val === false) continue;
    if (key === "class") node.className = val;
    else if (key === "text") node.textContent = val;
    else if (key === "style" && typeof val === "object") Object.assign(node.style, val);
    else if (key.startsWith("on") && typeof val === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === "dataset" && typeof val === "object") {
      Object.assign(node.dataset, val);
    } else if (val === true) node.setAttribute(key, "");
    else node.setAttribute(key, String(val));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(typeof kid === "string" ? document.createTextNode(kid) : kid);
  }
  return node;
}

export function createWindowRecord(spec) {
  return {
    id: spec.id,
    appId: spec.appId,
    title: spec.title,
    x: spec.x,
    y: spec.y,
    w: spec.w,
    h: spec.h,
    z: spec.z,
    minimized: false,
    maximized: false,
    closed: false,
    focused: false,
    el: null,
    restore: null,
    data: spec.data || {},
    instance: null,
    chrome: null,
  };
}

export function mountWindow(win, hooks) {
  const titleId = `${win.id}-title`;
  const btnMin = h("button", {
    type: "button",
    class: "win-btn btn-min",
    "aria-label": "réduire",
    text: "–",
  });
  const btnMax = h("button", {
    type: "button",
    class: "win-btn btn-max",
    "aria-label": "agrandir",
    text: "□",
  });
  const btnClose = h("button", {
    type: "button",
    class: "win-btn btn-close",
    "aria-label": "fermer",
    text: "×",
  });
  const btns = h("div", { class: "win-btns" }, btnMin, btnMax, btnClose);
  const mark = h("span", { class: "win-mark", "aria-hidden": "true" });
  const title = h("span", { class: "win-title", id: titleId, text: win.title });
  const bar = h("div", { class: "win-bar" }, mark, title, btns);
  const body = h("div", { class: "win-body" });
  const el = h("div", {
    class: "win",
    role: "dialog",
    "aria-labelledby": titleId,
    dataset: { id: win.id, app: win.appId },
  }, bar, body);

  if (win.chrome?.hideMin) btnMin.hidden = true;
  if (win.chrome?.hideMax) btnMax.hidden = true;
  if (win.chrome?.hideClose) btnClose.hidden = true;

  const onFocus = (e) => hooks.focus(win.id, e);
  const onMin = (e) => {
    e.stopPropagation();
    hooks.minimize(win.id);
  };
  const onMax = (e) => {
    e.stopPropagation();
    hooks.maximize(win.id);
  };
  const onClose = (e) => {
    e.stopPropagation();
    hooks.close(win.id);
  };

  el.addEventListener("pointerdown", onFocus);
  btnMin.addEventListener("click", onMin);
  btnMax.addEventListener("click", onMax);
  btnClose.addEventListener("click", onClose);

  win.el = el;
  win.bar = bar;
  win.body = body;
  win.titleEl = title;
  win.btnMax = btnMax;

  return {
    destroy() {
      el.removeEventListener("pointerdown", onFocus);
      btnMin.removeEventListener("click", onMin);
      btnMax.removeEventListener("click", onMax);
      btnClose.removeEventListener("click", onClose);
      win.instance?.destroy?.();
      win.instance = null;
      el.remove();
      win.el = null;
      win.bar = null;
      win.body = null;
      win.titleEl = null;
      win.btnMax = null;
    },
  };
}

export function applyBox(win, bounds) {
  const el = win.el;
  if (!el) return;
  el.hidden = win.minimized;
  el.setAttribute("aria-hidden", win.minimized ? "true" : "false");
  if (win.minimized) return;
  if (win.maximized) {
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.width = `${bounds.w}px`;
    el.style.height = `${bounds.h}px`;
  } else {
    el.style.left = `${Math.round(win.x)}px`;
    el.style.top = `${Math.round(win.y)}px`;
    el.style.width = `${Math.round(win.w)}px`;
    el.style.height = `${Math.round(win.h)}px`;
  }
  el.style.zIndex = String(win.z);
  el.classList.toggle("is-max", win.maximized);
  el.classList.toggle("is-focus", win.focused);
}

export function setTitle(win, title) {
  win.title = title;
  if (win.titleEl) win.titleEl.textContent = title;
}

export function clampWin(win, bounds) {
  const barH = 28;
  const minVisible = 72;
  win.w = Math.max(200, Math.min(win.w, bounds.w));
  win.h = Math.max(120, Math.min(win.h, bounds.h));
  win.x = Math.min(Math.max(win.x, minVisible - win.w), bounds.w - minVisible);
  win.y = Math.min(Math.max(win.y, 0), Math.max(0, bounds.h - barH));
}
