# Astro and Selective AstroWind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static MithrilStudio site with Astro 7 and selectively adopted AstroWind/Tailwind CSS 4 foundations while preserving the root redirect, the `/we-are-back/` page, the custom `404.html`, and every visible and behavioral detail.

**Architecture:** Astro generates three static routes from focused layouts, components, styles, and vanilla TypeScript. Existing Git LFS media moves unchanged into `public/static/`; contract tests protect source and built output, while Playwright-driven browser checks and temporary screenshots protect runtime behavior and visual parity. GitHub Actions installs with pnpm, runs independent read-only checks concurrently, builds once, validates `dist/`, and force-pushes that directory to `gh-pages` through the existing SSH deploy-key contract.

**Tech Stack:** Astro 7, Tailwind CSS 4 through `@tailwindcss/vite`, selective AstroWind structure, vanilla TypeScript, Node.js 24, pnpm 11, Node test runner, Astro Check, Prettier, Playwright using installed Microsoft Edge, GitHub Actions, Git LFS.

## Global Constraints

- Preserve the public visual result and browser behavior exactly at mobile, desktop, and 4K sizes.
- Keep the root canonical link, meta refresh, `window.location.replace("./we-are-back/")`, and anchor fallback.
- Keep `bg.jpg` visible until video playback is proven and preserve the `bg.mp4` to `bg_4k.mp4` upgrade, playback position, loop, muted/inline state, error fallback, and pause recovery.
- Keep all visible copy, URLs, email links, analytics IDs, Cloudflare token, regional font behavior, and ICP filing behavior unchanged.
- Use static Astro output with `site: "https://mithrilstudio.com"` and no repository base path.
- Resolve current releases immediately before install; use compatible caret ranges in `package.json` and commit the exact `pnpm-lock.yaml`.
- Use the highest compatible TypeScript 6 release while Astro Check excludes TypeScript 7.
- Use pnpm for all dependency and repository commands; run only independent read-only checks concurrently and run `astro build` once.
- Use AstroWind `1.0.0-beta.63@522530a` only as MIT-licensed source provenance; do not import its demo pages, blog, RSS, MDX, icon system, image service, or unused widgets.
- Keep source-branch Git LFS rules and guards; publish expanded files only.
- Publish only `dist/` to `gh-pages` through `WEBSITE_DEPLOY_KEY` and `GITHUB_REPOSITORY`.
- Preserve unrelated user-owned `.kilo/` and `.playwright-mcp/` directories.
- Store all migration screenshots, browser profiles, logs, and diagnostics below `build/astro-migration/`, then remove that directory before completion.

---

### Task 1: Freeze the Legacy Contract and Capture the Visual Baseline

**Files:**
- Create: `tests/legacy-contract.test.mjs`
- Create temporarily: `build/astro-migration/baseline-mobile.png`
- Create temporarily: `build/astro-migration/baseline-desktop.png`
- Create temporarily: `build/astro-migration/baseline-4k.png`
- Inspect: `index.html`
- Inspect: `we-are-back/index.html`
- Inspect: `404.html`

**Interfaces:**
- Consumes: Current production HTML files and `static/` assets.
- Produces: Executable characterization assertions and three ignored reference screenshots used by Task 7.

- [ ] **Step 1: Add characterization tests for immutable public details**

Create `tests/legacy-contract.test.mjs` with Node's built-in test runner. Assert the redirect's four mechanisms; required landing text, links, media sources, `backgroundVideoSources`, `configureBackgroundVideo`, retry delays `80`, `300`, and `1200`; required 404 text and return link; analytics ID `G-TYCXYX29SE`; Cloudflare token `39a8f49e9a834a78b557a304d7ed5dc7`; ICP link `https://beian.miit.gov.cn/`; and the filing text currently present in both full pages. Read files with:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy root keeps every redirect fallback", async () => {
  const html = await read("index.html");
  assert.match(html, /rel="canonical" href="\.\/we-are-back\/"/);
  assert.match(html, /http-equiv="refresh" content="0; url=\.\/we-are-back\/"/);
  assert.match(html, /window\.location\.replace\("\.\/we-are-back\/"\)/);
  assert.match(html, /href="\.\/we-are-back\/"/);
});

