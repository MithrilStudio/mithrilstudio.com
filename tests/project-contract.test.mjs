import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("project metadata uses compatible ranges and pnpm scripts", async () => {
  const pkg = JSON.parse(await read("package.json"));

  assert.equal(pkg.private, true);
  assert.equal(pkg.type, "module");
  assert.equal(pkg.engines.node, ">=24 <25");
  assert.equal(pkg.engines.pnpm, ">=11 <12");
  assert.equal(pkg.packageManager, undefined);

  const expectedDependencies = [
    "@astrojs/check",
    "@playwright/test",
    "@tailwindcss/vite",
    "astro",
    "prettier",
    "prettier-plugin-astro",
    "tailwindcss",
    "typescript",
  ];
  assert.deepEqual(Object.keys(pkg.devDependencies).sort(), expectedDependencies);

  for (const [name, range] of Object.entries(pkg.devDependencies)) {
    assert.match(range, /^\^/, `${name} must use a caret range`);
  }
  assert.match(pkg.devDependencies.typescript, /^\^6\./);

  assert.match(pkg.scripts.verify, /verify:\(astro\|format\|source\)/);
  assert.equal(pkg.scripts.build, "pnpm verify && astro build && pnpm test:output");
  assert.equal(pkg.scripts["verify:astro"], "astro check");
  assert.equal(pkg.scripts["verify:format"], "prettier --check --ignore-unknown .");
  assert.equal(pkg.scripts["verify:source"], "pnpm test:source");
});

test("Astro emits a static custom-domain site through Tailwind Vite", async () => {
  const config = await read("astro.config.mjs");

  assert.match(config, /site:\s*"https:\/\/mithrilstudio\.com"/);
  assert.match(config, /output:\s*"static"/);
  assert.match(config, /tailwindcss\(\)/);
  assert.doesNotMatch(config, /\bbase\s*:/);
});

test("pnpm keeps its supply-chain guard while allowing reviewed builds", async () => {
  const config = await read("pnpm-workspace.yaml");

  assert.match(config, /^minimumReleaseAge:\s*1440$/m);
  assert.match(config, /^\s+- astro@7\.0\.9$/m);
  assert.match(config, /^allowBuilds:\s*$/m);
  assert.match(config, /^\s+esbuild:\s*true$/m);
});
