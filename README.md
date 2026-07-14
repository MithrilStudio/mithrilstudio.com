# Official website of mithrilstudio.com

This repository builds the static public site at <https://mithrilstudio.com> with Astro and Tailwind CSS. The public routes intentionally preserve the pre-migration design and behavior:

- `/` immediately redirects to `/we-are-back/` with script, meta-refresh, and link fallbacks.
- `/we-are-back/` is the current MithrilStudio landing experience.
- `/404.html` is the custom not-found page.

## Requirements

- Node.js 24
- pnpm 11
- Git LFS for checking out the media files under `public/static/`

## Local development

```powershell
pnpm install
pnpm dev
```

On Windows, `.\start-local-server.ps1` is the convenience entry point. `start-local-server.cmd` and `./start-local-server.sh` provide equivalent wrappers. All launchers keep Astro attached to the current terminal, so closing or interrupting that terminal stops the server.

Useful commands:

| Command             | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`          | Start Astro's development server                                           |
| `pnpm verify`       | Run independent Astro, formatting, and source-contract checks concurrently |
| `pnpm build`        | Verify, build once into `dist/`, and validate the generated snapshot       |
| `pnpm preview`      | Serve the latest production build locally                                  |
| `pnpm test:browser` | Run production-preview behavior tests in Microsoft Edge                    |
| `pnpm format`       | Format maintained text and source files                                    |

## Project layout

- `src/pages/`: Astro routes for the root redirect, landing page, and 404 page.
- `src/components/`: page-focused and shared UI units.
- `src/scripts/`: preserved browser behavior for fonts, ICP visibility, reveal flow, and media playback.
- `src/styles/`: Tailwind CSS 4 entry point and page-specific styles.
- `public/static/`: unchanged public raster, logo, and video assets.
- `tests/`: source and generated-output contract tests.

The migration selectively adapts AstroWind's project-organization and Tailwind foundation patterns without importing its demo UI, content, blog stack, or media. Provenance and licensing are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Direct dependencies use compatible caret ranges in `package.json`; `pnpm-lock.yaml` pins the reviewed graph used by local and CI builds. pnpm's release-age guard remains enabled, with only explicitly reviewed build scripts allowed.

## Publishing

`.github/workflows/deploy-gh-pages.yml` checks out real Git LFS objects, installs from the frozen lockfile, runs `pnpm build`, rejects any LFS pointer that reaches `dist/`, and force-pushes only that generated snapshot to `gh-pages`.

Publishing retains the existing `WEBSITE_DEPLOY_KEY` secret and `GITHUB_REPOSITORY` remote contract. Source-only files such as agent instructions, documentation, tests, and package metadata never enter the published directory.
