const test = require("node:test");
const assert = require("node:assert/strict");
const { installAntiFlicker, TARGET_CLASS } = require("../antiflicker");

function fakeStyleElement() {
  return { attributes: {}, textContent: "", parentNode: null, setAttribute(name, value) {
    this.attributes[name] = value;
  } };
}

function fakeDocument() {
  const head = {
    appendChild(el) {
      el.parentNode = head;
      head.children = head.children || [];
      head.children.push(el);
    },
    removeChild(el) {
      el.parentNode = null;
      head.children = (head.children || []).filter((c) => c !== el);
    },
  };
  return {
    head,
    createElement() {
      return fakeStyleElement();
    },
  };
}

test("installAntiFlicker appends an opacity:0 style rule for the fixed target class", () => {
  const doc = fakeDocument();
  const win = {};
  installAntiFlicker(3000, { doc, win, setTimeout: () => {} });
  assert.equal(doc.head.children.length, 1);
  assert.equal(doc.head.children[0].textContent, `.${TARGET_CLASS}{opacity:0 !important}`);
});

test("installAntiFlicker exposes a reveal function on win that removes the style element", () => {
  const doc = fakeDocument();
  const win = {};
  installAntiFlicker(3000, { doc, win, setTimeout: () => {} });
  assert.equal(typeof win.VisitorAPIPersonalizeReveal, "function");
  win.VisitorAPIPersonalizeReveal();
  assert.equal(doc.head.children.length, 0);
});

test("installAntiFlicker's reveal is idempotent (safe to call twice)", () => {
  const doc = fakeDocument();
  const win = {};
  const reveal = installAntiFlicker(3000, { doc, win, setTimeout: () => {} });
  reveal();
  assert.doesNotThrow(() => reveal());
});

test("installAntiFlicker schedules an auto-reveal after the given timeout", () => {
  const doc = fakeDocument();
  const win = {};
  let scheduledFn = null;
  let scheduledDelay = null;
  installAntiFlicker(2500, {
    doc,
    win,
    setTimeout: (fn, delay) => {
      scheduledFn = fn;
      scheduledDelay = delay;
    },
  });
  assert.equal(scheduledDelay, 2500);
  assert.equal(doc.head.children.length, 1);
  scheduledFn();
  assert.equal(doc.head.children.length, 0);
});

test("installAntiFlicker defaults the timeout to 3000ms", () => {
  const doc = fakeDocument();
  const win = {};
  let scheduledDelay = null;
  installAntiFlicker(undefined, {
    doc,
    win,
    setTimeout: (fn, delay) => {
      scheduledDelay = delay;
    },
  });
  assert.equal(scheduledDelay, 3000);
});

test("installAntiFlicker allows overriding the target class (for testing/advanced use)", () => {
  const doc = fakeDocument();
  const win = {};
  installAntiFlicker(3000, { doc, win, setTimeout: () => {}, className: "custom-class" });
  assert.equal(doc.head.children[0].textContent, ".custom-class{opacity:0 !important}");
});
