# Agent Skills

This directory indexes the two repeated project workflows. `AGENTS.md` stays the concise entry point; load a Skill only when its trigger matches the task.

| Skill | Use when | Do not use for |
| --- | --- | --- |
| [`changing-site-experience`](changing-site-experience/SKILL.md) | Changing or diagnosing routes, copy, responsive layout, browser interaction, form UI, fonts, images, video, or media fallbacks | Publish-only workflow, Git LFS, `CNAME`, deploy-key, or Pages work |
| [`publishing-github-pages`](publishing-github-pages/SKILL.md) | Changing, auditing, or troubleshooting the Pages workflow, `gh-pages` snapshot, Git LFS delivery, `CNAME`, deploy key, or deployment/public-delivery boundary | Ordinary site experience changes whose publish contract is unchanged |

Use both Skills when an asset or media change affects both browser behavior and published delivery.

## Maintenance

- Keep each `SKILL.md` project-specific, procedural, and below the Agent Skills progressive-disclosure limits.
- Keep `name` equal to the folder name and make `description` include both positive and negative trigger boundaries.
- Validate structure, then test realistic should-trigger/should-not-trigger prompts and at least one execution scenario against the no-Skill baseline.
- Update `docs/ai/source-index.md` when a Skill relies on changed external behavior.
