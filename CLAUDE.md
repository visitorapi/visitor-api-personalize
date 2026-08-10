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
- **Status:** early development — see the GitHub issues below for
  current scope; the repo layout will solidify once the rule-schema
  spec issue lands.
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
hosted on `cdn.visitorapi.com`, loaded via `injectScript`. The GTM
template itself is a config UI + loader: it collects the marketer's
rules (condition × action pairs) and passes them to the engine via
`callInWindow`.

## v1 scope

- **Conditions:** country, region/state, city, continent, currency,
  language, browser, OS, device type (desktop / mobile / tablet)
- **Actions:** show element, hide element, replace text content,
  replace an attribute (e.g. `href`, `src`), redirect to a URL
- **Targeting:** one CSS selector per rule; multiple rules per page,
  evaluated in order

## Open design decisions

- **FOUC handling** — hiding personalized elements until the engine
  applies rules needs a blocking snippet + CSS strategy (similar to
  A/B testing tools); affects Core Web Vitals.
- **Rule authoring UX** — start with repeating GTM template fields
  (simple, capped count); consider a JSON config field later for
  power users.

## Related repos

- `products/integrations/gtm-template/` — the base VisitorAPI GTM
  template (dataLayer push only); read its `CLAUDE.md` for the GTM
  sandboxed-JS constraints this repo also has to work within.
- `products/integrations/visitorapi.js/` — the core SDK; the CDN
  build (`cdn.visitorapi.com/visitor-api.js`) is what both templates
  ultimately depend on for visitor data.

## GitHub

Repo: `github.com/visitorapi/visitor-api-personalize`.
