const CONDITION_FIELDS = [
  "country",
  "region",
  "city",
  "continent",
  "currency",
  "language",
  "browser",
  "os",
  "deviceType",
];

const ACTION_TYPES = ["show", "hide", "replaceText", "replaceAttribute", "redirect"];

const SELECTOR_REQUIRED_ACTIONS = ["show", "hide", "replaceText", "replaceAttribute"];
const CONTENT_REQUIRED_ACTIONS = ["replaceText", "replaceAttribute", "redirect"];

function validateRule(rule) {
  const errors = [];

  if (!CONDITION_FIELDS.includes(rule.field)) {
    errors.push(`unknown field "${rule.field}"`);
  }

  if (!ACTION_TYPES.includes(rule.action)) {
    errors.push(`unknown action "${rule.action}"`);
    return errors;
  }

  if (SELECTOR_REQUIRED_ACTIONS.includes(rule.action) && !rule.selector) {
    errors.push(`selector is required for action "${rule.action}"`);
  }

  if (rule.action === "replaceAttribute" && !rule.attribute) {
    errors.push(`attribute is required for action "${rule.action}"`);
  }

  if (CONTENT_REQUIRED_ACTIONS.includes(rule.action) && !rule.content) {
    errors.push(`content is required for action "${rule.action}"`);
  }

  return errors;
}

function validateRules(rules) {
  const result = {};
  rules.forEach((rule, index) => {
    const errors = validateRule(rule);
    if (errors.length > 0) {
      result[index] = errors;
    }
  });
  return result;
}

module.exports = { CONDITION_FIELDS, ACTION_TYPES, validateRule, validateRules };
