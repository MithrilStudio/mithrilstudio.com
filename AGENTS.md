# MithrilStudio Static Site Agent Guide

## Scope

- This repository is the public `mithrilstudio.com` Astro site.
- Routes live in `src/pages/`; visual and media assets live in `public/static/`.
- The relaunch form is a frontend entry point. Its backend lives in `D:\workspace\projs\MithrilStudio\relaunch-activity.mithrilstudio.com`.

## Start and Route

- Read this file first, then inspect only the files required by the task.
- Use `.agents/skills/changing-site-experience/SKILL.md` for routes, visible copy, responsive layout, browser interaction, form UI, fonts, images, video, or media fallbacks.
- Use `.agents/skills/publishing-github-pages/SKILL.md` for the deploy workflow, `gh-pages`, Git LFS delivery, `CNAME`, deploy keys, or GitHub Pages behavior.
- Use both Skills when a media or asset change also affects published delivery.
- Read `docs/ai/source-index.md` when a decision depends on external or time-sensitive behavior. Read `.github/workflows/deploy-gh-pages.yml` before changing publishing.
- Do not preload all assets, logs, or AI documentation.

## Working Method

- For a change, state the intended behavior, concrete scenarios, non-goals, and proving evidence before implementation. Use the lightest artifact that removes ambiguity.
- For a defect, reproduce the exact route, interaction, viewport, browser, run, commit, or delivery boundary named by the task. Find the first divergence before proposing a fix.
- Add or update the narrowest failing contract check before implementation, then make the smallest coherent change.
- Treat existing tests as the current contract. An approved behavior change may update implementation and matching source, output, and browser contracts together; otherwise preserve them.
- Verify with fresh command output before reporting completion.

## Local Development

- Use Node.js 24 and pnpm 11. Keep compatible dependency ranges in `package.json` and commit the resolved `pnpm-lock.yaml`.
- Install with `pnpm install`, develop with `pnpm dev`, and preview the production build with `pnpm preview`.
- On Windows, `./start-local-server.ps1` is the convenience launcher; cross-platform launchers are `./start-local-server.sh` and `start-local-server.cmd`.
- Launcher scripts must keep Astro attached to the current terminal. Do not start hidden or detached development servers.
- Run `pnpm verify` for source checks and `pnpm build` for the production build plus output-contract tests.

## Current Site Contract

- Keep the first screen as the landing experience, not a placeholder.
- Keep the generated root route as the compact redirect with script, meta-refresh, canonical-link, and anchor fallbacks unless the task explicitly changes it.
- Keep `/we-are-back/` and `/404.html` free of theme demo content.
- The subscribe request contains only the `email` field. Production submissions go to `https://relaunch-activity.mithrilstudio.com/api/subscribers`; show user-safe success and failure states without backend internals.
- Prefer existing campaign raster and video assets. Do not replace them with generic decorative placeholders.

## Publishing Contract

- GitHub Pages must receive real asset bytes, not Git LFS pointer files. Keep the source-pointer, origin-object, generated-output, and publish-snapshot guards.
- Publish only Astro's generated `dist/` snapshot. Source, tests, package metadata, and AI-maintenance files are not site content.
- Provision `CNAME` at publish time from the `CNAME` Repository variable. Do not commit `public/CNAME` or hard-code the domain.
- A successful branch push is not proof of a successful Pages deployment or public delivery; verify the boundary named by the task.
- Never commit or expose secrets, tokens, private keys, local snapshots, or temporary output.

## Validation and Temporary Files

- Follow the applicable Skill's verification matrix. Browser-facing changes require the exact affected interaction and responsive viewports; publishing changes require evidence at each affected release boundary.
- For local serving changes, verify both dev and preview behavior, including byte-range responses for background video.
- If Markdown tooling is available, lint changed Markdown. Otherwise perform a structural check and state that boundary.
- Put temporary diagnostics under `build/<task-name>/` and remove them before finishing unless intentionally indexed.

## Documentation and AI Maintenance

- Git is the history. Keep living documents as one current version with no dated copies, in-file changelogs, migration narratives, or completed task checklists.
- Delete transient plans and design notes after their durable decisions and acceptance criteria are represented by current code, tests, documentation, or Skills.
- Keep `AGENTS.md` concise and project-specific. Keep `CLAUDE.md` as a thin `@AGENTS.md` compatibility layer.
- Keep `.agents/skills/README.md` as an index. Add a Skill only for a repeated multi-step workflow, and validate both its instructions and trigger boundary.
- Keep `docs/ai/source-index.md` as the current source and task-routing map. Refresh its checked metadata in place when a source-dependent rule changes.
