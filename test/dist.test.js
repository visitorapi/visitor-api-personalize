const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const distPath = path.join(__dirname, "..", "dist", "personalize.js");
const antiflickerDistPath = path.join(__dirname, "..", "dist", "personalize-antiflicker.js");

test("build.js produces dist/personalize.js and dist/personalize-antiflicker.js", () => {
  execFileSync("node", [path.join(__dirname, "..", "build.js")]);
  assert.ok(require("node:fs").existsSync(distPath));
  assert.ok(require("node:fs").existsSync(antiflickerDistPath));
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

test("the antiflicker bundle auto-installs using window config on load", () => {
  delete require.cache[require.resolve(antiflickerDistPath)];

  const styleEl = { attributes: {}, textContent: "", parentNode: null, setAttribute() {} };
  const head = {
    appendChild(el) {
      el.parentNode = head;
    },
    removeChild() {},
  };
  const fakeDoc = { head, createElement: () => styleEl };
  let scheduledDelay = null;
  const fakeWin = {
    visitorApiPersonalizeSelectors: [".us-banner"],
    visitorApiPersonalizeTimeout: 5000,
    document: fakeDoc,
    setTimeout: (fn, delay) => { scheduledDelay = delay; },
  };

  // The bundle reads `window`/`document`/`setTimeout` as ambient globals
  // (it's meant to run as a plain <script> tag), so stub them globally
  // for the duration of this require.
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalSetTimeout = global.setTimeout;
  global.window = fakeWin;
  global.document = fakeDoc;
  global.setTimeout = fakeWin.setTimeout;
  try {
    require(antiflickerDistPath);
  } finally {
    global.window = originalWindow;
    global.document = originalDocument;
    global.setTimeout = originalSetTimeout;
  }

  assert.equal(typeof fakeWin.VisitorAPIPersonalizeReveal, "function");
  assert.equal(scheduledDelay, 5000);
});
