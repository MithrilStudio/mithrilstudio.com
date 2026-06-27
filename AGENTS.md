# MithrilStudio Static Site Agent Guide

## Scope

- This repository is the public `mithrilstudio.com` static landing page.
- The primary page is `index.html`; visual and media assets live in `static/`.
- The relaunch activity form is a frontend entry point only. Its backend lives in sibling repository `D:\workspace\projs\MithrilStudio\relaunch-activity.mithrilstudio.com`.

## Read First

- Start with this file, then inspect only the files required by the task.
- Read `docs/ai/source-index.md` when a task depends on GitHub Pages, AI agent configuration, Agent Skills, or external platform behavior.
- Read `.github/workflows/deploy-gh-pages.yml` before changing publish behavior, asset handling, or GitHub Pages configuration.
- Do not preload all images, videos, workflow logs, or AI docs unless the task specifically points there.

## Local Development

- Preview locally with `.\start-local-server.ps1` on Windows.
- Cross-platform alternatives are `./start-local-server.sh` and `start-local-server.cmd`.
- The local server is implemented in `scripts/local-web-server.mjs`; validate server script changes with `node --check scripts/local-web-server.mjs`.
- This site has no package manifest. Do not add a package manager or build step unless the task requires it and the tradeoff is documented.

## Site Rules

- Keep the first screen as the actual landing experience, not a marketing placeholder.
- Keep `index.html` as a compact static page using the existing Tailwind browser CDN and inline styles unless a broader build-system change is explicitly requested.
- The subscribe form submits a single field named `email`; the backend API expects only `email`.
- If wiring the form to production, submit `email` to `https://relaunch-activity.mithrilstudio.com/api/subscribers` and handle both success and failure states without exposing backend internals.
- Use existing raster/video assets in `static/` when possible. Do not replace real product or campaign art with generic decorative SVGs.

## Assets and Publishing

- GitHub Pages cannot serve Git LFS pointer files as usable assets. Keep the publish workflow checks that detect LFS pointers.
- When changing binary assets, verify `.gitattributes`, Git LFS state, and the published branch behavior instead of guessing from filenames.
- AI-maintenance files are not site content. Keep `AGENTS.md`, `CLAUDE.md`, `.agents/`, and `docs/ai/` excluded from the Pages publish directory.
- Never commit secrets, tokens, local snapshots, or temporary outputs. Use `development/secret/` for local secrets if ever needed; it is ignored by git.
- Put temporary diagnostics under `build/<task-name>/` and clean them before finishing unless they are intentionally indexed.

## Validation

- For HTML, CSS, and browser JavaScript changes, inspect the edited browser path and verify responsive layout at mobile and desktop widths.
- For local server changes, run `node --check scripts/local-web-server.mjs`.
- For deploy workflow changes, validate YAML structure and re-read the workflow paths and exclusions.
- If markdown tooling is available, run markdownlint on changed Markdown files. If it is unavailable, perform a local structural check and state that boundary.

## AI Prompt Maintenance

- `AGENTS.md` is the cross-tool source of truth. Keep it concise and project-specific.
- `CLAUDE.md` should stay a thin Claude Code compatibility layer that imports `@AGENTS.md`.
- `.agents/skills/README.md` is only an index. Add a real Skill only for a repeated, multi-step workflow that benefits from progressive disclosure.
- When adding or changing AI rules, update `docs/ai/source-index.md` if the rule depends on external or time-sensitive facts.
