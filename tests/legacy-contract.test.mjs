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

test("BaseLayout adds a cross-domain redirect that maps mithrilstudio.com to myrionstudio.com", async () => {
  const source = await read("src/layouts/BaseLayout.astro");

  // Legacy apex and www hosts are each mapped to their myrionstudio.com counterpart.
  assert.match(source, /host === "www\.mithrilstudio\.com"/);
  assert.match(source, /target = "www\.myrionstudio\.com"/);
  assert.match(source, /host === "mithrilstudio\.com"/);
  assert.match(source, /target = "myrionstudio\.com"/);

  // Path, query, and hash are preserved; the navigation is a replace, not a history push.
  assert.match(source, /window\.location\.pathname/);
  assert.match(source, /window\.location\.search/);
  assert.match(source, /window\.location\.hash/);
  assert.match(source, /window\.location\.replace/);
});

test("root redirect yields to the cross-domain redirect", async () => {
  const index = await read("src/pages/index.astro");

  // The legacy root-to-landing fallback must still exist...
  assert.match(index, /window\.location\.replace\("\.\/we-are-back\/"\)/);
  // ...but only fire when the cross-domain redirect has not already taken over.
  assert.match(index, /__CROSS_DOMAIN_REDIRECT__/);
});

test("Astro root keeps every redirect fallback", async () => {
  const files = await Promise.all(
    ["src/pages/index.astro", "src/layouts/BaseLayout.astro", "src/components/shared/Analytics.astro"].map(read),
  );
  const source = files.join("\n");

  assert.match(source, /canonical="\.\/we-are-back\/"/);
  assert.match(source, /http-equiv="refresh"/);
  assert.match(source, /content="0; url=\.\/we-are-back\/"/);
  assert.match(source, /window\.location\.replace\("\.\/we-are-back\/"\)/);
  assert.match(source, /href="\.\/we-are-back\/"/);
  for (const token of sharedTokens.slice(0, 2)) {
    assert.ok(source.includes(token), `missing root token: ${token}`);
  }
});

test("Astro landing source preserves the legacy contract in focused units", async () => {
  const paths = [
    "src/pages/we-are-back/index.astro",
    "src/styles/theme.css",
    "src/styles/we-are-back.css",
    "src/components/shared/RegionAwareFonts.astro",
    "src/components/shared/IcpFiling.astro",
    "src/components/we-are-back/HeroBackground.astro",
    "src/components/we-are-back/HeroContent.astro",
    "src/scripts/we-are-back.ts",
    "THIRD_PARTY_NOTICES.md",
    "src/components/shared/Analytics.astro",
  ];
  const files = await Promise.all(paths.map(read));
  const source = files.join("\n");

  assert.match(files[1], /@import\s+["']tailwindcss["']/);
  assert.doesNotMatch(source, /@tailwindcss\/browser/);
  assert.match(files[3], /variant:\s*"landing"\s*\|\s*"not-found"/);
  assert.match(files[8], /1\.0\.0-beta\.63/);
  assert.match(files[8], /522530a/);
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
    "https://www.youtube.com/watch?v=LNXwNEvDnOo",
    "https://discord.gg/qs2WB5ARqr",
    "mailto:contact@myrionstudio.com",
    ...sharedTokens,
  ]) {
    assert.ok(source.includes(token), `missing Astro landing token: ${token}`);
  }
});

test("Astro 404 source preserves the legacy contract in focused units", async () => {
  const paths = [
    "src/pages/404.astro",
    "src/styles/not-found.css",
    "src/components/not-found/NotFoundBackground.astro",
    "src/components/not-found/NotFoundContent.astro",
    "src/scripts/not-found.ts",
    "src/components/shared/RegionAwareFonts.astro",
    "src/components/shared/IcpFiling.astro",
    "src/components/shared/Analytics.astro",
  ];
  const files = await Promise.all(paths.map(read));
  const source = files.join("\n");

  for (const token of [
    "Page Not Found",
    "This Gate Is Missing",
    "The page you requested is not here.",
    'href="/we-are-back/"',
    "/static/bg.jpg",
    "/static/bg.mp4",
    "/static/bottom_highlight.png",
    "notFoundVideo",
    ...sharedTokens,
  ]) {
    assert.ok(source.includes(token), `missing Astro 404 token: ${token}`);
  }
});
