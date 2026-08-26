# VisitorAPI Personalization

Six GTM templates + one shared engine that let marketers show/hide or
swap on-page content based on visitor country, region, city, currency,
language, browser, OS, and device — configured entirely in the GTM
UI, no code required. Built on top of the visitor data VisitorAPI
already detects (see `products/integrations/gtm-template/`, which
only pushes that data into the GTM dataLayer today).

This file is self-contained. If you cloned only this repo, you have
everything you need here.

- **Product context:** requires a VisitorAPI project ID and domain
  allowlist (see `https://app.visitorapi.com`), same as the base
  `visitor-api-google-tag-manager` template.
- **Status:** core functionality verified end-to-end. `dist/*.js` is
  live on `cdn.visitorapi.com`; `templates/show-hide.tpl` has been
  imported into a real GTM container and confirmed working in Preview
  mode — a `show`/`hide` rule correctly hid a targeted element and
  fired `visitor-api-personalize-applied` with the right applied-rule
  count in the dataLayer. Rule schema, engine, and a real-browser
  Playwright suite (`npm run test:e2e`, covering Chromium/Firefox/
  WebKit) all pass. The other five templates share the exact same
  engine and sandboxed-JS scaffolding as the verified one (see
  "Key technical constraint" below) and are covered by
  `test/templates.test.js`, but haven't each individually been run
  through a live GTM Preview session yet. What's left: Gallery
  submission + thumbnail(s), and docs (see GitHub issues).
- **Planning doc:** the Notion task for this initiative has the full
  background, v1 scope, and open-decision log —
  [Personalised GTM Template](https://app.notion.com/p/3b58ec76106881518c09e4815b6a5b7c).

## Why this is a separate repo, not part of `gtm-template`

Different release cadence and versioning, and the base
`visitor-api-google-tag-manager` template needs to keep working
standalone for people who only want the dataLayer push, not
personalization.

## Key technical constraint

GTM Custom Template sandboxed JS has **no direct DOM API** — it can
only read/write `dataLayer`, call whitelisted globals, or
`injectScript` an external file that then runs unsandboxed. So the
actual personalization logic (DOM read/write: show/hide elements,
swap text, swap attributes, redirect) has to live in a small engine
(`dist/personalize.js`, built from `continents.js`/`schema.js`/
`engine.js`) hosted on `cdn.visitorapi.com`, loaded via
`injectScript`.

Every template's sandboxed JS is a self-sufficient tag, not a
dataLayer reader: it `injectScript`s `visitor-api.js` first (same
CDN file the base `gtm-template` uses) to get visitor data, then
`injectScript`s `personalize.js` and calls it directly via
`copyFromWindow('VisitorAPIPersonalize')(rules, visitorData)` —
mirroring exactly how the base template calls `VisitorAPI` (a
direct function call after `copyFromWindow`, **not** `callInWindow`).
This means marketers don't need the base template installed too, and
it avoids `callInWindow`'s extra indirection. Each template's own
`buildRules()` transforms its `SIMPLE_TABLE` rows (comma-split
values, etc.) into the schema shape before handing them to the
engine. A `visitor-api-personalize-applied` (or `-error`) `dataLayer`
event fires afterward, carrying how many rules matched, for debugging
in GTM Preview mode.

This plumbing (permissions, injectScript sequencing, dataLayer push)
is byte-for-byte identical across all six templates — see "Six
templates, one engine" below for why, and how it's kept from
drifting between copies.

## Six templates, one engine

`templates/` holds six separate `.tpl` files, not one generic
template — `replace-image`, `replace-link`, `replace-text`,
`show-hide`, `redirect`, and `replace-attribute` (an advanced
escape hatch for attributes other than `src`/`href`). Each has its
own `SIMPLE_TABLE` with only the columns that use case needs (e.g.
`replace-image.tpl`'s table has no "attribute" or generic "action"
column — it hardcodes `action: 'replaceAttribute', attribute: 'src'`
internally and just asks for a selector + new image URL).

**Why not one generic template:** the original design (`template.tpl`,
now removed) had one `SIMPLE_TABLE` with field/value/action/selector/
attribute/content columns. GTM's `SIMPLE_TABLE` can't conditionally
hide a column per row based on another column in that same row, so
Attribute and the overloaded Content column always showed regardless
of the selected action — confirmed confusing in real GTM testing (see
[#9](https://github.com/visitorapi/visitor-api-personalize/issues/9)).
Splitting by use case means every visible column is always relevant,
at the cost of six templates to maintain/submit instead of one.

**How duplication is avoided:** `templates/generate.js` holds the
shared boilerplate (permissions JSON, injectScript/copyFromWindow
sequencing, dataLayer debug events) exactly once and generates all
six `.tpl` files from `templates/use-cases.js`, where each use case
defines only its `SIMPLE_TABLE` columns and its own `buildRules()`
function (row -> generic `{field, value, action, selector, attribute,
content}` shape). `engine.js`/`schema.js` never changed for this —
only the GTM-facing config layer did. Regenerate with
`npm run build:templates`; the output is committed (same pattern as
`dist/*.js`) so the `.tpl` files are directly importable without a
build step.

**Open, unresolved:** how Community Template Gallery submission (#6)
works with six templates instead of one — conventionally one repo
maps to one Gallery submission (see the sibling `gtm-template` repo).
Whether that means six separate submissions, picking the highest-value
ones first, or something else hasn't been decided.

## v1 scope

- **Conditions:** country, region/state, city, continent, currency,
  language, browser, OS, device type (desktop / mobile / tablet)
- **Actions:** show element, hide element, replace text content,
  replace an attribute (e.g. `href`, `src`), redirect to a URL
- **Targeting:** one CSS selector per rule; multiple rules per page,
  evaluated in order

## Open design decisions

- ~~**FOUC handling**~~ **Decided:** `antiflicker.js` (built to
  `dist/personalize-antiflicker.js`) is a *separate* snippet the
  marketer pastes directly into `<head>`, before the GTM container
  snippet — GTM itself fires too late to prevent the flash on its
  own. It hides a marketer-configured selector list via `opacity:0`
  and reveals it either when `engine.js`'s `run()` finishes (it calls
  `window.VisitorAPIPersonalizeReveal()`) or after a timeout safety
  net, whichever comes first. Tradeoff: that selector list is
  separate from, and has to be kept in sync by hand with, the
  selectors used across whichever templates' rule tables you've
  configured — see README.md's "Preventing flash of original content"
  section.
- ~~**Rule authoring UX**~~ **Decided, then revised:** originally one
  generic `SIMPLE_TABLE` (field/value/action/selector/attribute/
  content) in a single template. Real GTM testing showed GTM can't
  hide irrelevant columns per row, so this was split into six
  use-case-specific templates, each with a `SIMPLE_TABLE` scoped to
  just that use case — see "Six templates, one engine" above.
- ~~**Where visitor data comes from**~~ **Decided:** the template
  fetches it itself via its own `injectScript` of `visitor-api.js`
  (see "Key technical constraint" above) rather than reading the
  base template's `dataLayer` push.

## Related repos

- `products/integrations/gtm-template/` — the base VisitorAPI GTM
  template (dataLayer push only); read its `CLAUDE.md` for the GTM
  sandboxed-JS constraints this repo also has to work within.
- `products/integrations/visitorapi.js/` — the core SDK; the CDN
  build (`cdn.visitorapi.com/visitor-api.js`) is what both templates
  ultimately depend on for visitor data.

## GitHub

Repo: `github.com/visitorapi/visitor-api-personalize`.
