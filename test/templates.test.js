const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { USE_CASES } = require("../templates/use-cases");
const { SPLIT_VALUES_SOURCE } = require("../templates/generate");
const { validateRule } = require("../schema");
const { matchesRule } = require("../engine");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

function extractSection(content, tag) {
  const marker = `___${tag}___`;
  const start = content.indexOf(marker) + marker.length;
  const rest = content.slice(start);
  const nextMarkerMatch = rest.match(/\n\n\n___[A-Z_]+___/);
  const end = nextMarkerMatch ? start + nextMarkerMatch.index : content.length;
  return content.slice(start, end).trim();
}

function evalBuildRules(useCase, rawRules) {
  const fn = new Function(
    "rawRules",
    `${SPLIT_VALUES_SOURCE}\n${useCase.buildRulesSource}\nreturn buildRules(rawRules);`
  );
  return fn(rawRules);
}

test.before(() => {
  execFileSync("node", [path.join(TEMPLATES_DIR, "generate.js")]);
});

for (const useCase of USE_CASES) {
  test(`${useCase.id}.tpl: INFO/TEMPLATE_PARAMETERS/WEB_PERMISSIONS parse as valid JSON`, () => {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, `${useCase.id}.tpl`), "utf8");
    assert.doesNotThrow(() => JSON.parse(extractSection(content, "INFO")));
    assert.doesNotThrow(() => JSON.parse(extractSection(content, "TEMPLATE_PARAMETERS")));
    assert.doesNotThrow(() => JSON.parse(extractSection(content, "WEB_PERMISSIONS")));
  });

  test(`${useCase.id}.tpl: sandboxed JS parses as valid JS`, () => {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, `${useCase.id}.tpl`), "utf8");
    const sandboxedJs = extractSection(content, "SANDBOXED_JS_FOR_WEB_TEMPLATE");
    assert.doesNotThrow(() => new Function("require", "data", sandboxedJs));
  });

  test(`${useCase.id}.tpl: embeds its buildRules() source unmodified`, () => {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, `${useCase.id}.tpl`), "utf8");
    assert.ok(content.includes(useCase.buildRulesSource));
  });

  test(`${useCase.id}: buildRules() turns a table row into the expected generic rule`, () => {
    const rules = evalBuildRules(useCase, [useCase.testMockRow]);
    assert.deepEqual(rules, [useCase.expectedTestRule]);
  });

  test(`${useCase.id}: the produced rule is valid per schema.js and matches its own test visitor`, () => {
    const [rule] = evalBuildRules(useCase, [useCase.testMockRow]);
    assert.deepEqual(validateRule(rule), []);
    assert.equal(matchesRule({ countryCode: "US" }, rule), true);
  });
}
