import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("creates a GitHub Pages-ready static export", async () => {
  const htmlPath = new URL("out/index.html", root);
  await access(htmlPath);
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /<html lang="hi"/);
  assert.match(html, /मस्ती की पाठशाला/);
  assert.match(html, /GSSS Mariwara/);
  assert.match(html, /दिन 1 शुरू करें/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("includes the requested classroom interactions", async () => {
  const source = await readFile(new URL("app/MastiApp.tsx", root), "utf8");

  assert.match(source, /पहचानो तो जानें/);
  assert.match(source, /हमारी कक्षा के 16 सितारे/);
  assert.match(source, /const STAR_COUNT = 16/);
  assert.match(source, /playApplause/);
  assert.match(source, /celebrationPieces/);
  assert.match(source, /compressPhoto/);
  assert.match(source, /localStorage/);
  assert.match(source, /toggleTheme/);
});

test("includes the interactive toffee baseline game", async () => {
  const game = await readFile(new URL("app/ToffeeGame.tsx", root), "utf8");
  const app = await readFile(new URL("app/MastiApp.tsx", root), "utf8");

  assert.match(app, /#toffee-game/);
  assert.match(app, /टॉफ़ी खेल/);
  assert.match(game, /टॉफ़ी का खेल/);
  assert.match(game, /const rounds: ToffeeRound\[\]/);
  assert.match(game, /पहली कोशिश में/);
  assert.match(game, /बराबर बाँटना/);
  assert.match(game, /शिक्षक झलक/);
  assert.match(game, /औपचारिक परीक्षा/);
});

test("includes the cooperative balloon belonging game", async () => {
  const game = await readFile(new URL("app/BalloonGame.tsx", root), "utf8");
  const app = await readFile(new URL("app/MastiApp.tsx", root), "utf8");

  assert.match(app, /#balloon-game/);
  assert.match(app, /गुब्बारा/);
  assert.match(game, /गुब्बारा बचाओ!/);
  assert.match(game, /const prompts: ConnectionPrompt\[\]/);
  assert.match(game, /कोई जवाब देना या खड़ा होना ज़रूरी नहीं/);
  assert.match(game, /सुरक्षा वाल्व सवाल/);
  assert.match(game, /टीम से मदद लें/);
  assert.match(game, /गुब्बारा फूटा… टीम नहीं/);
  assert.match(game, /कोई बात नहीं, फिर कोशिश/);
});
