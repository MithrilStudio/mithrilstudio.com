import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { relative, sep } from "node:path";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const readDist = (path) => readFile(new URL(path, dist), "utf8");

const readLocalScripts = async (html) => {
  const sources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((source) => source.startsWith("/_astro/"));
  return (await Promise.all(sources.map((source) => readDist(source.slice(1))))).join("\n");
};

const visibleTextHash = (html) => {
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "\n")
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/&mdash;/g, "—")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
  return createHash("sha256").update(text).digest("hex");
};

const walkFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
};

test("built root keeps every redirect fallback", async () => {
  const html = await readDist("index.html");
  assert.match(html, /rel="canonical" href="\.\/we-are-back\/"/);
  assert.match(html, /http-equiv="refresh" content="0; url=\.\/we-are-back\/"/);
  assert.match(html, /window\.location\.replace\("\.\/we-are-back\/"\)/);
  assert.match(html, /href="\.\/we-are-back\/"/);
});

test("built landing keeps the immutable public contract", async () => {
  const html = await readDist("we-are-back/index.html");
  const output = `${html}\n${await readLocalScripts(html)}`;
  for (const token of [
    "../static/bg.jpg",
    "../static/bg.mp4",
    "../static/bg_4k.mp4",
    "Unveil",
    "https://store.steampowered.com/app/4864320",
    "https://www.youtube.com/watch?v=LNXwNEvDnOo",
    "https://discord.gg/qs2WB5ARqr",
    "mailto:contact@myrionstudio.com",
    "沪ICP备2026032805号-1",
    "G-TYCXYX29SE",
    "39a8f49e9a834a78b557a304d7ed5dc7",
  ]) {
    assert.ok(output.includes(token), `missing built landing token: ${token}`);
  }
  assert.equal(visibleTextHash(html), "45ed611a84597abd5ce69922257e7d19c84ea6ef3761d76898b6075991d15d7e");
});

test("built 404 is the root custom error document", async () => {
  const html = await readDist("404.html");
  for (const token of [
    "Page Not Found",
    "This Gate Is Missing",
    "The page you requested is not here.",
    'href="/we-are-back/"',
    "/static/bg.jpg",
    "/static/bg.mp4",
    "沪ICP备2026032805号-1",
    "G-TYCXYX29SE",
    "39a8f49e9a834a78b557a304d7ed5dc7",
  ]) {
    assert.ok(html.includes(token), `missing built 404 token: ${token}`);
  }
  assert.equal(visibleTextHash(html), "9ee803e428b1e729f456cab6493cbfd720ac57581079f45c92a5f3adc16674b2");
  await assert.rejects(stat(new URL("404/index.html", dist)), { code: "ENOENT" });
});

test("nojekyll is copied and CNAME is not provisioned locally", async () => {
  assert.equal(await readDist(".nojekyll"), "");
  await assert.rejects(stat(new URL("CNAME", dist)), { code: "ENOENT" });
});

test("built publication has expanded assets and no LFS pointers", async () => {
  const files = await walkFiles(dist);
  assert.ok(files.length > 0);
  for (const file of files) {
    const bytes = await readFile(file);
    assert.notEqual(
      bytes.subarray(0, 42).toString("utf8"),
      "version https://git-lfs.github.com/spec/v1",
      `LFS pointer published: ${file.pathname}`,
    );
  }
});

test("built publication excludes source and maintenance files", async () => {
  const files = await walkFiles(dist);
  const paths = files.map((file) => relative(new URL(".", dist).pathname, file.pathname).split(sep).join("/"));
  const forbidden = ["AGENTS.md", "CLAUDE.md", "package.json", "src/", "tests/", "docs/ai/", ".agents/", ".github/"];
  for (const prefix of forbidden) {
    assert.equal(
      paths.some((path) => path === prefix || path.startsWith(prefix)),
      false,
      `forbidden publication path: ${prefix}`,
    );
  }
});
