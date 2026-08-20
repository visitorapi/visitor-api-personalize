// Hides the given selectors via a synchronous <style> tag so
// personalized elements don't flash their original content while
// visitor-api.js/personalize.js are still loading. Meant to be
// pasted directly in <head>, BEFORE the GTM container snippet --
// GTM itself loads too late (after the browser has already started
// painting) to prevent the flash on its own.
//
// Always installs a timeout-based auto-reveal as a safety net: if
// personalization never calls reveal() (network failure, ad
// blocker, JS error), content must not stay hidden forever.

function installAntiFlicker(selectors, timeoutMs, options) {
  options = options || {};
  var doc = options.doc || document;
  var win = options.win || window;
  var setTimeoutFn = options.setTimeout || setTimeout;

  if (!selectors || selectors.length === 0) {
    return null;
  }

  var styleEl = doc.createElement("style");
  styleEl.setAttribute("data-visitorapi-personalize-antiflicker", "");
  styleEl.textContent = selectors.join(",") + "{opacity:0 !important}";
  doc.head.appendChild(styleEl);

  var revealed = false;
  function reveal() {
    if (revealed) {
      return;
    }
    revealed = true;
    if (styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  }

  win.VisitorAPIPersonalizeReveal = reveal;
  setTimeoutFn(reveal, timeoutMs || 3000);

  return reveal;
}

module.exports = { installAntiFlicker };
