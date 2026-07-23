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
