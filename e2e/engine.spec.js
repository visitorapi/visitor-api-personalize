const path = require("node:path");
const { test, expect } = require("@playwright/test");

const fixtureUrl = "file://" + path.join(__dirname, "fixtures", "engine.html");
const usVisitor = { countryCode: "US" };

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureUrl);
});

test("show reveals a hidden element when the rule matches", async ({ page }) => {
  await page.evaluate((visitor) => {
    window.VisitorAPIPersonalize(
      [{ field: "country", value: "US", action: "show", selector: ".show-target" }],
      visitor
    );
  }, usVisitor);

  await expect(page.locator(".show-target")).toBeVisible();
});

test("hide hides a visible element when the rule matches", async ({ page }) => {
  await page.evaluate((visitor) => {
    window.VisitorAPIPersonalize(
      [{ field: "country", value: "US", action: "hide", selector: ".hide-target" }],
      visitor
    );
  }, usVisitor);

  await expect(page.locator(".hide-target")).toBeHidden();
});

test("replaceText swaps textContent when the rule matches", async ({ page }) => {
  await page.evaluate((visitor) => {
    window.VisitorAPIPersonalize(
      [{ field: "country", value: "US", action: "replaceText", selector: ".text-target", content: "swapped text" }],
      visitor
    );
  }, usVisitor);

  await expect(page.locator(".text-target")).toHaveText("swapped text");
});

test("replaceAttribute swaps an attribute when the rule matches", async ({ page }) => {
  await page.evaluate((visitor) => {
    window.VisitorAPIPersonalize(
      [{
        field: "country",
        value: "US",
        action: "replaceAttribute",
        selector: ".link-target",
        attribute: "href",
        content: "/us/pricing",
      }],
      visitor
    );
  }, usVisitor);

  await expect(page.locator(".link-target")).toHaveAttribute("href", "/us/pricing");
});

test("redirect invokes the navigate option with the configured URL", async ({ page }) => {
  const navigatedTo = await page.evaluate((visitor) => {
    let captured = null;
    window.VisitorAPIPersonalize(
      [{ field: "country", value: "US", action: "redirect", content: "https://example.com/us" }],
      visitor,
      { navigate: (url) => { captured = url; } }
    );
    return captured;
  }, usVisitor);

  expect(navigatedTo).toBe("https://example.com/us");
});

test("a non-matching rule leaves every element untouched", async ({ page }) => {
  await page.evaluate((visitor) => {
    window.VisitorAPIPersonalize(
      [
        { field: "country", value: "CA", action: "show", selector: ".show-target" },
        { field: "country", value: "CA", action: "hide", selector: ".hide-target" },
        { field: "country", value: "CA", action: "replaceText", selector: ".text-target", content: "should not appear" },
      ],
      visitor
    );
  }, usVisitor);

  await expect(page.locator(".show-target")).toBeHidden();
  await expect(page.locator(".hide-target")).toBeVisible();
  await expect(page.locator(".text-target")).toHaveText("original text");
});
