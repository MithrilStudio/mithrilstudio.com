# Astro and AstroWind Migration Design

**Status:** Approved in conversation; pending review of this written specification.

**Date:** 2026-07-15

## Goal

Refactor `mithrilstudio.com` into a static Astro site using a selective AstroWind foundation, while preserving the current root redirect, `/we-are-back/` experience, and custom 404 page without any visible or behavioral change. Build with pnpm and publish only the generated `dist/` snapshot to the `gh-pages` branch.

## Non-goals

- Redesigning, restyling, or rewriting the public experience.
- Adding new routes, content, a blog, MDX, content collections, SSR, or a client framework.
- Replacing the existing images or videos with theme demo assets.
- Changing the SSH deploy-key contract or retaining history on `gh-pages`.
- Creating a reusable Agent Skill for this one-time migration.

## Current Contract

- `/index.html` is a small redirect document that combines a canonical link, immediate meta refresh, `window.location.replace("./we-are-back/")`, and a plain anchor fallback.
- `/we-are-back/index.html` owns the live landing experience, including its fonts, reveal flow, links, analytics, ICP visibility, background image, normal video, optional 4K video upgrade, playback synchronization, and pause recovery.
- `/404.html` owns the custom error experience, regional font loading, background media, ICP visibility, analytics, and return-home link.
- Binary site assets are stored through Git LFS on the source branch and must be expanded into real files on the publish branch.
- `.github/workflows/deploy-gh-pages.yml` publishes an orphan-style, force-updated `gh-pages` snapshot through `secrets.WEBSITE_DEPLOY_KEY` and `GITHUB_REPOSITORY`.

## Researched Baseline

The following upstream state was verified immediately before the migration design was finalized:

- Astro `7.0.9` was the latest stable Astro release.
- AstroWind upstream `main` identified itself as `1.0.0-beta.63`; the latest observed upstream commit was `522530a`. The latest formal GitHub prerelease was older (`1.0.0-beta.60`).
- AstroWind used Astro 6 and Tailwind CSS 4, so selected theme structures must be adapted and verified on Astro 7 rather than copied as an untested full scaffold.
- The official npm registry reported pnpm `11.13.0` as the latest stable pnpm release. pnpm supports running multiple matching scripts concurrently, while a single `astro build` remains one build task.
- The official npm registry reported Tailwind CSS and `@tailwindcss/vite` `4.3.2`, Astro Check `0.9.9`, Prettier `3.9.5`, and the Astro Prettier plugin `0.14.1` as their latest releases.
- TypeScript `7.0.2` was the latest TypeScript release, but Astro Check `0.9.9` declared support only for TypeScript 5 and 6. TypeScript `6.0.3` was therefore the highest compatible release for this toolchain.
- The current GitHub Actions major releases used by the design are `actions/checkout@v7`, `actions/setup-node@v6`, and `pnpm/action-setup@v6`.

Time-sensitive sources:

- <https://github.com/withastro/astro/releases>
- <https://github.com/arthelokyo/astrowind>
- <https://raw.githubusercontent.com/arthelokyo/astrowind/main/package.json>
- <https://github.com/arthelokyo/astrowind/commits/main/>
- <https://pnpm.io/cli/run>
- <https://pnpm.io/cli/recursive>
- <https://github.com/pnpm/pnpm/releases>
- <https://docs.astro.build/en/guides/deploy/github/>
- <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>

## Dependency and Version Policy

- Use pnpm for dependency installation and every repository script.
- Resolve each direct dependency from its latest release at implementation time, then keep a compatible SemVer range in `package.json` rather than an exact version.
- Commit `pnpm-lock.yaml` so local development and CI install the same reviewed dependency graph.
- Use `pnpm install --frozen-lockfile` in CI.
- Select the highest compatible release when an ecosystem package's latest release does not support Astro 7 or Node.js 24, and record the incompatibility in the implementation notes.
- Use the latest compatible TypeScript 6 release unless Astro Check expands its peer range before dependencies are installed; do not install TypeScript 7 while the checker excludes it.
- Keep the dependency set minimal. Expected direct tools are Astro, Tailwind CSS, the Tailwind Vite integration, Astro Check, TypeScript, Prettier, and the Astro Prettier plugin. Do not import AstroWind blog, RSS, MDX, icon, SEO, or image-service dependencies unless the migrated site actually consumes them.
- Record AstroWind `1.0.0-beta.63@522530a` as source provenance, not as an npm runtime dependency.
- Use Node.js 24 in CI and declare a compatible Node engine range in `package.json`.

