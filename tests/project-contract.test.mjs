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
  assert.equal(pkg.scripts["test:browser"], "playwright test --project=msedge");
  assert.equal(pkg.scripts["verify:astro"], "astro check");
  assert.equal(pkg.scripts["verify:format"], "prettier --check --ignore-unknown .");
  assert.equal(pkg.scripts["verify:source"], "pnpm test:source");
});

test("Astro emits a static custom-domain site through Tailwind Vite", async () => {
  const config = await read("astro.config.mjs");

  assert.match(config, /site:\s*"https:\/\/mithrilstudio\.com"/);
  assert.match(config, /output:\s*"static"/);
  assert.match(config, /tailwindcss\(\)/);
  assert.match(config, /cssMinify:\s*false/);
  assert.doesNotMatch(config, /\bbase\s*:/);
});

test("pnpm keeps its supply-chain guard while allowing reviewed builds", async () => {
  const config = await read("pnpm-workspace.yaml");

  assert.match(config, /^minimumReleaseAge:\s*1440$/m);
  assert.match(config, /^\s+- astro@7\.0\.9$/m);
  assert.match(config, /^allowBuilds:\s*$/m);
  assert.match(config, /^\s+esbuild:\s*true$/m);
});

test("TypeScript excludes generated and user-tool directories", async () => {
  const config = JSON.parse(await read("tsconfig.json"));

  assert.deepEqual(config.exclude.sort(), [".kilo", ".playwright-mcp", "build", "dist"]);
});

test("analytics scripts declare their inline execution explicitly", async () => {
  const component = await read("src/components/shared/Analytics.astro");

  assert.equal(component.match(/\bis:inline\b/g)?.length, 3);
});

test("local launchers keep Astro attached to the foreground", async () => {
  const launchers = await Promise.all(
    ["start-local-server.ps1", "start-local-server.sh", "start-local-server.cmd"].map(read),
  );

  for (const launcher of launchers) {
    assert.match(launcher, /pnpm/);
    assert.match(launcher, /dev/);
    assert.match(launcher, /ASTRO_DEV_BACKGROUND/);
    assert.doesNotMatch(launcher, /local-web-server\.mjs/);
  }

  assert.match(launchers[0], /& pnpm dev/);
  assert.match(launchers[1], /exec pnpm dev/);
  assert.match(launchers[2], /pnpm dev/);
  await assert.rejects(read("scripts/local-web-server.mjs"), {
    code: "ENOENT",
  });
});

test("Pages workflow builds with pnpm and publishes only dist", async () => {
  const workflow = await read(".github/workflows/deploy-gh-pages.yml");

  for (const token of [
    "PUBLISH_DIR: source/dist",
    "pnpm/action-setup@v6",
    "actions/setup-node@v6",
    "version: 11",
    "node-version: 24",
    "cache: pnpm",
    "pnpm install --frozen-lockfile",
    "pnpm build",
    "bash .githooks/lfs-guard.sh --tree HEAD",
    "git lfs fsck --pointers",
    "git lfs fetch origin HEAD",
    "git lfs fsck --objects",
    'if [ -z "${WEBSITE_DEPLOY_KEY}" ]',
    "StrictHostKeyChecking=yes",
    "GITHUB_REPOSITORY",
    'git push --force origin "HEAD:${PUBLISH_BRANCH}"',
  ]) {
    assert.ok(workflow.includes(token), `missing workflow token: ${token}`);
  }

  assert.doesNotMatch(workflow, /\b_site\b/);
  assert.doesNotMatch(workflow, /\brsync\b/);
});
