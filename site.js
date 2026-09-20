(() => {
  const shelf = document.getElementById("shelf");
  shelf.replaceChildren(...EXPERIENCES.map(renderCard));
  trackEyes();
})();

function renderCard(item) {
  const link = document.createElement("a");
  link.className = "game-link";
  link.href = item.href || `games/${item.slug}/`;

  const img = document.createElement("img");
  img.className = "game-image";
  img.alt = item.title;
  img.src = item.thumb || `games/${item.slug}/thumb.svg`;

  link.append(img);
  return link;
}

/* Pupils follow the pointer anywhere on the page, like neal.fun. Never unbound. */
function trackEyes() {
  const pupils = document.querySelectorAll(".logo-face .pupil");
  if (!pupils.length) return;

  const rest = Array.from(pupils, (el) => ({
    el,
    cx: Number(el.getAttribute("cx")) || 0,
    cy: Number(el.getAttribute("cy")) || 0,
  }));
  const MAX = 2.4;

  const look = (clientX, clientY) => {
    for (const p of rest) {
      const eye = p.el.closest(".eye") || p.el;
      const rect = eye.getBoundingClientRect();
      const ex = rect.left + rect.width / 2;
      const ey = rect.top + rect.height / 2;
      const dx = clientX - ex;
      const dy = clientY - ey;
      const dist = Math.hypot(dx, dy) || 1;
      const t = Math.min(1, dist / 160);
      p.el.setAttribute("cx", (p.cx + (dx / dist) * MAX * t).toFixed(2));
      p.el.setAttribute("cy", (p.cy + (dy / dist) * MAX * t).toFixed(2));
    }
  };

  window.addEventListener("pointermove", (event) => look(event.clientX, event.clientY), { passive: true });
  window.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) look(touch.clientX, touch.clientY);
  }, { passive: true });
}
