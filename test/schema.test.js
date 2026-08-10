const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CONDITION_FIELDS,
  ACTION_TYPES,
  validateRule,
  validateRules,
} = require("../schema");

test("CONDITION_FIELDS lists the v1 supported condition fields", () => {
  assert.deepEqual(CONDITION_FIELDS, [
    "country",
    "region",
    "city",
    "continent",
    "currency",
    "language",
    "browser",
    "os",
    "deviceType",
  ]);
});

test("ACTION_TYPES lists the v1 supported actions", () => {
  assert.deepEqual(ACTION_TYPES, [
    "show",
    "hide",
    "replaceText",
    "replaceAttribute",
    "redirect",
  ]);
});

test("validateRule accepts a well-formed show rule", () => {
  const errors = validateRule({
    field: "country",
    value: "US",
    action: "show",
    selector: ".us-banner",
  });
  assert.deepEqual(errors, []);
});

test("validateRule accepts a value array (matches any of)", () => {
  const errors = validateRule({
    field: "country",
    value: ["US", "CA"],
    action: "hide",
    selector: ".eu-only",
  });
  assert.deepEqual(errors, []);
});

test("validateRule rejects an unknown condition field", () => {
  const errors = validateRule({
    field: "zipCode",
    value: "90210",
    action: "show",
    selector: ".x",
  });
  assert.ok(errors.includes('unknown field "zipCode"'));
});

test("validateRule rejects an unknown action", () => {
  const errors = validateRule({
    field: "country",
    value: "US",
    action: "explode",
    selector: ".x",
  });
  assert.ok(errors.includes('unknown action "explode"'));
});

test("validateRule requires a selector for show/hide/replaceText/replaceAttribute", () => {
  const errors = validateRule({
    field: "country",
    value: "US",
    action: "show",
  });
  assert.ok(errors.includes("selector is required for action \"show\""));
});

test("validateRule does not require a selector for redirect", () => {
  const errors = validateRule({
    field: "country",
    value: "US",
    action: "redirect",
    content: "https://example.com/us",
  });
  assert.deepEqual(errors, []);
});

test("validateRule requires attribute for replaceAttribute", () => {
  const errors = validateRule({
    field: "country",
    value: "US",
    action: "replaceAttribute",
    selector: "a.cta",
    content: "/us/pricing",
  });
  assert.ok(
    errors.includes('attribute is required for action "replaceAttribute"')
  );
});

test("validateRule requires content for replaceText, replaceAttribute, and redirect", () => {
  assert.ok(
    validateRule({
      field: "country",
      value: "US",
      action: "replaceText",
      selector: ".price",
    }).includes('content is required for action "replaceText"')
  );
  assert.ok(
    validateRule({
      field: "country",
      value: "US",
      action: "replaceAttribute",
      selector: "a.cta",
      attribute: "href",
    }).includes('content is required for action "replaceAttribute"')
  );
  assert.ok(
    validateRule({
      field: "country",
      value: "US",
      action: "redirect",
    }).includes('content is required for action "redirect"')
  );
});

test("validateRules aggregates per-rule errors keyed by index", () => {
  const result = validateRules([
    { field: "country", value: "US", action: "show", selector: ".a" },
    { field: "nope", value: "US", action: "show", selector: ".b" },
  ]);
  assert.deepEqual(result, {
    1: ['unknown field "nope"'],
  });
});
