const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveFieldValue, matchesRule, applyAction, run } = require("../engine");

function fakeElement() {
  return { style: {}, textContent: "", attributes: {}, setAttribute(name, value) {
    this.attributes[name] = value;
  } };
}

function fakeDocument(selectorMap) {
  return {
    querySelectorAll(selector) {
      return selectorMap[selector] || [];
    },
  };
}

test("resolveFieldValue reads country from countryCode", () => {
  assert.equal(resolveFieldValue({ countryCode: "US" }, "country"), "US");
});

test("resolveFieldValue reads region and city directly", () => {
  const visitor = { region: "California", city: "Mountain View" };
  assert.equal(resolveFieldValue(visitor, "region"), "California");
  assert.equal(resolveFieldValue(visitor, "city"), "Mountain View");
});

test("resolveFieldValue reads browser and os directly", () => {
  const visitor = { browser: "Chrome", os: "macOS" };
  assert.equal(resolveFieldValue(visitor, "browser"), "Chrome");
  assert.equal(resolveFieldValue(visitor, "os"), "macOS");
});

test("resolveFieldValue returns the currencies array as-is", () => {
  assert.deepEqual(
    resolveFieldValue({ currencies: ["USD"] }, "currency"),
    ["USD"]
  );
});

test("resolveFieldValue returns the languages array as-is", () => {
  assert.deepEqual(
    resolveFieldValue({ languages: ["en-US", "en"] }, "language"),
    ["en-US", "en"]
  );
});

test("resolveFieldValue derives continent from countryCode", () => {
  assert.equal(resolveFieldValue({ countryCode: "FR" }, "continent"), "EU");
  assert.equal(resolveFieldValue({ countryCode: "JP" }, "continent"), "AS");
  assert.equal(resolveFieldValue({ countryCode: "BR" }, "continent"), "SA");
  assert.equal(resolveFieldValue({ countryCode: "NG" }, "continent"), "AF");
  assert.equal(resolveFieldValue({ countryCode: "AU" }, "continent"), "OC");
  assert.equal(resolveFieldValue({ countryCode: "US" }, "continent"), "NA");
});

test("resolveFieldValue returns null for continent when countryCode is unmapped", () => {
  assert.equal(resolveFieldValue({ countryCode: "ZZ" }, "continent"), null);
});

test("resolveFieldValue derives desktop deviceType from a desktop OS", () => {
  assert.equal(resolveFieldValue({ os: "Windows" }, "deviceType"), "desktop");
  assert.equal(resolveFieldValue({ os: "macOS" }, "deviceType"), "desktop");
});

test("resolveFieldValue derives mobile deviceType from a mobile OS", () => {
  assert.equal(resolveFieldValue({ os: "Android" }, "deviceType"), "mobile");
  assert.equal(resolveFieldValue({ os: "iOS" }, "deviceType"), "mobile");
});

test("resolveFieldValue upgrades iOS + iPad deviceFamily to tablet", () => {
  assert.equal(
    resolveFieldValue({ os: "iOS", deviceFamily: "iPad" }, "deviceType"),
    "tablet"
  );
});

test("resolveFieldValue returns null for an unknown field", () => {
  assert.equal(resolveFieldValue({ countryCode: "US" }, "notAField"), null);
});

test("matchesRule matches a scalar field against a scalar rule value, case-insensitively", () => {
  const visitor = { countryCode: "us" };
  assert.equal(
    matchesRule(visitor, { field: "country", value: "US" }),
    true
  );
  assert.equal(
    matchesRule(visitor, { field: "country", value: "CA" }),
    false
  );
});

test("matchesRule matches a scalar field against an array rule value (any of)", () => {
  const visitor = { countryCode: "CA" };
  assert.equal(
    matchesRule(visitor, { field: "country", value: ["US", "CA"] }),
    true
  );
  assert.equal(
    matchesRule(visitor, { field: "country", value: ["US", "MX"] }),
    false
  );
});

test("matchesRule matches an array field (currency) if any visitor currency is in the rule value", () => {
  const visitor = { currencies: ["USD", "CAD"] };
  assert.equal(
    matchesRule(visitor, { field: "currency", value: "CAD" }),
    true
  );
  assert.equal(
    matchesRule(visitor, { field: "currency", value: "EUR" }),
    false
  );
});

test("matchesRule matches language on primary subtag as well as exact tag", () => {
  const visitor = { languages: ["en-US"] };
  assert.equal(matchesRule(visitor, { field: "language", value: "en" }), true);
  assert.equal(
    matchesRule(visitor, { field: "language", value: "en-US" }),
    true
  );
  assert.equal(matchesRule(visitor, { field: "language", value: "fr" }), false);
});

test("matchesRule returns false when the field resolves to null (e.g. unmapped continent)", () => {
  assert.equal(
    matchesRule({ countryCode: "ZZ" }, { field: "continent", value: "AF" }),
    false
  );
});

test("applyAction hide sets display:none on every matched element", () => {
  const el1 = fakeElement();
  const el2 = fakeElement();
  const doc = fakeDocument({ ".banner": [el1, el2] });
  applyAction({ action: "hide", selector: ".banner" }, doc);
  assert.equal(el1.style.display, "none");
  assert.equal(el2.style.display, "none");
});

test("applyAction show clears display on every matched element", () => {
  const el = fakeElement();
  el.style.display = "none";
  const doc = fakeDocument({ ".banner": [el] });
  applyAction({ action: "show", selector: ".banner" }, doc);
  assert.equal(el.style.display, "");
});

test("applyAction replaceText sets textContent on every matched element", () => {
  const el = fakeElement();
  const doc = fakeDocument({ ".price": [el] });
  applyAction({ action: "replaceText", selector: ".price", content: "€19" }, doc);
  assert.equal(el.textContent, "€19");
});

test("applyAction replaceAttribute sets the named attribute on every matched element", () => {
  const el = fakeElement();
  const doc = fakeDocument({ "a.cta": [el] });
  applyAction(
    { action: "replaceAttribute", selector: "a.cta", attribute: "href", content: "/eu/pricing" },
    doc
  );
  assert.equal(el.attributes.href, "/eu/pricing");
});

test("run applies every matching rule's action and skips non-matching rules", () => {
  const banner = fakeElement();
  const doc = fakeDocument({ ".us-banner": [banner] });
  run(
    [
      { field: "country", value: "US", action: "show", selector: ".us-banner" },
      { field: "country", value: "CA", action: "hide", selector: ".us-banner" },
    ],
    { countryCode: "US" },
    { doc }
  );
  assert.equal(banner.style.display, "");
});

test("run calls navigate for a matching redirect rule", () => {
  let navigatedTo = null;
  run(
    [{ field: "country", value: "US", action: "redirect", content: "https://example.com/us" }],
    { countryCode: "US" },
    { navigate: (url) => { navigatedTo = url; } }
  );
  assert.equal(navigatedTo, "https://example.com/us");
});

test("run skips a rule that fails schema validation", () => {
  let navigatedTo = null;
  run(
    [{ field: "country", value: "US", action: "redirect" }], // missing content
    { countryCode: "US" },
    { navigate: (url) => { navigatedTo = url; } }
  );
  assert.equal(navigatedTo, null);
});
