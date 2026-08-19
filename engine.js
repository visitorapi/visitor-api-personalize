const { CONTINENT_BY_COUNTRY } = require("./continents");
const { validateRule } = require("./schema");

const MOBILE_OS = ["ios", "android"];
const DESKTOP_OS = ["windows", "macos", "linux", "chrome os"];
const TABLET_DEVICE_FAMILIES = ["ipad", "tablet"];

function deriveDeviceType(visitorData) {
  const os = (visitorData.os || "").toLowerCase();
  const deviceFamily = (visitorData.deviceFamily || "").toLowerCase();

  if (MOBILE_OS.includes(os)) {
    if (TABLET_DEVICE_FAMILIES.some((family) => deviceFamily.includes(family))) {
      return "tablet";
    }
    return "mobile";
  }

  if (DESKTOP_OS.includes(os)) {
    return "desktop";
  }

  return null;
}

function resolveFieldValue(visitorData, field) {
  switch (field) {
    case "country":
      return visitorData.countryCode ?? null;
    case "region":
      return visitorData.region ?? null;
    case "city":
      return visitorData.city ?? null;
    case "browser":
      return visitorData.browser ?? null;
    case "os":
      return visitorData.os ?? null;
    case "currency":
      return visitorData.currencies ?? null;
    case "language":
      return visitorData.languages ?? null;
    case "continent": {
      const countryCode = (visitorData.countryCode || "").toUpperCase();
      return CONTINENT_BY_COUNTRY[countryCode] ?? null;
    }
    case "deviceType":
      return deriveDeviceType(visitorData);
    default:
      return null;
  }
}

function primarySubtag(languageTag) {
  return languageTag.split("-")[0];
}

function languageMatches(visitorLanguage, ruleValue) {
  const visitor = visitorLanguage.toLowerCase();
  const rule = ruleValue.toLowerCase();
  return visitor === rule || primarySubtag(visitor) === rule;
}

function matchesRule(visitorData, rule) {
  const resolved = resolveFieldValue(visitorData, rule.field);
  if (resolved === null || resolved === undefined) {
    return false;
  }

  const resolvedValues = Array.isArray(resolved) ? resolved : [resolved];
  const ruleValues = Array.isArray(rule.value) ? rule.value : [rule.value];

  if (rule.field === "language") {
    return resolvedValues.some((resolvedValue) =>
      ruleValues.some((ruleValue) => languageMatches(resolvedValue, ruleValue))
    );
  }

  const resolvedLower = resolvedValues.map((value) => value.toLowerCase());
  const ruleLower = ruleValues.map((value) => value.toLowerCase());
  return resolvedLower.some((value) => ruleLower.includes(value));
}

function applyAction(rule, doc) {
  const elements = doc.querySelectorAll(rule.selector);
  elements.forEach((element) => {
    switch (rule.action) {
      case "hide":
        element.style.display = "none";
        break;
      case "show":
        element.style.display = "";
        break;
      case "replaceText":
        element.textContent = rule.content;
        break;
      case "replaceAttribute":
        element.setAttribute(rule.attribute, rule.content);
        break;
      default:
        break;
    }
  });
}

function defaultNavigate(url) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}

function run(rules, visitorData, options = {}) {
  const doc = options.doc || (typeof document !== "undefined" ? document : undefined);
  const navigate = options.navigate || defaultNavigate;
  const applied = [];

  rules.forEach((rule) => {
    if (validateRule(rule).length > 0) {
      return;
    }
    if (!matchesRule(visitorData, rule)) {
      return;
    }
    if (rule.action === "redirect") {
      navigate(rule.content);
    } else {
      applyAction(rule, doc);
    }
    applied.push({ field: rule.field, action: rule.action, selector: rule.selector });
  });

  return applied;
}

module.exports = { resolveFieldValue, matchesRule, applyAction, run };
