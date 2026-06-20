# Agent Skills

This directory is the shared Agent Skills root for tools that support the Agent Skills format.

No project-specific skills are defined yet. Add a skill only when a repeated workflow needs more detail than belongs in `AGENTS.md`, such as a deploy audit, asset publishing check, or browser verification loop.

When adding a skill:

- Use `.agents/skills/<skill-name>/SKILL.md`.
- Keep `name` equal to the folder name.
- Keep `description` focused on when to use the skill.
- Put long examples, scripts, and references behind explicit links so agents load them only when needed.
- Update `docs/ai/source-index.md` if the skill relies on external platform behavior.
