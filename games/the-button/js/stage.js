export const NS = "http://www.w3.org/2000/svg";

export function el(name, attrs = {}, kids = []) {
  const node = document.createElementNS(NS, name);
  setAttrs(node, attrs);
  for (const child of kids) {
    if (child) node.append(child);
  }
  return node;
}

export function setAttrs(node, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "text") {
      node.textContent = String(value);
      continue;
    }
    if (key === "class") {
      node.setAttribute("class", String(value));
      continue;
    }
    node.setAttribute(key, String(value));
  }
}

function pattern(id, href, size) {
  return el("pattern", {
    id,
    patternUnits: "userSpaceOnUse",
    width: String(size),
    height: String(size),
  }, [
    el("image", {
      href,
      width: String(size),
      height: String(size),
      preserveAspectRatio: "none",
    }),
  ]);
}

function layer(name) {
  return el("g", { "data-layer": name, class: `ly ly-${name}` });
}

export function createStage(picture, cosmos) {
  const defs = el("defs", {}, [
    pattern("pat-paper", "./assets/paper-grain.png", 180),
    pattern("pat-sticker", "./assets/sticker.png", 96),
    pattern("pat-cloud", "./assets/cloud.png", 140),
    pattern("pat-brick", "./assets/brick.png", 72),
    pattern("pat-grass", "./assets/grass.png", 90),
  ]);
  picture.prepend(defs);

  const pictureLayers = {
    sky: layer("sky"),
    far: layer("far"),
    ground: layer("ground"),
    under: layer("under"),
    mid: layer("mid"),
    life: layer("life"),
    near: layer("near"),
    fx: layer("fx"),
    proc: layer("proc"),
  };
  for (const node of Object.values(pictureLayers)) picture.append(node);

  const cosmosLayers = {
    space: layer("space"),
    worlds: layer("worlds"),
    weather: layer("weather"),
    proc2: layer("proc2"),
  };
  for (const node of Object.values(cosmosLayers)) cosmos.append(node);

  const layers = { ...pictureLayers, ...cosmosLayers };

  function getLayer(name) {
    return layers[name] || layers.proc;
  }

  function group(layerName, attrs = {}) {
    const g = el("g", attrs);
    getLayer(layerName).append(g);
    return g;
  }

  function add(layerName, node) {
    getLayer(layerName).append(node);
    return node;
  }

  function clear() {
    for (const node of Object.values(layers)) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }
  }

  return {
    picture,
    cosmos,
    layers,
    el,
    setAttrs,
    group,
    add,
    getLayer,
    clear,
  };
}
