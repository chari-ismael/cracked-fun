import { resolveParts } from "./parts.js";
import { LAYERS } from "./state.js";

const ORIGIN = { x: 180, y: 300 };
const VIEW = { w: 360, h: 460 };
const GROUND_Y = 424;
const parser = new DOMParser();

const DIRTY_FROM = {
  body: LAYERS,
  head: ["head", "eyes", "mouth", "accessory"],
  arms: ["arms", "accessory"],
  legs: LAYERS,
  eyes: ["eyes"],
  mouth: ["mouth"],
  accessory: ["accessory"],
};

export function dirtyLayersFor(category) {
  return DIRTY_FROM[category] || LAYERS;
}

export function layoutOf(parts) {
  const body = parts.body;
  const head = parts.head;
  const origin = { x: ORIGIN.x, y: ORIGIN.y };

  const nest = 16;
  const headPos = {
    x: origin.x + body.anchor.head.x - head.anchor.neck.x,
    y: origin.y + body.anchor.head.y - head.anchor.neck.y + nest,
  };

  return {
    origin,
    headPos,
    eyes: {
      x: headPos.x + head.anchor.eyes.x,
      y: headPos.y + head.anchor.eyes.y,
    },
    mouth: {
      x: headPos.x + head.anchor.mouth.x,
      y: headPos.y + head.anchor.mouth.y,
    },
    crown: {
      x: headPos.x + head.anchor.crown.x,
      y: headPos.y + head.anchor.crown.y,
    },
    neckAcc: {
      x: headPos.x + head.anchor.neckAcc.x,
      y: headPos.y + head.anchor.neckAcc.y,
    },
    armL: {
      x: origin.x + body.anchor.armL.x,
      y: origin.y + body.anchor.armL.y,
    },
    armR: {
      x: origin.x + body.anchor.armR.x,
      y: origin.y + body.anchor.armR.y,
    },
    hip: {
      x: origin.x + body.anchor.hip.x,
      y: origin.y + body.anchor.hip.y,
    },
    spread: body.anchor.spread,
  };
}

function setLayer(group, markup) {
  group.replaceChildren();
  const trimmed = (markup || "").trim();
  if (!trimmed) return;
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${trimmed}</svg>`,
    "image/svg+xml",
  );
  const root = doc.documentElement;
  if (!root || root.querySelector("parsererror")) {
    group.insertAdjacentHTML("afterbegin", trimmed);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const node of [...root.childNodes]) {
    frag.appendChild(document.importNode(node, true));
  }
  group.appendChild(frag);
}

function g(x, y, inner, extra = "") {
  if (!inner) return "";
  return `<g transform="translate(${x} ${y})${extra}">${inner}</g>`;
}

function composeArms(parts, layout) {
  const arm = parts.arms;
  if (!arm.copies) return "";
  const markup = arm.draw();
  if (!markup) return "";
  const copies = arm.copies || 1;
  const angles = arm.angles || [0];
  let out = "";
  for (const side of ["L", "R"]) {
    const sock = side === "L" ? layout.armL : layout.armR;
    const flip = side === "R" ? " scale(-1 1)" : "";
    for (let i = 0; i < copies; i += 1) {
      const rot = angles[i] || 0;
      const extra = `${flip} rotate(${rot})`;
      out += g(sock.x, sock.y, markup, extra);
    }
  }
  return out;
}

function composeLegs(parts, layout) {
  const legs = parts.legs;
  const markup = legs.draw();
  if (!markup) return "";
  if (legs.single) {
    return g(layout.hip.x, layout.hip.y, markup);
  }
  if (legs.tripod) {
    const spread = Math.max(layout.spread, 22);
    const xs = [-spread, 0, spread];
    return xs
      .map((dx, i) => {
        const flip = i === 2 ? " scale(-1 1)" : "";
        return g(layout.hip.x + dx, layout.hip.y, markup, flip);
      })
      .join("");
  }
  const spread = Math.max(layout.spread, 16);
  return (
    g(layout.hip.x - spread, layout.hip.y, markup) +
    g(layout.hip.x + spread, layout.hip.y, markup, " scale(-1 1)")
  );
}

function composeAccessory(parts, layout) {
  const acc = parts.accessory;
  const markup = acc.draw();
  if (!markup) return "";
  if (acc.slot === "hand") {
    const tip = parts.arms.hand || { x: -34, y: 44 };
    return g(layout.armR.x - tip.x, layout.armR.y + tip.y, markup);
  }
  const slot = acc.slot === "neck" ? layout.neckAcc : layout.crown;
  return g(slot.x, slot.y, markup);
}

function fitCreature(svg, parts) {
  const fit = svg.querySelector("#monster-fit");
  const ground = svg.querySelector("#ground");
  if (!fit) return;
  fit.removeAttribute("transform");
  let bb;
  try {
    bb = fit.getBBox();
  } catch {
    return;
  }
  if (!bb.width || !bb.height) return;

  const topPad = 32;
  const sidePad = 22;
  const maxW = VIEW.w - sidePad * 2;
  const maxH = GROUND_Y - topPad;
  const scale = Math.min(maxW / bb.width, maxH / bb.height);
  const cx = bb.x + bb.width / 2;
  const bottom = bb.y + bb.height;
  const lift = parts.legs.float ? 26 : 0;
  const tx = VIEW.w / 2 - cx * scale;
  const ty = GROUND_Y - bottom * scale - lift;
  fit.setAttribute(
    "transform",
    `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`,
  );

  if (!ground) return;
  const rx = Math.max(46, Math.min(96, bb.width * scale * 0.42));
  ground.setAttribute("cx", String(VIEW.w / 2));
  ground.setAttribute("cy", String(GROUND_Y + 8));
  ground.setAttribute("rx", rx.toFixed(1));
}

function composeLayer(layer, parts, layout) {
  switch (layer) {
    case "legs":
      return composeLegs(parts, layout);
    case "body":
      return g(layout.origin.x, layout.origin.y, parts.body.draw());
    case "arms":
      return composeArms(parts, layout);
    case "head":
      return g(layout.headPos.x, layout.headPos.y, parts.head.draw());
    case "eyes":
      return g(layout.eyes.x, layout.eyes.y, parts.eyes.draw());
    case "mouth":
      return g(layout.mouth.x, layout.mouth.y, parts.mouth.draw());
    case "accessory":
      return composeAccessory(parts, layout);
    default:
      return "";
  }
}

export function renderMonster(state, svg, dirty = LAYERS) {
  const parts = resolveParts(state);
  const layout = layoutOf(parts);
  for (const layer of dirty) {
    const group = svg.querySelector(`#layer-${layer}`);
    if (!group) continue;
    setLayer(group, composeLayer(layer, parts, layout));
  }
  fitCreature(svg, parts);
}