test("legacy landing keeps media, analytics, links, and recovery behavior", async () => {
  const html = await read("we-are-back/index.html");
  for (const token of [
    "../static/bg.jpg",
    "../static/bg.mp4",
    "../static/bg_4k.mp4",
    "backgroundVideoSources",
    "configureBackgroundVideo",
    "replaceBackgroundWithVideo",
    "G-TYCXYX29SE",
    "39a8f49e9a834a78b557a304d7ed5dc7",
    "https://beian.miit.gov.cn/",
  ]) {
    assert.ok(html.includes(token), `missing landing token: ${token}`);
  }
  for (const delay of ["80", "300", "1200"]) {
    assert.match(html, new RegExp(`setTimeout\\([^)]*,\\s*${delay}\\)`));
  }
});

test("legacy 404 keeps its content and shared integrations", async () => {
  const html = await read("404.html");
  for (const token of [
    "404",
    "Page Not Found",
    'href="/we-are-back/"',
    "./static/bg.jpg",
    "./static/bg.mp4",
    "G-TYCXYX29SE",
    "39a8f49e9a834a78b557a304d7ed5dc7",
    "https://beian.miit.gov.cn/",
  ]) {
    assert.ok(html.includes(token), `missing 404 token: ${token}`);
  }
});
```

- [ ] **Step 2: Run the characterization tests against the legacy source**

Run: `node --test tests/legacy-contract.test.mjs`

Expected: three passing tests. If a literal differs, update the assertion from the current file rather than changing production HTML.

- [ ] **Step 3: Capture ignored baseline screenshots**

Start the current foreground server as a hidden child process, wait for `http://127.0.0.1:8000/we-are-back/`, and use installed Edge in headless mode to capture `390x844`, `1440x900`, and `3840x2160` screenshots into `build/astro-migration/`. Record the server PID in `build/astro-migration/legacy-server.pid` and terminate only that process after capture.

Expected: three non-empty PNG files and no surviving local server process.

- [ ] **Step 4: Commit the characterization test**

```powershell
git add tests/legacy-contract.test.mjs
git commit -m "test: preserve legacy site contract"
```

Do not add `build/astro-migration/`; it is ignored and temporary.

---

### Task 2: Establish the pnpm, Astro, Tailwind, and Verification Toolchain

**Files:**
- Create: `tests/project-contract.test.mjs`
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.prettierignore`
- Create: `.prettierrc.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Node.js 24, pnpm 11, and current npm registry metadata.
- Produces: `pnpm dev`, `pnpm verify`, `pnpm build`, `pnpm preview`, and stable tool configuration used by every later task.

- [ ] **Step 1: Write a failing project-toolchain contract**

Create `tests/project-contract.test.mjs` that reads `package.json` and `astro.config.mjs`. Assert `type === "module"`, Node engine `>=24 <25`, pnpm engine `>=11 <12`, all direct dependency declarations begin with `^`, scripts use pnpm, the verify command selects `verify:astro`, `verify:format`, and `verify:source`, and Astro config contains the production site, static output, and Tailwind Vite integration.

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("project metadata uses compatible ranges and pnpm scripts", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.type, "module");
  assert.equal(pkg.engines.node, ">=24 <25");
  assert.equal(pkg.engines.pnpm, ">=11 <12");
  for (const [name, range] of Object.entries(pkg.devDependencies)) {
    assert.match(range, /^\^/, `${name} must use a caret range`);
  }
  assert.match(pkg.scripts.verify, /verify:\(astro\|format\|source\)/);
  assert.match(pkg.scripts.build, /^pnpm verify && astro build && pnpm test:output$/);
});

