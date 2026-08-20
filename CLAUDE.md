# VisitorAPI Personalization

A GTM template + engine that lets marketers show/hide or swap on-page
content based on visitor country, region, city, currency, language,
browser, OS, and device — configured entirely in the GTM UI, no code
required. Built on top of the visitor data VisitorAPI already detects
(see `products/integrations/gtm-template/`, which only pushes that
data into the GTM dataLayer today).

This file is self-contained. If you cloned only this repo, you have
everything you need here.

- **Product context:** requires a VisitorAPI project ID and domain
  allowlist (see `https://app.visitorapi.com`), same as the base
  `visitor-api-google-tag-manager` template.
- **Status:** early development — rule schema, engine, and the GTM
  template exist and pass their tests (`npm test`), but nothing has
  been deployed: `dist/personalize.js` hasn't been uploaded to
  `cdn.visitorapi.com`, `template.tpl` hasn't been imported into a
  real GTM container, and it hasn't been tested end-to-end in GTM
  Preview mode yet. See the GitHub issues for what's left
  (cross-browser test harness, Gallery submission, docs).
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

`template.tpl`'s sandboxed JS is a self-sufficient tag, not a
dataLayer reader: it `injectScript`s `visitor-api.js` first (same
CDN file the base `gtm-template` uses) to get visitor data, then
`injectScript`s `personalize.js` and calls it directly via
`copyFromWindow('VisitorAPIPersonalize')(rules, visitorData)` —
mirroring exactly how the base template calls `VisitorAPI` (a
direct function call after `copyFromWindow`, **not** `callInWindow`).
This means marketers don't need the base template installed too, and
it avoids `callInWindow`'s extra indirection. Rules from the
template's `SIMPLE_TABLE` field are transformed (comma-split values,
etc.) into the schema shape before being handed to the engine. A
`visitor-api-personalize-applied` (or `-error`) `dataLayer` event
fires afterward, carrying how many rules matched, for debugging in
GTM Preview mode.

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
  selectors used in the GTM template's rules table — see README.md's
  "Preventing flash of original content" section.
- ~~**Rule authoring UX**~~ **Decided:** `template.tpl` uses a
  `SIMPLE_TABLE` field (one row per rule, columns for field/value/
  action/selector/attribute/content) rather than free-form repeating
  fields or a JSON blob.
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
