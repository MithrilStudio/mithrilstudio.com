# AI Source Index

This file records sources that affect AI-maintenance rules for this repository. Re-check time-sensitive entries before changing related behavior.

| Area | Source | Last checked | Next review | Update trigger | Current conclusion |
| --- | --- | --- | --- | --- | --- |
| Cross-agent project instructions | [AGENTS.md](https://agents.md/) | 2026-06-20 | 2026-09-20 | New major agent tool support, conflicting repo instructions, or prompt skeleton changes | `AGENTS.md` is a standard Markdown entry point for coding-agent project context; closest file wins and user instructions override. |
| VS Code Copilot custom instructions | [Use custom instructions in VS Code](https://code.visualstudio.com/docs/agent-customization/custom-instructions) | 2026-06-20 | 2026-09-20 | VS Code Copilot instruction loading changes | VS Code supports repository `AGENTS.md` and `CLAUDE.md`; instructions should be short and focused. |
| Claude Code memory | [How Claude remembers your project](https://code.claude.com/docs/en/memory) | 2026-06-20 | 2026-09-20 | Claude Code memory or import behavior changes | Claude Code reads `CLAUDE.md`; on Windows prefer `@AGENTS.md` import over symlinks. |
| Agent Skills format | [Agent Skills Specification](https://agentskills.io/specification) and [Quickstart](https://agentskills.io/skill-creation/quickstart) | 2026-06-20 | 2026-09-20 | Skill format, discovery, or validation changes | A skill is a directory with `SKILL.md`; use progressive disclosure and keep long resources on demand. |
| GitHub Pages hosting | [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | 2026-06-20 | 2026-09-20 | Pages hosting, custom domain, or build-source behavior changes | GitHub Pages publishes static HTML, CSS, JavaScript, and assets from a repository source or workflow output. |
| Local publish workflow | `.github/workflows/deploy-gh-pages.yml` | 2026-06-20 | 2026-09-20 | Workflow, LFS, publish branch, or site-content exclusions change | The workflow builds `_site`, rejects Git LFS pointers, force-pushes `gh-pages`, and should exclude AI-maintenance files from site output. |
| Landing page contract | `index.html` | 2026-06-20 | 2026-09-20 | Relaunch activity form, hero media, static asset, or frontend submission behavior changes | The page contains the visible campaign experience and a relaunch activity dialog with an `email` field. |
