---
name: publishing-github-pages
description: Use when changing, auditing, or troubleshooting this repository's GitHub Pages workflow, gh-pages snapshot, Git LFS asset delivery, CNAME provisioning, deploy key, or Pages deployment. Do not use for ordinary Astro page, layout, interaction, form, font, or browser-media changes whose publish contract is unchanged.
---

# Publishing GitHub Pages

## Outcome

Publish one validated `dist/` snapshot whose assets are real files and whose domain metadata is provisioned at release time. Identify the exact failing boundary before changing configuration.

## Workflow

### 1. Locate the first failing boundary

Start from the exact workflow run, commit, branch, domain, or asset named by the request. Record its source commit as `<target-revision>`; use `HEAD` only when it is that named target. Read `.github/workflows/deploy-gh-pages.yml` and the publishing assertions in `tests/project-contract.test.mjs` and `tests/output-contract.test.mjs` before editing.

Classify the failure at the earliest boundary that lacks evidence:

1. **Source tracking:** `.gitattributes`, LFS pointer policy, and the committed source tree.
2. **Origin objects:** required LFS objects exist on the remote for the target commit.
3. **Actions checkout:** source files are expanded after the LFS-enabled checkout.
4. **Build output:** `pnpm build` creates the expected `dist/` files with no LFS pointers.
5. **Publish snapshot:** only generated `dist/` content plus release-time metadata enters the commit.
6. **Branch update:** the intended commit reaches `gh-pages` through the authenticated SSH push.
7. **Pages service:** GitHub Pages selects the expected source and completes its deployment.
8. **Public delivery:** custom-domain DNS, TLS, and served bytes match that deployment.

Do not diagnose a later boundary until the preceding boundary is proven. A successful push does not prove Pages deployment or public delivery.

### 2. Preserve the publish contract

- Use the pinned Node.js and pnpm versions from the repository and install with the frozen lockfile.
- Run the repository build; publish only `source/dist`, never the source checkout or repository root.
- Keep both pointer checks and origin-object checks. GitHub Pages must receive expanded asset bytes, not Git LFS pointer text.
- Keep `.nojekyll` in the generated output.
- Provision `CNAME` from the `CNAME` Repository variable during publishing. Do not add `public/CNAME` or hard-code the domain in the workflow.
- Keep the publish snapshot `.gitattributes` rules that prevent generated assets from becoming LFS pointers on `gh-pages`.
- Keep the deploy key secret-only, strict host verification, and the intentionally force-updated generated branch.
- Never print credentials, private keys, or secret values while diagnosing a run.

### 3. Change the narrowest owning layer

State the requirement, failing scenario, non-goals, and evidence before editing. Add or adjust the smallest relevant contract test first and confirm that it catches the missing behavior.

- Change source asset tracking in `.gitattributes` or the LFS guard, not in the generated snapshot.
- Change generated-site contents in Astro/public source, not by hand-editing `dist/` or `gh-pages`.
- Change build and release mechanics in the workflow while retaining its enforced invariants.
- Change repository variables, secrets, Pages settings, DNS, or TLS only when evidence places the failure at that remote boundary and the task authorizes that external change.

If the request also changes how an image, video, font, or browser fallback behaves, **REQUIRED SUB-SKILL:** use `changing-site-experience` as well.

### 4. Verify the affected boundaries

| Boundary | Required evidence |
| --- | --- |
| Source pointers | For a named commit, `bash .githooks/lfs-guard.sh --tree <target-revision>` and `git lfs fsck --pointers <target-revision>`; for a staged candidate, use `bash .githooks/lfs-guard.sh --index` |
| Origin LFS objects | `git lfs fetch origin <target-revision>` and `git lfs fsck --objects <target-revision>` when remote access is in scope |
| Repository contracts | Targeted test while iterating, then `pnpm verify` |
| Generated snapshot | `pnpm build`; inspect `dist/` for required routes, `.nojekyll`, excluded maintenance files, and LFS pointer signatures |
| Workflow edit | Parse the YAML with an available YAML validator; run repository contract tests and inspect the exact step order and publish path |
| Branch update | Inspect the target run and verify the expected source SHA produced the `gh-pages` commit |
| Pages service | Inspect the Pages deployment/status for that publish commit; do not infer it from local success |
| Public delivery | Verify the expected domain, DNS/TLS state, response, and representative binary bytes after deployment |

When credentials or network access are unavailable, report the last proven boundary and the exact remote evidence still required. Do not replace missing evidence with a guess.

Finish with `git diff --check` and inspect the final diff for weakened guards, hard-coded domain data, or accidentally published maintenance files.

## Quick Reference

| Symptom | Start with |
| --- | --- |
| Asset is pointer text | Source tracking -> origin object -> checkout -> `dist/` -> served bytes |
| Build passes but deployment fails | Exact Actions run and first failed step |
| `gh-pages` updated but site is stale | Pages deployment commit/status, then cache and served bytes |
| Custom domain fails | Publish-time `CNAME`, Pages domain setting, DNS, then TLS |
| SSH push fails | Secret presence, key format, host verification, and remote authorization without printing secrets |

## Common Mistakes

- Treating a local build, branch push, HTTP 200, or one cached asset as end-to-end proof.
- Removing a pointer or object guard to make publishing pass.
- Committing `public/CNAME`, editing `dist/`, or patching `gh-pages` by hand.
- Testing a different workflow run or commit than the one named in the request.
- Assuming a Pages, DNS, or TLS problem from workflow YAML without inspecting the remote boundary.
- Downloading, decoding, or logging secret material during diagnosis.
