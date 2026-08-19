const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const distPath = path.join(__dirname, "..", "dist", "personalize.js");

test("build.js produces dist/personalize.js", () => {
  execFileSync("node", [path.join(__dirname, "..", "build.js")]);
  assert.ok(require("node:fs").existsSync(distPath));
});

test("the built bundle exposes a working VisitorAPIPersonalize function", () => {
  delete require.cache[require.resolve(distPath)];
  const { VisitorAPIPersonalize } = require(distPath);
  assert.equal(typeof VisitorAPIPersonalize, "function");

  const el = { style: {}, textContent: "", attributes: {}, setAttribute(name, value) {
    this.attributes[name] = value;
  } };
  const doc = { querySelectorAll: (selector) => (selector === ".us-banner" ? [el] : []) };

  const applied = VisitorAPIPersonalize(
    [{ field: "country", value: "US", action: "show", selector: ".us-banner" }],
    { countryCode: "US" },
    { doc }
  );

  assert.equal(el.style.display, "");
  assert.deepEqual(applied, [{ field: "country", action: "show", selector: ".us-banner" }]);
});
