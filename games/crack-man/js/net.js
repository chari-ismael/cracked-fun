/* Salons 2 joueurs via PeerJS (cloud public, pas de serveur à nous). */

const PEER_SRC = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i += 1) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function loadPeerLib() {
  if (window.Peer) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PEER_SRC;
    s.async = true;
    s.onload = () => (window.Peer ? resolve() : reject(new Error("PeerJS manquant")));
    s.onerror = () => reject(new Error("PeerJS bloqué"));
    document.head.appendChild(s);
  });
}

export class Net {
  constructor() {
    this.role = "local";
    this.code = "";
    this.peer = null;
    this.conn = null;
    this.ready = false;
    this.onMessage = null;
    this.onStatus = null;
    this.onPeer = null;
  }

  status(text) {
    this.onStatus?.(text);
  }

  send(msg) {
    if (this.conn?.open) this.conn.send(msg);
  }

  wire(conn) {
    this.conn = conn;
    conn.on("data", (msg) => this.onMessage?.(msg));
    const opened = () => {
      if (this.ready && this.conn === conn) return;
      this.ready = true;
      this.status("connecté");
      this.onPeer?.();
    };
    conn.on("open", opened);
    conn.on("close", () => {
      this.ready = false;
      this.status("coupé");
    });
    conn.on("error", () => this.status("erreur réseau"));
    if (conn.open) opened();
  }

  async host() {
    await loadPeerLib();
    this.close();
    this.role = "host";
    this.code = randomCode();
    this.status(`salon ${this.code}…`);
    this.peer = new window.Peer(`crack-${this.code}`, { debug: 0 });
    await new Promise((resolve, reject) => {
      this.peer.on("open", resolve);
      this.peer.on("error", (err) => reject(err));
    });
    this.status(`code ${this.code} — en attente`);
    this.peer.on("connection", (conn) => this.wire(conn));
    return this.code;
  }

  async join(code) {
    await loadPeerLib();
    this.close();
    this.role = "guest";
    this.code = String(code || "").trim().toUpperCase();
    if (this.code.length < 4) throw new Error("code trop court");
    this.status("connexion…");
    this.peer = new window.Peer(undefined, { debug: 0 });
    await new Promise((resolve, reject) => {
      this.peer.on("open", resolve);
      this.peer.on("error", (err) => reject(err));
    });
    const conn = this.peer.connect(`crack-${this.code}`, { reliable: true });
    this.wire(conn);
    return this.code;
  }

  close() {
    try { this.conn?.close(); } catch { /* ignore */ }
    try { this.peer?.destroy(); } catch { /* ignore */ }
    this.conn = null;
    this.peer = null;
    this.ready = false;
    this.role = "local";
    this.code = "";
  }
}
