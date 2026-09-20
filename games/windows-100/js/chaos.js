import {
  addChaos,
  pulseAll,
  reducedMotion,
  state,
  tierIndex,
} from "./state.js";

/**
 * Table-driven dérèglement. Lookup by chaos value, never a chain of 100 branches.
 * Numeric extras (clock100, repairLies) are thresholds on the same row object.
 */
export const TIERS = [
  {
    id: 0,
    min: 0,
    max: 19,
    clockSkip: false,
    clockBack: false,
    clock100: false,
    iconTypo: false,
    dragDelay: false,
    swapBtns: false,
    drift: false,
    emptyDialog: false,
    fileTypo: false,
    tears: false,
    taskbarShift: false,
    spawnOff: false,
    notepadMutate: false,
    unsolicited: false,
    jitter: false,
    closeMin: false,
    gravity: false,
    startLie: false,
    trashLie: false,
    repairLies: false,
    invertFlash: false,
    terminal: false,
    finale: false,
  },
  {
    id: 1,
    min: 20,
    max: 39,
    clockSkip: true,
    iconTypo: true,
    dragDelay: true,
  },
  {
    id: 2,
    min: 40,
    max: 59,
    clockSkip: true,
    iconTypo: true,
    swapBtns: true,
    drift: true,
    emptyDialog: true,
    fileTypo: true,
  },
  {
    id: 3,
    min: 60,
    max: 79,
    clockSkip: true,
    clockBack: true,
    iconTypo: true,
    swapBtns: true,
    emptyDialog: true,
    fileTypo: true,
    tears: true,
    taskbarShift: true,
    spawnOff: true,
    notepadMutate: true,
    unsolicited: true,
  },
  {
    id: 4,
    min: 80,
    max: 94,
    clockSkip: true,
    clockBack: true,
    iconTypo: true,
    emptyDialog: true,
    fileTypo: true,
    tears: true,
    taskbarShift: true,
    spawnOff: true,
    notepadMutate: true,
    jitter: true,
    closeMin: true,
    gravity: true,
    startLie: true,
    trashLie: true,
    repairLies: true,
  },
  {
    id: 5,
    min: 95,
    max: 99,
    clockSkip: true,
    clockBack: true,
    clock100: true,
    iconTypo: true,
    emptyDialog: true,
    fileTypo: true,
    tears: true,
    taskbarShift: true,
    spawnOff: true,
    notepadMutate: true,
    jitter: true,
    gravity: true,
    startLie: true,
    trashLie: true,
    repairLies: true,
    invertFlash: true,
    terminal: true,
  },
  {
    id: 6,
    min: 100,
    max: 100,
    clock100: true,
    tears: true,
    terminal: true,
    repairLies: true,
    finale: true,
  },
];

const BASE = TIERS[0];

export function flags(n = state.chaos) {
  const row = TIERS[tierIndex(n)] || BASE;
  return {
    ...BASE,
    ...row,
    clock100: row.clock100 || n >= 90,
    repairLies: row.repairLies || n >= 80,
  };
}

let pulseTimer = 0;
let motionRaf = 0;
let flashing = false;
let swapping = false;

export function stopChaos() {
  if (pulseTimer) {
    clearTimeout(pulseTimer);
    pulseTimer = 0;
  }
  if (motionRaf) {
    cancelAnimationFrame(motionRaf);
    motionRaf = 0;
  }
}

export function startChaos(ctx) {
  stopChaos();
  let last = performance.now();
  const pulse = () => {
    const now = performance.now();
    const dt = Math.min(2, (now - last) / 1000);
    last = now;
    tick(ctx, dt, now);
    pulseTimer = setTimeout(pulse, 1000);
  };
  pulseTimer = setTimeout(pulse, 1000);
  kickMotion(ctx);
}

function tick(ctx, dt, now) {
  if (state.flags.booting || state.flags.finale) {
    ctx.taskbar?.refreshTray();
    return;
  }

  addChaos(0.25 * dt);

  const idleFor = now - state.lastInput;
  if (idleFor > 8000) {
    addChaos((0.15 / 60) * dt);
  }

  if (state.chaos >= 100) {
    pulseAll();
    ctx.taskbar?.refreshTray();
    ctx.wm.enterFinale();
    return;
  }

  const f = flags();
  tickClock(f, now);
  tickUnsolicited(ctx, f, now);
  tickFlash(f, now);
  tickSwap(ctx, f, now);

  pulseAll();
  ctx.taskbar?.refreshTray();
  kickMotion(ctx);
}

function tickClock(f, now) {
  if (f.clock100) return;
  if (f.clockSkip && Math.random() < 0.22) {
    if (Math.random() < 0.5) {
      state.clockFreezeUntil = now + 900;
      state.clockFreezeUntilStamp = Date.now() + state.clockSkew;
    } else {
      state.clockSkew += (Math.random() < 0.5 ? 1 : -1) * 45000;
    }
  }
  if (f.clockBack) {
    if (now < state.clockBackUntil) {
      state.clockSkew -= 1800;
    } else if (Math.random() < 0.2) {
      state.clockBackUntil = now + 7000;
    }
  }
}

function tickUnsolicited(ctx, f, now) {
  if (!f.unsolicited) return;
  if (now - state.lastUnsolicited < 8000) return;
  if (ctx.wm.liveCount() >= 8) return;
  state.lastUnsolicited = now;
  ctx.wm.open("alert");
}

function tickFlash(f, now) {
  if (!f.invertFlash || reducedMotion()) return;
  if (flashing) return;
  if (now - state.lastFlash < 2600) return;
  if (Math.random() > 0.28) return;
  state.lastFlash = now;
  flashing = true;
  document.documentElement.classList.add("flash-inv");
  setTimeout(() => {
    document.documentElement.classList.remove("flash-inv");
    flashing = false;
  }, 140);
}

function tickSwap(ctx, f, now) {
  if (!f.swapBtns || swapping) return;
  if (now - state.lastSwap < 5000) return;
  if (Math.random() > 0.4) return;
  state.lastSwap = now;
  swapping = true;
  ctx.wm.setTitleSwap(true);
  setTimeout(() => {
    ctx.wm.setTitleSwap(false);
    swapping = false;
  }, 1400);
}

export function kickMotion(ctx) {
  if (motionRaf) return;
  if (!needsMotion(ctx)) return;
  let last = performance.now();
  const step = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (!reducedMotion()) ctx.wm.tickMotion(dt);
    if (needsMotion(ctx)) motionRaf = requestAnimationFrame(step);
    else motionRaf = 0;
  };
  motionRaf = requestAnimationFrame(step);
}

function needsMotion(ctx) {
  if (reducedMotion() || state.flags.finale || state.flags.booting) return false;
  if (ctx.wm.drag) return false;
  const f = flags();
  if (!f.drift && !f.gravity) return false;
  return ctx.wm.hasDriftable();
}
