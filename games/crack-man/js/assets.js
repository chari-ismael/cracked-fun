/* Chargement des visages. Placeholder propre si le fichier manque. */

import { CAST, HEROES } from "./config.js";

export class Assets {
  constructor() {
    this.faces = {};
  }

  async load() {
    const all = [
      ...Object.entries(HEROES),
      ...Object.entries(CAST),
    ];
    await Promise.all(all.map(([id, info]) => this.loadFace(id, info)));
  }

  loadFace(id, info) {
    this.faces[id] = makePlaceholder(info.name, info.color);
    if (!info.file) return Promise.resolve();
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      img.onload = () => {
        this.faces[id] = img;
        done();
      };
      img.onerror = done;
      setTimeout(done, 2500);
      img.src = info.file;
    });
  }
}

function makePlaceholder(label, color) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = color;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(0,0,0,0.18)";
  g.beginPath();
  g.arc(128, 112, 72, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(104, 104, 12, 0, Math.PI * 2);
  g.arc(152, 104, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(104, 106, 6, 0, Math.PI * 2);
  g.arc(152, 106, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#111";
  g.lineWidth = 7;
  g.lineCap = "round";
  g.beginPath();
  g.arc(128, 148, 28, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  g.fillStyle = "#111";
  g.font = "800 26px sans-serif";
  g.textAlign = "center";
  g.fillText(label, 128, 236);
  return c;
}