## pnpm Concurrency Policy

- Give independent, read-only verification scripts a shared prefix such as `verify:` and run them through pnpm's regular-expression script selection so pnpm can execute them concurrently.
- Suitable parallel tasks include Astro type checking, formatting checks, and Node-based source/output contract tests when they do not mutate shared output.
- Run `astro build` only once and only after source checks pass.
- Do not run two tasks that both write `dist/`, Astro caches, formatted sources, screenshots, or the same temporary directory at the same time.
- This is a single-package repository. Do not manufacture a multi-package workspace solely to use recursive build concurrency.

## Architecture

### Routes

- `src/pages/index.astro` generates the existing redirect experience.
- `src/pages/we-are-back/index.astro` generates the live landing page.
- `src/pages/404.astro` generates the root `404.html` file.
- Astro uses static output, the production site is `https://mithrilstudio.com`, and no repository `base` path is configured because the site uses a custom domain.

### Shared units

- `src/layouts/BaseLayout.astro` owns the HTML document shell and explicit head/body slots without imposing theme UI.
- `src/components/shared/RegionAwareFonts.astro` owns the existing Google Fonts versus jsDelivr selection behavior.
- `src/components/shared/Analytics.astro` owns the existing Google Analytics and Cloudflare Web Analytics snippets.
- `src/components/shared/IcpFiling.astro` owns the existing domain, language, and timezone visibility logic while accepting page-specific presentation classes.

### Landing-page units

- `src/components/we-are-back/HeroBackground.astro` owns the fallback image and initial background video markup.
- `src/components/we-are-back/HeroContent.astro` owns the existing logo, slogan, reveal content, and external links.
- `src/scripts/we-are-back.ts` owns the existing reveal and background-media behavior. The first migration must preserve behavior before any internal simplification.
- `src/styles/we-are-back.css` owns page-specific styles and responsive rules.

### 404 units

- `src/components/not-found/NotFoundBackground.astro` owns the fallback image and video markup.
- `src/components/not-found/NotFoundContent.astro` owns the current code, title, copy, and navigation.
- `src/scripts/not-found.ts` owns the current background-video setup and retry behavior.
- `src/styles/not-found.css` owns page-specific styles and responsive rules.

### Theme foundation

- `src/styles/theme.css` adopts only the useful AstroWind/Tailwind CSS 4 structure and maps its tokens to the site's current colors, fonts, spacing, and dark-only presentation.
- The migration may adapt AstroWind layout and style-organization patterns, but it must remove unused theme pages, widgets, blog infrastructure, example content, and assets.
- Any copied MIT-licensed AstroWind code retains the required license and attribution in a repository notice.
- No default AstroWind visual may reach a public page.

### Public assets

- Move `static/` to `public/static/` without transforming binary contents.
- Move `CNAME` to `public/CNAME` so Astro copies it to `dist/CNAME`.
- Add `public/.nojekyll` so the built snapshot is directly suitable for branch-based GitHub Pages publication.
- Keep all source-branch Git LFS rules and guards intact.

## Browser Behavior

- Keep the root redirect mechanisms redundant and immediate.
- Preserve all current visible copy, URLs, mail links, analytics identifiers, and ICP filing details.
- Preserve the existing fallback image until replacement video playback is proven.
- Preserve normal-video to 4K-video upgrade behavior, playback position, looping, mute state, inline playback, failure fallback, and pause self-recovery.
- Preserve mobile, portrait, desktop, high-DPI, 4K, reduced-motion, and keyboard/touch behavior.
- Use Astro's native static HTML plus vanilla browser JavaScript. Do not add client-side framework islands.

## CI and Publishing

The workflow is a single deploy job with this ordered data flow:

