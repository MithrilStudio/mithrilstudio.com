import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const standardVideoPath = fileURLToPath(new URL("../../public/static/bg.mp4", import.meta.url));

const blockExternalRequests = async (page) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|$)).+/, (route) => route.abort());
};

test("root navigation reaches the unchanged landing route", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/we-are-back\/$/);
  await expect(page.getByRole("button", { name: "Unveil" })).toBeVisible();
});

test("landing reveal, links, media fallback, and pause recovery remain intact", async ({ page }) => {
  let upgradeRequested = false;
  await page.route("**/static/bg_4k.mp4", (route) => {
    upgradeRequested = true;
    return route.abort();
  });
  await blockExternalRequests(page);

  await page.goto("/we-are-back/", { waitUntil: "domcontentloaded" });

  const fallback = page.locator(".hero-background-fallback");
  const video = page.locator("#heroBackground video");
  await expect(fallback).toHaveAttribute("src", "../static/bg.jpg");
  await expect.poll(() => upgradeRequested).toBe(true);
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("src", "../static/bg.mp4");
  await expect(video).toHaveJSProperty("autoplay", true);
  await expect(video).toHaveJSProperty("muted", true);
  await expect(video).toHaveJSProperty("loop", true);
  await expect(video).toHaveJSProperty("playsInline", true);

  await expect.poll(() => video.evaluate((item) => item.readyState)).toBeGreaterThanOrEqual(2);
  await video.evaluate(async (item) => {
    const media = /** @type {HTMLVideoElement} */ (item);
    await media.play();
    media.pause();
  });
  await expect.poll(() => video.evaluate((item) => item.paused)).toBe(false);

  await page.getByRole("button", { name: "Unveil" }).click();
  await expect(page.locator("body")).toHaveClass(/is-final-visible/);
  await expect(page.locator(".final-content")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("body")).toHaveClass(/is-final-links-visible/);

  const links = page.locator(".hero-links a");
  await expect(links).toHaveCount(4);
  await expect(links.nth(0)).toHaveAttribute("href", "https://store.steampowered.com/app/4864320");
  await expect(links.nth(1)).toHaveAttribute("href", "https://www.youtube.com/watch?v=4CpC8Gbq9D0");
  await expect(links.nth(2)).toHaveAttribute("href", "https://discord.gg/qs2WB5ARqr");
  await expect(links.nth(3)).toHaveAttribute("href", "mailto:contact@myrionstudio.com");
  for (let index = 0; index < 4; index += 1) {
    await expect(links.nth(index)).not.toHaveAttribute("tabindex", "-1");
  }
});

test("successful 4K replacement preserves active playback progress", async ({ page }) => {
  let releaseUpgrade;
  const upgradeGate = new Promise((resolve) => {
    releaseUpgrade = resolve;
  });
  let upgradeRequested = false;

  await page.route("**/static/bg_4k.mp4", async (route) => {
    upgradeRequested = true;
    await upgradeGate;
    await route.fulfill({
      path: standardVideoPath,
      contentType: "video/mp4",
    });
  });
  await blockExternalRequests(page);
  await page.goto("/we-are-back/", { waitUntil: "domcontentloaded" });

  const standardVideo = page.locator('#heroBackground video[src$="bg.mp4"]');
  await expect.poll(() => upgradeRequested).toBe(true);
  await expect.poll(() => standardVideo.evaluate((item) => item.readyState)).toBeGreaterThanOrEqual(1);

  const before = await standardVideo.evaluate((item) => ({
    currentTime: item.currentTime,
    duration: item.duration,
    now: performance.now(),
  }));
  releaseUpgrade();

  const upgradedVideo = page.locator('#heroBackground video[src$="bg_4k.mp4"]');
  await expect(upgradedVideo).toHaveCount(1);
  await expect(page.locator("#heroBackground video")).toHaveCount(1);
  const after = await upgradedVideo.evaluate((item) => ({
    currentTime: item.currentTime,
    duration: item.duration,
    now: performance.now(),
  }));
  const expectedTime = (before.currentTime + (after.now - before.now) / 1000) % after.duration;
  const directDelta = Math.abs(after.currentTime - expectedTime);
  const wrappedDelta = Math.min(directDelta, Math.abs(after.duration - directDelta));

  expect(Number.isFinite(before.duration)).toBe(true);
  expect(Number.isFinite(after.duration)).toBe(true);
  expect(wrappedDelta).toBeLessThan(0.75);
});

test("custom 404 keeps its content and returns home", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/404.html", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This Gate Is Missing" })).toBeVisible();
  await expect(page.getByText("The page you requested is not here.")).toBeVisible();
  await expect(page.locator("#notFoundVideo")).toHaveJSProperty("muted", true);
  await expect(page.getByRole("link", { name: "Return Home" })).toHaveAttribute("href", "/we-are-back/");
  await page.getByRole("link", { name: "Return Home" }).click();
  await expect(page).toHaveURL(/\/we-are-back\/$/);
});

test("production media supports byte-range requests", async ({ request }) => {
  const response = await request.get("/static/bg.mp4", {
    headers: {
      Range: "bytes=0-99",
    },
  });

  expect(response.status()).toBe(206);
  expect(response.headers()["content-range"]).toMatch(/^bytes 0-99\/3017034$/);
  expect((await response.body()).byteLength).toBe(100);
});