test("Astro emits a static custom-domain site through Tailwind Vite", async () => {
  const config = await read("astro.config.mjs");
  assert.match(config, /site:\s*"https:\/\/mithrilstudio\.com"/);
  assert.match(config, /output:\s*"static"/);
  assert.match(config, /tailwindcss\(\)/);
  assert.doesNotMatch(config, /base:/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/project-contract.test.mjs`

Expected: FAIL with `ENOENT` for `package.json`.

- [ ] **Step 3: Resolve latest compatible releases and initialize the package**

Verify live registry versions with `pnpm view`. Initialize a private package, then install current releases with caret ranges:

```powershell
pnpm add -D astro@latest tailwindcss@latest '@tailwindcss/vite@latest' '@astrojs/check@latest' 'typescript@^6' prettier@latest prettier-plugin-astro@latest '@playwright/test@latest'
```

Do not add a fixed `packageManager` field. Keep only `devDependencies`; the generated site has no runtime server dependency.

- [ ] **Step 4: Add the minimal configuration**

Use this Astro configuration:

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://mithrilstudio.com",
  output: "static",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Extend `astro/tsconfigs/strict` in `tsconfig.json`. Configure Prettier with `prettier-plugin-astro`, double quotes, semicolons, and LF line endings. Ignore `.kilo/`, `.playwright-mcp/`, `build/`, `dist/`, `node_modules/`, and binary `public/static/` files.

Use these scripts in `package.json`:

```json
{
  "dev": "astro dev",
  "build": "pnpm verify && astro build && pnpm test:output",
  "preview": "astro preview",
  "check": "astro check",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test:source": "node --test tests/legacy-contract.test.mjs tests/project-contract.test.mjs",
  "test:output": "node --test tests/output-contract.test.mjs",
  "verify": "pnpm run \"/^verify:(astro|format|source)$/\"",
  "verify:astro": "astro check",
  "verify:format": "prettier --check .",
  "verify:source": "pnpm test:source"
}
```

- [ ] **Step 5: Run the project contract and verify GREEN**

Run: `node --test tests/project-contract.test.mjs`

Expected: two passing tests.

- [ ] **Step 6: Commit the toolchain**

```powershell
git add package.json pnpm-lock.yaml astro.config.mjs tsconfig.json .prettierignore .prettierrc.json .gitignore tests/project-contract.test.mjs
git commit -m "build: add Astro pnpm toolchain"
```

---

### Task 3: Build the Shared Shell, Public Asset Tree, and Root Redirect

**Files:**
- Create: `tests/output-contract.test.mjs`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/shared/Analytics.astro`
- Create: `src/pages/index.astro`
- Move: `CNAME` to `public/CNAME`
- Create: `public/.nojekyll`
- Move: `static/` to `public/static/`

**Interfaces:**
- Consumes: Base document metadata and unchanged Git LFS asset bytes.
- Produces: `dist/index.html`, `dist/CNAME`, `dist/.nojekyll`, shared `Analytics`, and `BaseLayout` used by Tasks 4 and 5.

- [ ] **Step 1: Write a failing built-output contract**

Create `tests/output-contract.test.mjs`. It must read `dist/index.html`, `dist/we-are-back/index.html`, `dist/404.html`, `dist/CNAME`, and `dist/.nojekyll`; assert required route tokens; recursively reject files whose first line is `version https://git-lfs.github.com/spec/v1`; and reject publication paths `AGENTS.md`, `CLAUDE.md`, `docs/ai`, `.agents`, `.github`, `src`, `tests`, and `package.json`.

- [ ] **Step 2: Run the output contract and verify RED**

Run: `node --test tests/output-contract.test.mjs`

Expected: FAIL with `ENOENT` for `dist/index.html`.

- [ ] **Step 3: Move public files without changing asset bytes**

Record `git hash-object --no-filters` for every current file under `static/`, use `git mv` to place the directory at `public/static/`, move `CNAME` to `public/CNAME`, and add an empty `public/.nojekyll`. Re-run hashes against the new paths and require one-to-one equality.

- [ ] **Step 4: Implement the shared layout and analytics component**

`BaseLayout.astro` accepts `title`, optional `description`, optional `canonical`, `htmlLang = "en"`, and `bodyClass`; emits an explicit document shell with named `head` and default slots. `Analytics.astro` emits the existing Google Analytics loader/config and Cloudflare beacon unchanged.

- [ ] **Step 5: Implement the root redirect**

`src/pages/index.astro` uses `BaseLayout` and `Analytics`, adds the existing canonical link and immediate meta refresh in the head, keeps the exact `window.location.replace("./we-are-back/")` call, and preserves the plain anchor fallback.

- [ ] **Step 6: Build and verify the root slice**

Run: `pnpm exec astro build`

Expected: successful static build with `dist/index.html`, expanded `dist/static/` files, `dist/CNAME`, and `dist/.nojekyll`. The full output contract still fails only because the landing and 404 routes are not migrated.

- [ ] **Step 7: Commit the root slice**

```powershell
git add tests/output-contract.test.mjs src/layouts/BaseLayout.astro src/components/shared/Analytics.astro src/pages/index.astro public CNAME static
git commit -m "feat: generate root redirect with Astro"
```

---

### Task 4: Migrate the Landing Page with Selective AstroWind Structure

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/styles/we-are-back.css`
- Create: `src/components/shared/RegionAwareFonts.astro`
- Create: `src/components/shared/IcpFiling.astro`
- Create: `src/components/we-are-back/HeroBackground.astro`
- Create: `src/components/we-are-back/HeroContent.astro`
- Create: `src/scripts/we-are-back.ts`
- Create: `src/pages/we-are-back/index.astro`
- Create: `THIRD_PARTY_NOTICES.md`
- Delete after verification: `we-are-back/index.html`

**Interfaces:**
- Consumes: `BaseLayout`, `Analytics`, current landing HTML, and unchanged `public/static/` media.
- Produces: `dist/we-are-back/index.html`, shared regional fonts and ICP components, and the exact current landing behavior.

- [ ] **Step 1: Extend the source contract before production edits**

Add a test that expects the new landing page and all seven supporting files, checks that `theme.css` imports Tailwind CSS, rejects `@tailwindcss/browser`, checks the AstroWind provenance notice, and requires every existing landing-page contract token in either the page, component, style, or script source.

- [ ] **Step 2: Run the source test and verify RED**

Run: `node --test tests/legacy-contract.test.mjs`

Expected: FAIL because `src/pages/we-are-back/index.astro` does not exist.

- [ ] **Step 3: Extract styles without changing declarations**

Move the current `type="text/tailwindcss"` rules into `src/styles/theme.css`, replacing the browser CDN with `@import "tailwindcss";`. Preserve the original `@theme`, base layer, colors, variables, resets, and source order. Move the second page style block verbatim into `src/styles/we-are-back.css`.

- [ ] **Step 4: Extract exact landing markup into focused components**

`HeroBackground.astro` owns the current background wrapper, `bg.jpg` fallback, startup video element, attributes, and source paths. `HeroContent.astro` owns the current logo, slogans, `revealTrigger`, final content, CTA links, separators, and accessibility attributes. Do not rename IDs or classes.

- [ ] **Step 5: Extract shared regional font and ICP behavior**

`RegionAwareFonts.astro` accepts `variant: "landing" | "not-found"` and emits the existing loader branch. The landing variant includes body, heading, intro-body, and serif definitions; it keeps `document.documentElement.dataset.fontCdn` and current Google/jsDelivr URLs. `IcpFiling.astro` accepts `className`, emits the current filing link/text, and retains the current language/timezone visibility script.

- [ ] **Step 6: Move browser behavior into TypeScript without semantic changes**

Copy the current main script body into `src/scripts/we-are-back.ts`. Preserve initialization order, every ID lookup, reveal behavior, video source selection, real-load 4K attempt, time preservation, event listeners, retry ladder, and fallback. Add only TypeScript narrowing needed by Astro Check; do not redesign control flow.

- [ ] **Step 7: Compose the Astro route**

`src/pages/we-are-back/index.astro` imports `theme.css` then `we-are-back.css`, uses `BaseLayout`, `RegionAwareFonts variant="landing"`, `HeroBackground`, `HeroContent`, `IcpFiling`, and `Analytics`, and loads the TypeScript as an Astro-processed script. Preserve body class `bg-[#05070f]` and DOM order.

- [ ] **Step 8: Record selective AstroWind provenance**

`THIRD_PARTY_NOTICES.md` identifies AstroWind, upstream URL, MIT license, verified package identity `1.0.0-beta.63`, source commit `522530a`, and that only organization/Tailwind foundation patterns were adapted. Do not copy demo content or assets.

- [ ] **Step 9: Verify GREEN before deleting the legacy page**

Run:

```powershell
pnpm exec astro check
pnpm exec astro build
node --test tests/legacy-contract.test.mjs tests/output-contract.test.mjs
```

Expected: Astro Check passes; landing source tests pass; output tests fail only on the missing 404 route.

- [ ] **Step 10: Remove the legacy landing file and commit**

Delete `we-are-back/index.html` only after the built route passes its contract. Then commit the landing slice:

```powershell
git add src tests THIRD_PARTY_NOTICES.md we-are-back/index.html
git commit -m "feat: migrate landing page to Astro"
```

---

### Task 5: Migrate the Custom 404 Page

**Files:**
- Create: `src/styles/not-found.css`
- Create: `src/components/not-found/NotFoundBackground.astro`
- Create: `src/components/not-found/NotFoundContent.astro`
- Create: `src/scripts/not-found.ts`
- Create: `src/pages/404.astro`
- Modify: `src/components/shared/RegionAwareFonts.astro`
- Modify: `src/components/shared/IcpFiling.astro`
- Delete after verification: `404.html`

**Interfaces:**
- Consumes: Shared layout, analytics, font loader, ICP component, and current 404 source.
- Produces: Root `dist/404.html` with unchanged presentation and runtime behavior.

- [ ] **Step 1: Extend the source and output tests for the Astro 404**

Require the five 404 source units, assert the exact title/copy/return link/media tokens, and require `dist/404.html` rather than `dist/404/index.html`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/legacy-contract.test.mjs tests/output-contract.test.mjs`

Expected: FAIL because `src/pages/404.astro` and `dist/404.html` are absent.

- [ ] **Step 3: Extract styles, markup, and behavior**

Move both current 404 style blocks into `src/styles/not-found.css` without changing selector order or declarations. Put current media markup in `NotFoundBackground.astro`, visible error content in `NotFoundContent.astro`, and browser media/retry logic in `src/scripts/not-found.ts`. Keep all IDs, classes, ARIA labels, asset paths, and script order.

- [ ] **Step 4: Compose the custom 404 route**

`src/pages/404.astro` imports `not-found.css`, uses `BaseLayout`, `RegionAwareFonts variant="not-found"`, both 404 components, `IcpFiling`, and `Analytics`. Confirm Astro emits `dist/404.html`.

- [ ] **Step 5: Verify GREEN and remove the legacy file**

Run:

```powershell
pnpm exec astro check
pnpm exec astro build
node --test tests/legacy-contract.test.mjs tests/output-contract.test.mjs
```

Expected: all tests pass. Delete root `404.html`, rebuild, and rerun the same commands to confirm the generated file is the only 404 source.

- [ ] **Step 6: Commit the 404 slice**

```powershell
git add src tests 404.html
git commit -m "feat: migrate custom 404 to Astro"
```

---

### Task 6: Replace Local Serving and Publish Only the Astro Build

**Files:**
- Modify: `start-local-server.ps1`
- Modify: `start-local-server.sh`
- Modify: `start-local-server.cmd`
- Delete: `scripts/local-web-server.mjs`
- Modify: `.github/workflows/deploy-gh-pages.yml`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/ai/source-index.md`

**Interfaces:**
- Consumes: pnpm scripts, `pnpm-lock.yaml`, `dist/`, LFS guards, deploy key, and repository ID.
- Produces: Foreground-only Astro development launchers, documented maintenance commands, and a single CI job that builds and publishes `dist/`.

- [ ] **Step 1: Add workflow and launcher assertions before edits**

Extend `tests/project-contract.test.mjs` to require all three launchers to invoke `pnpm dev`; require the workflow to use `pnpm/action-setup@v6`, `actions/setup-node@v6`, `cache: pnpm`, Node 24, `pnpm install --frozen-lockfile`, `pnpm build`, `PUBLISH_DIR: source/dist`, the existing two LFS guards, empty-key check, strict known-host behavior, `GITHUB_REPOSITORY`, and a force push to `gh-pages`.

- [ ] **Step 2: Run the project test and verify RED**

Run: `node --test tests/project-contract.test.mjs`

Expected: FAIL because the launchers still invoke `scripts/local-web-server.mjs` and the workflow has no pnpm setup/build.

- [ ] **Step 3: Update foreground-only launchers**

Keep each launcher's Node/pnpm availability diagnostics and repository-directory setup. Replace the server invocation with `pnpm dev -- "$@"` equivalents and preserve process attachment so closing the terminal stops Astro.

- [ ] **Step 4: Update the CI data flow**

Keep checkout at `source/`, LFS checkout/fetch/fsck, permissions, concurrency, SSH temporary paths, strict host checking, bot identity, and direct force push. Add pnpm 11 setup and Node 24 setup with pnpm cache, run frozen install and `pnpm build` in `source/`, set publish directory to `source/dist`, add publication `.gitattributes` there, and rerun the LFS pointer scan before push. Remove rsync of repository source.

- [ ] **Step 5: Update durable documentation**

Document `pnpm install`, `pnpm dev`, `pnpm verify`, `pnpm build`, `pnpm preview`, route/component/public layout, compatible-range plus lockfile policy, selective AstroWind provenance, concurrent-check boundary, LFS behavior, and `dist/` publishing in `README.md` and `AGENTS.md`. Update `docs/ai/source-index.md` with official Astro, AstroWind, pnpm, Tailwind CSS, GitHub Actions, and Pages sources checked on 2026-07-15.

- [ ] **Step 6: Remove the obsolete custom server**

Delete `scripts/local-web-server.mjs` only after `pnpm dev` and `pnpm preview` return HTML and byte-range responses for `/static/bg.mp4`.

- [ ] **Step 7: Verify GREEN and commit**

Run:

```powershell
node --test tests/project-contract.test.mjs
pnpm verify
pnpm build
```

Expected: all project, Astro, format, source, and output checks pass; CI YAML contains no `_site` or source-rsync publication path.

```powershell
git add .github/workflows/deploy-gh-pages.yml start-local-server.ps1 start-local-server.sh start-local-server.cmd scripts/local-web-server.mjs README.md AGENTS.md docs/ai/source-index.md tests/project-contract.test.mjs
git commit -m "ci: build and publish Astro site"
```

---

### Task 7: Browser Regression, Full Verification, and Temporary-File Cleanup

**Files:**
- Create: `tests/browser/site.spec.mjs`
- Modify if failures reveal defects: only the owning source/test file.
- Delete before completion: `build/astro-migration/`

**Interfaces:**
- Consumes: Completed Astro source, production build, baseline screenshots, and installed Microsoft Edge.
- Produces: Repeatable route/media interaction smoke coverage, verified visual parity, clean repository state, and no migration temporaries.

- [ ] **Step 1: Write browser behavior tests**

Use `@playwright/test` with `channel: "msedge"` and a production-preview web server. Test that root navigation reaches `/we-are-back/`; landing fallback image/video exist; reveal exposes final content; CTA/email links match; startup media loops, is muted, and plays inline; a forced 4K failure retains the working background; a successful replacement preserves time within a narrow tolerance; a synthetic pause enters the recovery path; and `/404.html` shows current content and returns home.

- [ ] **Step 2: Run browser tests and verify RED when a behavior is missing**

Run: `pnpm exec playwright test tests/browser/site.spec.mjs --project=msedge`

Expected before any discovered fix: a focused assertion failure naming the mismatched behavior. For every defect, retain the failing assertion, fix only the owning implementation, and rerun until GREEN.

- [ ] **Step 3: Capture after screenshots at the same viewports**

Build once, serve `dist/`, set the same font-loading state and video time as the legacy capture, then capture:

- `build/astro-migration/after-mobile.png` at `390x844`
- `build/astro-migration/after-desktop.png` at `1440x900`
- `build/astro-migration/after-4k.png` at `3840x2160`

Inspect each baseline/after pair for typography, layout, colors, spacing, visibility, cropping, and responsive behavior. Any unexplained visible change is a failure and must be corrected before continuing.

- [ ] **Step 4: Run the full fresh verification gate**

Run, in order:

```powershell
pnpm install --frozen-lockfile
pnpm verify
pnpm build
pnpm exec playwright test tests/browser/site.spec.mjs --project=msedge
git lfs fsck --pointers
git diff --check
git status --short
```

Expected: frozen install succeeds; concurrent checks pass; one production build and all output tests pass; browser tests pass; LFS pointers are valid; diff check is empty; only intended tracked changes plus the user's pre-existing untracked `.kilo/` and `.playwright-mcp/` remain.

- [ ] **Step 5: Clean every migration temporary**

Resolve `build/astro-migration/` to an absolute path and verify it is below the repository's `build/` directory. Stop only processes whose PIDs were recorded by this migration. Remove `build/astro-migration/` recursively, then verify:

```powershell
if (Test-Path build/astro-migration) { throw "temporary migration directory still exists" }
Get-Process node -ErrorAction SilentlyContinue
git status --short
```

Do not delete `.kilo/`, `.playwright-mcp/`, or unrecorded user processes.

- [ ] **Step 6: Commit browser coverage and final fixes**

```powershell
git add tests/browser src package.json pnpm-lock.yaml
git commit -m "test: verify Astro site behavior"
```

- [ ] **Step 7: Re-run the completion gate after the final commit**

Run `pnpm verify`, `pnpm build`, the Edge browser suite, `git diff --check`, and `git status --short` again. Report exact test counts, the build result, visual viewport results, cleanup result, and any environment boundary without claiming unverified deployment success.