1. Check out the source with Git LFS enabled using `actions/checkout@v7`.
2. Run the repository LFS guard, fetch source LFS objects, and verify their integrity.
3. Install the current pnpm 11 release through `pnpm/action-setup@v6` and configure Node.js 24 with `actions/setup-node@v6` plus pnpm caching.
4. Install dependencies with `pnpm install --frozen-lockfile`.
5. Run independent source checks concurrently through the pnpm verification script.
6. Run the single Astro production build.
7. Validate `dist/` routes, required content, `CNAME`, assets, publication exclusions, and absence of LFS pointers.
8. Initialize `dist/` as a clean `gh-pages` snapshot and force-push it through the SSH key stored in `WEBSITE_DEPLOY_KEY` to `git@github.com:${GITHUB_REPOSITORY}.git`.

The deploy step retains strict host-key checking, a runner-temporary private key, a runner-temporary known-hosts file, the GitHub Actions bot identity, and an explicit empty-secret failure. No publish action replaces the direct SSH push.

## Validation Strategy

### Automated source and output checks

- Astro and TypeScript validation.
- Formatting validation.
- Node tests for root redirect markers, required route output, critical text and links, analytics identifiers, ICP content, asset paths, `CNAME`, `.nojekyll`, and publication exclusions.
- Recursive output scan that fails on any Git LFS pointer signature.
- Full `pnpm build` exit status.

### Browser interaction checks

- `/` redirects to `/we-are-back/`.
- `/we-are-back/` loads its fallback image and background video successfully.
- Reveal, links, email navigation, keyboard input, and touch/pointer input retain their current behavior.
- A failed video upgrade keeps the existing working media path.
- A successful 4K upgrade preserves progress and playback state.
- Unexpected video pauses trigger the existing recovery path.
- `/404.html` renders its current content, return link, media behavior, and ICP visibility rules.

### Visual regression checks

- Capture before and after images at `390x844`, `1440x900`, and `3840x2160`.
- Make the comparison deterministic by fixing the video time and waiting for the same font-loading state.
- Compare layout, typography, colors, spacing, visibility, cropping, and responsive behavior.
- Treat every unexplained visible difference as a failed migration.
- Store temporary images under `build/astro-migration/` and remove them before completion.

## Local Development

- Keep the PowerShell, POSIX shell, and CMD launchers foreground-only.
- Route the launchers to the pnpm-backed Astro development command so closing the terminal stops the server.
- Document direct commands for install, development, concurrent checks, production build, and production preview.
- Remove `scripts/local-web-server.mjs` only after Astro development and preview serving are verified to cover the required HTML, image, and byte-range media paths.

## Documentation and Agent Guidance

- Expand `README.md` with pnpm installation, development, verification, build, preview, and repository layout instructions.
- Update `AGENTS.md` to describe Astro, pnpm, source/public paths, the visual-preservation contract, the pnpm concurrency boundary, and the `dist/` to `gh-pages` workflow.
- Keep `CLAUDE.md` as a thin `@AGENTS.md` compatibility import.
- Update `docs/ai/source-index.md` with current Astro, AstroWind, pnpm, Tailwind CSS, and GitHub Pages sources and review dates.
- Do not add a Skill unless a repeated maintenance workflow emerges after the migration.

## Failure Handling

- If the latest compatible dependency set does not pass Astro checks and a production build, inspect the first concrete incompatibility and select the highest mutually compatible version rather than downgrading the entire toolchain by assumption.
- If extraction changes script order or browser behavior, restore the original page-local ordering before attempting further componentization.
- If Tailwind-generated output changes the current appearance, preserve the existing CSS rule verbatim and use Tailwind only where equivalence has been demonstrated.
- If Astro development serving does not preserve required media range behavior, retain a focused preview server rather than degrading video behavior.
- If any validation fails, do not publish or claim completion.

## Acceptance Criteria

- The source is an Astro 7 project managed entirely through pnpm.
- Direct dependency declarations use compatible ranges rather than exact versions, and `pnpm-lock.yaml` is committed.
- Selected AstroWind structures come from the latest verified upstream source and all unused theme features are absent.
- The root redirect, landing page, and 404 page are visually and behaviorally unchanged at mobile, desktop, and 4K sizes.
- All existing static assets and analytics/ICP behavior remain available.
- CI builds with pnpm, validates the output, and force-publishes only `dist/` to `gh-pages` through `WEBSITE_DEPLOY_KEY` and `GITHUB_REPOSITORY`.
- LFS pointer files, AI-maintenance files, source files, and local tooling do not enter the published branch.
- Repository documentation and AI-agent guidance describe the new source of truth and commands.
