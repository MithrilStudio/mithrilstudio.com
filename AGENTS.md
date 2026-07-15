# MithrilStudio Static Site Agent Guide

## Scope

- This repository is the public `mithrilstudio.com` static landing page.
- Astro routes live in `src/pages/`; visual and media assets live in `public/static/`.
- The relaunch activity form is a frontend entry point only. Its backend lives in sibling repository `D:\workspace\projs\MithrilStudio\relaunch-activity.mithrilstudio.com`.

## Read First

- Start with this file, then inspect only the files required by the task.
- Read `docs/ai/source-index.md` when a task depends on GitHub Pages, AI agent configuration, Agent Skills, or external platform behavior.
- Read `.github/workflows/deploy-gh-pages.yml` before changing publish behavior, asset handling, or GitHub Pages configuration.
- Do not preload all images, videos, workflow logs, or AI docs unless the task specifically points there.

## Local Development

- Preview locally with `.\start-local-server.ps1` on Windows.
- Cross-platform alternatives are `./start-local-server.sh` and `start-local-server.cmd`.
- Install dependencies with `pnpm install`, develop with `pnpm dev`, and preview a production build with `pnpm preview`.
- The launcher scripts must keep Astro attached to the current terminal. Do not start hidden or detached development servers.
- Use pnpm 11 and Node.js 24. Keep compatible dependency ranges in `package.json` and commit the resolved `pnpm-lock.yaml`.

## Site Rules

- Keep the first screen as the actual landing experience, not a marketing placeholder.
- Keep the generated root page as the existing compact redirect with script, meta-refresh, canonical-link, and anchor fallbacks.
- Preserve the visual output and browser behavior of `/we-are-back/` and `/404.html`; the selective AstroWind foundation must not introduce theme demo visuals or content.
- The subscribe form submits a single field named `email`; the backend API expects only `email`.
- If wiring the form to production, submit `email` to `https://relaunch-activity.mithrilstudio.com/api/subscribers` and handle both success and failure states without exposing backend internals.
- Use existing raster/video assets in `static/` when possible. Do not replace real product or campaign art with generic decorative SVGs.

## Assets and Publishing

- GitHub Pages cannot serve Git LFS pointer files as usable assets. Keep the publish workflow checks that detect LFS pointers.
- When changing binary assets, verify `.gitattributes`, Git LFS state, and the published branch behavior instead of guessing from filenames.
- Publish only Astro's generated `dist/` snapshot. AI-maintenance files, tests, source files, and package metadata are not site content.
- The custom-domain `CNAME` is provisioned at publish time from the `CNAME` Repository variable and written into `dist/`; do not commit a `public/CNAME` file. The publish workflow fails if that variable is missing or not a bare domain.
- Never commit secrets, tokens, local snapshots, or temporary outputs. Use `development/secret/` for local secrets if ever needed; it is ignored by git.
- Put temporary diagnostics under `build/<task-name>/` and clean them before finishing unless they are intentionally indexed.

## Validation

- Run `pnpm verify` for independent concurrent source checks and `pnpm build` for the single production build plus output-contract tests.
- For HTML, CSS, and browser JavaScript changes, inspect the edited route and verify responsive layout at mobile, desktop, and 4K widths.
- For local server changes, verify both `pnpm dev` and `pnpm preview`, including byte-range responses for background video.
- For deploy workflow changes, validate YAML structure and confirm that only `source/dist` is published after frozen installation and build.
- If markdown tooling is available, run markdownlint on changed Markdown files. If it is unavailable, perform a local structural check and state that boundary.

## Documentation Maintenance

- Treat Git as the version history. Keep each document as a single current version: edit files in place and never retain dated filename copies (for example `2026-07-15-*.md`) or in-file dated history/changelog sections. The prior state is always recoverable from `git log`.
- `docs/` holds living reference only. One-time migration plans, design specs, and task checklists are transient: delete them once the work is merged and its acceptance criteria pass. The commit history and pull request preserve the record; keep an Architecture Decision Record instead only when a decision's context and rationale must be retained permanently.
- The `Last checked` / `Next review` columns in `docs/ai/source-index.md` are the exception: they are a current-state review schedule holding one up-to-date value per row, not version history, and stay as single values refreshed in place.

## AI Prompt Maintenance

- `AGENTS.md` is the cross-tool source of truth. Keep it concise and project-specific.
- `CLAUDE.md` should stay a thin Claude Code compatibility layer that imports `@AGENTS.md`.
- `.agents/skills/README.md` is only an index. Add a real Skill only for a repeated, multi-step workflow that benefits from progressive disclosure.
- When adding or changing AI rules, update `docs/ai/source-index.md` if the rule depends on external or time-sensitive facts.
