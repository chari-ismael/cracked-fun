async function exec(page, cmd) {
  await page.evaluate(() => {
    document.documentElement.dataset.crackOut = "";
  });
  await page.evaluate((c) => {
    document.documentElement.dataset.crackCmd = c;
  }, JSON.stringify(cmd));
  await page.waitForFunction(() => document.documentElement.dataset.crackOut, { timeout: 4000 });
  return page.evaluate(() => JSON.parse(document.documentElement.dataset.crackOut));
}

export default async function run(page) {
  await page.waitForFunction(() => document.documentElement.dataset.crack === "ok", { timeout: 8000 });

  const results = [];
  const ok = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail ?? "" });

  let r = await exec(page, { op: "snapshot" });
  ok("maze a des pastilles", r.error == null && r.result.pellets > 200, JSON.stringify(r));
  ok("lancement sur le choix S/B", r.error == null && r.result.status === "pick", JSON.stringify(r));

  r = await exec(page, { op: "playNow", hero: "s" });
  r = await exec(page, { op: "placePlayer", x: 13, y: 23, facing: "up", next: "up" });
  r = await exec(page, { op: "update", n: 40, ghost: 0 });
  ok("TEST 2 ne traverse pas le mur", r.error == null && r.result.player.y >= 23 && r.result.blocked, JSON.stringify(r));
  ok("héros le S sélectionné", r.error == null && r.result.hero === "s", JSON.stringify(r));

  r = await exec(page, { op: "playNow", hero: "b" });
  r = await exec(page, { op: "freezeGhosts" });
  r = await exec(page, { op: "placePlayer", x: 1, y: 1, facing: "right", next: "right" });
  r = await exec(page, {
    op: "simMove",
    n: 800,
    marks: [
      { x: 12, y: 1, dir: "down" },
      { x: 12, y: 5, dir: "left" },
      { x: 1, y: 5, dir: "up" },
    ],
  });
  ok("TEST 1/3 deplacement et virages", r.error == null && r.result.tiles >= 8 && r.result.turns >= 2, JSON.stringify(r));
  ok("héros le B sélectionné", r.error == null && r.result.hero === "b", JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "set", score: 0 });
  r = await exec(page, { op: "placePlayer", x: 1, y: 1, facing: "right", next: "right" });
  const before = (await exec(page, { op: "snapshot" })).result.pellets;
  r = await exec(page, { op: "update", n: 80 });
  ok("TEST 4/8 pastille + score", r.error == null && r.result.pellets < before && r.result.score >= 10, JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "placePlayer", x: 1, y: 3, facing: "left" });
  r = await exec(page, { op: "powerCell", i: 3 * 28 + 1 });
  r = await exec(page, { op: "update", n: 20 });
  ok("TEST 5 power pellet frightened", r.error == null && r.result.fright > 0, JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "set", lives: 3, fright: 0 });
  r = await exec(page, { op: "kill" });
  ok("TEST 6 mort du joueur", r.error == null && r.result.status === "dying" && r.result.lives === 2, JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "set", score: 0, fright: 5 });
  r = await exec(page, { op: "placePlayer", x: 6, y: 5, facing: "left" });
  r = await exec(page, { op: "placeGhost", i: 0, x: 6, y: 5, facing: "right", state: "frightened" });
  r = await exec(page, { op: "update", n: 1, ghost: 0 });
  ok("TEST 7 fantome frightened mange", r.error == null && r.result.ghostState === "eaten" && r.result.score >= 200 && r.result.status === "playing", JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "placeGhost", i: 0, x: 1, y: 29, facing: "right", state: "eaten" });
  r = await exec(page, { op: "update", n: 2400, ghost: 0 });
  const st = r.result?.ghostState;
  ok(
    "yeux mangés rejoignent la maison",
    r.error == null && (st === "entering" || st === "inHouse" || st === "leaving" || st === "scatter" || st === "chase"),
    JSON.stringify(r),
  );

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "clearPelletsExcept", tiles: [{ x: 1, y: 1 }] });
  r = await exec(page, { op: "placePlayer", x: 1, y: 1, facing: "right" });
  r = await exec(page, { op: "update", n: 1 });
  ok("TEST 9 fin de niveau", r.error == null && r.result.status === "levelComplete" && r.result.pellets === 0, JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "set", lives: 0 });
  r = await exec(page, { op: "kill" });
  r = await exec(page, { op: "update", n: 200 });
  const afterDie = r.result.status;
  r = await exec(page, { op: "start", hero: "s" });
  ok("TEST 10 GAME OVER", afterDie === "gameover", JSON.stringify({ afterDie }));
  ok("TEST 11 RESTART", r.error == null && r.result.status === "ready" && r.result.lives === 3 && r.result.level === 1, JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "dir", dir: "up" });
  const up = r.result.player.dir === "up" || r.result.playerDir === "up";
  r = await exec(page, { op: "dir", dir: "left" });
  ok("TEST 12-15 commandes unifiees", up && r.result.playerDir === "left", JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  r = await exec(page, { op: "fpsCompare" });
  ok("TEST 16 distance independante du FPS", r.error == null && r.result.diff < 2, JSON.stringify(r));

  r = await exec(page, { op: "wallLeaks" });
  ok("aucune case WALL walkable", r.error == null && r.result === 0, JSON.stringify(r));

  r = await exec(page, { op: "hasRun" });
  ok("pas d'eval / run arbitraire", r.error == null && r.result === "undefined", JSON.stringify(r));

  r = await exec(page, { op: "playNow" });
  const m1 = (await exec(page, { op: "mazeInfo" })).result;
  ok("labyrinthe généré : pastilles > 200", m1 && m1.pellets > 200, JSON.stringify(m1));
  ok("labyrinthe : aucune WALL walkable", m1 && m1.wallWalk === 0, JSON.stringify(m1));
  ok("labyrinthe : spawn joint une pastille lointaine", m1 && m1.pathToFar && m1.exitReach, JSON.stringify(m1));
  ok("labyrinthe : 4 super-pastilles", m1 && m1.powers === 4, JSON.stringify(m1));

  const m2 = (await exec(page, { op: "loadLevel", level: 2 })).result;
  ok("niveau 2 différent du niveau 1", m2 && m1 && m2.hash !== m1.hash, JSON.stringify({ h1: m1?.hash, h2: m2?.hash, p2: m2?.pellets }));
  ok("niveau 2 encore jouable", m2 && m2.pellets > 200 && m2.wallWalk === 0 && m2.pathToFar, JSON.stringify(m2));

  r = await exec(page, { op: "loadLevel", level: 1 });
  r = await exec(page, { op: "placePlayer", x: 12, y: 5, facing: "left" });
  r = await exec(page, { op: "ghostPick", i: 0, x: 1, y: 5, facing: "right", state: "chase" });
  const redPick = r.result;
  const redPath = (await exec(page, { op: "pathDir", fx: 1, fy: 5, tx: 12, ty: 5, forbid: "left" })).result;
  ok(
    "rouge BFS vers le joueur",
    r.error == null && redPick.nextDir === "right" && redPath.dir === "right",
    JSON.stringify({ redPick, redPath }),
  );
  r = await exec(page, { op: "ghostPick", i: 0, x: 1, y: 5, facing: "right", state: "chase" });
  ok("rouge déterministe", r.error == null && r.result.nextDir === redPick.nextDir, JSON.stringify(r));

  r = await exec(page, { op: "placePlayer", x: 6, y: 5, facing: "left" });
  r = await exec(page, { op: "ghostPick", i: 3, x: 8, y: 5, facing: "left", state: "chase" });
  const shy = r.result;
  const shyPath = (await exec(page, { op: "pathDir", fx: 8, fy: 5, tx: shy.goal.x, ty: shy.goal.y, forbid: "right" })).result;
  ok(
    "orange fuit vers son coin (BFS scatter)",
    r.error == null && shy.personality === "shy" && shy.nextDir === shyPath.dir && (shy.target.x !== 6 || shy.target.y !== 5),
    JSON.stringify({ shy, shyPath }),
  );

  return {
    passed: results.filter((x) => x.pass).length,
    failed: results.filter((x) => !x.pass),
    results,
  };
}
