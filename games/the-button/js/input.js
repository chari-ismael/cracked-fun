export function bindInput(ctx) {
  const { els, state } = ctx;
  let keyArmed = false;
  let pointerArmed = false;
  let fromPointer = false;
  let lastTap = 0;

  function stolen() {
    const ae = document.activeElement;
    return Boolean(ae && ae !== els.btn && ae.matches?.("a, button"));
  }

  function tap() {
    if (state.dialog) return;
    const now = performance.now();
    if (now - lastTap < 8) return;
    lastTap = now;
    ctx.commit();
  }

  function pressOn() {
    ctx.audio.resume();
    state.pressed = 1;
    ctx.paint();
  }

  function pressOff() {
    state.pressed = 0;
    ctx.paint();
  }

  els.btn.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    pointerArmed = true;
    pressOn();
    try {
      els.btn.setPointerCapture(e.pointerId);
    } catch {
      /* optional */
    }
  });

  els.btn.addEventListener("pointerup", (e) => {
    if (e.button) return;
    const armed = pointerArmed;
    pointerArmed = false;
    pressOff();
    if (!armed || keyArmed) return;
    fromPointer = true;
    tap();
  });

  els.btn.addEventListener("pointercancel", () => {
    pointerArmed = false;
    pressOff();
  });

  els.btn.addEventListener("click", (e) => {
    if (keyArmed || fromPointer) {
      fromPointer = false;
      e.preventDefault();
      return;
    }
    tap();
  });

  els.btn.addEventListener("contextmenu", (e) => e.preventDefault());

  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    els.btn.focus({ preventScroll: true });
  });

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.code !== "Enter" && e.key !== " " && e.key !== "Enter") return;
    if (stolen()) return;
    if (state.dialog) return;
    if (e.code === "Space" || e.key === " ") e.preventDefault();
    if (e.repeat) return;
    keyArmed = true;
    pressOn();
    tap();
  });

  window.addEventListener("keyup", (e) => {
    if (e.code !== "Space" && e.code !== "Enter" && e.key !== " " && e.key !== "Enter") return;
    pressOff();
    window.setTimeout(() => {
      keyArmed = false;
    }, 0);
  });

  els.dialog.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => ctx.closeDialog());
  });
  els.dialog.addEventListener("click", (e) => {
    if (e.target === els.dialog) ctx.closeDialog();
  });
}
