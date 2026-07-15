---
name: changing-site-experience
description: Use when changing or diagnosing MithrilStudio public routes, visible copy, responsive layout, browser interaction, subscribe-form behavior, fonts, background images, video playback, or media fallbacks. Do not use for GitHub Pages, Git LFS, CNAME, deploy workflow, or publish-only work.
---

# Changing Site Experience

## Outcome

Implement the requested public-site behavior with explicit acceptance checks while preserving every unaffected route, fallback, interaction, and generated-output contract.

## Workflow

### 1. Establish the current behavior

1. Read the affected route in `src/pages/` and only the components, styles, and browser scripts it imports.
2. Read the matching source, output, and browser tests before proposing an edit.
3. For a defect, reproduce the exact route, interaction, viewport, and browser first. Capture the first observable divergence instead of inferring the cause from the final symptom.
4. Separate current requirements from historical wording. An explicitly approved behavior change may require updating the source, generated-output, and browser contracts together; otherwise treat a contract mismatch as a regression.

### 2. Define the change as behavior

State a compact contract before editing:

- **Requirement:** the externally visible behavior that must hold.
- **Scenarios:** concrete initial state, action or event, and expected result.
- **Non-goals:** routes, viewports, interactions, and fallbacks that must remain unchanged.
- **Evidence:** the test, browser observation, or generated file that will prove each scenario.

Use the lightest version that removes ambiguity. Do not create a permanent spec for a small change.

### 3. Add the failing check

- Add or update a source contract for stable source wiring.
- Add or update an output contract for generated routes, public copy, asset URLs, or excluded files.
- Add a Playwright regression for interaction, navigation, media state, responsive layout, or byte-range behavior.
- For a visual property that cannot be asserted reliably, record exact viewports and inspect the rendered route; do not substitute source inspection for browser evidence.

Run the narrow check and confirm it fails for the intended missing behavior before implementation. If an approved copy change invalidates a visible-text hash, update the source and expected hash deliberately after inspecting the generated text; never remove or weaken the hash merely to pass.

### 4. Implement the smallest coherent change

- Keep route composition in `src/pages/`, reusable markup in `src/components/`, browser behavior in `src/scripts/`, and styling in `src/styles/`.
- Preserve the root redirect fallbacks and the custom `404.html` unless the request explicitly changes them.
- Keep the subscribe request payload to the single `email` field and expose only user-safe success or failure states.
- Keep the image fallback while changing background video behavior. Standard-video playback must remain usable if the 4K candidate fails.
- Do not replace campaign art or media with generic placeholders.

### 5. Verify by affected surface

| Change | Required evidence |
| --- | --- |
| Astro markup, copy, or route | Narrow source/output test, then `pnpm verify` and `pnpm build` |
| CSS or responsive layout | Browser inspection at 390x844, 1440x900, and 3840x2160; add Playwright coverage for durable geometry or interaction |
| Browser interaction or navigation | Fresh `pnpm build`, then the relevant Playwright test and `pnpm test:browser` |
| Form behavior | Request payload contains only `email`; success and failure UI verified without backend internals |
| Image, video, font, or media script | Fresh `pnpm build`, then verify fallback, loading, active-source, and failure paths in a browser and run `pnpm test:browser` |
| Local serving behavior | Verify `pnpm dev`; after a fresh build, verify `pnpm preview` and byte-range responses for background video |

For media defects, capture `currentSrc`, `currentTime`, `paused`, `readyState`, `networkState`, `error`, document visibility, relevant media events, and active video count. Test the real `bg_4k.mp4` when codec or decode behavior is in scope; fulfilling its request with `bg.mp4` proves swap logic only.

Finish by running `git diff --check` and inspecting the final diff for unrelated visual or behavioral changes.

## Quick Reference

| Symptom | Start with |
| --- | --- |
| Wrong copy or route output | `src/pages/`, relevant component, source test, output test |
| Interaction or navigation regression | `src/scripts/`, `tests/browser/site.spec.mjs` |
| Mobile or 4K layout regression | page stylesheet, exact failing viewport, browser evidence |
| Background media failure | `HeroBackground.astro`, `src/scripts/we-are-back.ts`, browser media events |
| Asset publishes as an LFS pointer | **REQUIRED SUB-SKILL:** Use `publishing-github-pages` |

## Common Mistakes

- Treating “preserve current behavior” as a ban on an explicitly requested contract change.
- Editing a generated hash or pinned token without inspecting the corresponding generated behavior.
- Reproducing a browser problem only through source reading or a different route, viewport, browser, or media file.
- Removing the image or standard-video fallback while repairing the 4K path.
- Declaring a media fix from one successful autoplay attempt without exercising pause, failure, and replacement paths.
- Running `pnpm test:browser` against missing or stale `dist/`; Playwright launches `pnpm preview` and does not build first.
- Running `pnpm verify` without `pnpm build` after changing generated output.
