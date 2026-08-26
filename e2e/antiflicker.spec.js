const path = require("node:path");
const { test, expect } = require("@playwright/test");

const fixtureUrl = "file://" + path.join(__dirname, "fixtures", "antiflicker.html");

test("hides the configured selector immediately on load", async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect(page.locator(".hero")).toHaveCSS("opacity", "0");
});

test("reveals immediately when VisitorAPIPersonalizeReveal is called", async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect(page.locator(".hero")).toHaveCSS("opacity", "0");

  await page.evaluate(() => window.VisitorAPIPersonalizeReveal());

  await expect(page.locator(".hero")).toHaveCSS("opacity", "1");
});

test("auto-reveals after the configured timeout even if reveal is never called", async ({ page }) => {
  await page.goto(fixtureUrl);
  await expect(page.locator(".hero")).toHaveCSS("opacity", "0");

  // fixture sets a 800ms timeout
  await expect(page.locator(".hero")).toHaveCSS("opacity", "1", { timeout: 2000 });
});
