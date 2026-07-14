import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const sharedTokens = [
  "G-TYCXYX29SE",
  "39a8f49e9a834a78b557a304d7ed5dc7",
  "https://beian.miit.gov.cn/",
  "沪ICP备2026032805号-1",
];

test("legacy root keeps every redirect fallback", async () => {
  const html = await read("index.html");
  assert.match(html, /rel="canonical" href="\.\/we-are-back\/"/);
  assert.match(html, /http-equiv="refresh" content="0; url=\.\/we-are-back\/"/);
  assert.match(html, /window\.location\.replace\("\.\/we-are-back\/"\)/);
  assert.match(html, /href="\.\/we-are-back\/"/);
  for (const token of sharedTokens.slice(0, 2)) {
    assert.ok(html.includes(token), `missing root token: ${token}`);
  }
});

test("legacy landing keeps media, integrations, links, and recovery behavior", async () => {
  const html = await read("we-are-back/index.html");
  for (const token of [
    "../static/bg.jpg",
    "../static/bg.mp4",
    "../static/bg_4k.mp4",
    "backgroundVideoSources",
    "configureBackgroundVideo",
    "replaceBackgroundWithVideo",
    "BACKGROUND_PLAY_RETRY_DELAYS_MS = [0, 300, 1200]",
    "BACKGROUND_PAUSE_RESUME_DELAYS_MS = [80, 300, 1200]",
    "https://store.steampowered.com/app/4864320",
    "https://www.youtube.com/watch?v=4CpC8Gbq9D0",
    "https://discord.gg/qs2WB5ARqr",
    "mailto:contact@myrionstudio.com",
    ...sharedTokens,
  ]) {
    assert.ok(html.includes(token), `missing landing token: ${token}`);
  }
});

test("legacy 404 keeps its content, navigation, and integrations", async () => {
  const html = await read("404.html");
  for (const token of [
    "404",
    "Page Not Found",
    "This Gate Is Missing",
    "The page you requested is not here.",
    'href="/we-are-back/"',
    "/static/bg.jpg",
    "/static/bg.mp4",
    ...sharedTokens,
  ]) {
    assert.ok(html.includes(token), `missing 404 token: ${token}`);
  }
});
