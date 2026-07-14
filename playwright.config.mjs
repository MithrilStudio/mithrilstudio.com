import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    headless: true,
    launchOptions: {
      args: ["--autoplay-policy=no-user-gesture-required"],
    },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "msedge",
      use: {
        channel: "msedge",
      },
    },
  ],
  webServer: {
    command: "pnpm preview --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321/we-are-back/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
