# VisitorAPI Personalization

A GTM template + engine for personalizing on-page content by visitor
location, language, and currency — built on
[VisitorAPI](https://www.visitorapi.com).

Marketers configure rules (e.g. "country = US → show this banner",
"currency = EUR → swap this price") directly in the Google Tag
Manager UI, with no custom code.

**Status:** early development. See the
[GitHub issues](https://github.com/visitorapi/visitor-api-personalize/issues)
for current scope.

## How it relates to the base VisitorAPI GTM template

[`visitor-api-google-tag-manager`](https://github.com/visitorapi/visitor-api-google-tag-manager)
detects visitor data and pushes it into the GTM dataLayer. This repo
builds a personalization layer on top: a small engine that reads
that data and applies content rules to the page, plus a GTM template
that lets marketers author those rules without writing JavaScript.

## What's in the repo

```
.
├── continents.js                       # ISO country -> continent lookup
├── schema.js                            # rule schema + validation (see SCHEMA.md)
├── engine.js                             # condition matching + DOM action execution
├── antiflicker.js                        # FOUC-prevention: hide/reveal via a <style> tag
├── build.js                              # bundles the above into the two dist/ files below
├── dist/personalize.js                   # generated -- goes on the CDN, loaded by the GTM tag
├── dist/personalize-antiflicker.js       # generated -- goes on the CDN, loaded directly by the page (not via GTM)
├── template.tpl                          # the GTM Custom Template
├── metadata.yaml                         # Gallery metadata (filled in at first submission)
└── test/                                 # node:test suite for all of the above
```

## Running the tests

```bash
npm test
```

Runs `node --test test/*.test.js` -- no dependencies, no install step.

## Rebuilding the CDN bundle

```bash
npm run build
```

Regenerates both `dist/personalize.js` (from `continents.js`, `schema.js`,
`engine.js`) and `dist/personalize-antiflicker.js` (from `antiflicker.js`).
Run this after any source change, then upload both files to
`cdn.visitorapi.com` (manual/out-of-band, same as the base template's
`visitor-api.js`).

## Preventing flash of original content (FOUC)

The GTM tag can't act until GTM itself has loaded and fired -- by
then the browser may already have painted the page's default content.
GTM can't fix this from inside the tag; a separate, synchronous
snippet has to run in `<head>` *before* GTM loads.

Add this directly to the page (not through GTM), as early in `<head>`
as possible -- before any stylesheets, and definitely before the GTM
container snippet:

```html
<script>
  window.visitorApiPersonalizeSelectors = [".us-banner", ".eu-price"];
  window.visitorApiPersonalizeTimeout = 3000; // ms; safety net if personalization never fires
</script>
<script src="https://cdn.visitorapi.com/personalize-antiflicker.js"></script>
```

This hides exactly those selectors (via `opacity:0`, so layout space
is still reserved -- no jump on reveal) the instant it runs, then
reveals them either when `engine.js`'s `run()` finishes (it calls
`window.VisitorAPIPersonalizeReveal()` automatically once it's done
applying rules) or after the timeout, whichever comes first. The
timeout exists so a network failure, ad blocker, or JS error never
leaves content permanently hidden.

**Known tradeoff:** the selector list here has to be kept in sync by
hand with the selectors used in the GTM template's rules table --
they're two separate config surfaces (one lives on the page, one
lives in GTM) because the anti-flicker snippet has to run before GTM
does. Only list selectors for rules where the *original* content
would look wrong being visible even briefly (a swapped price, a
country-specific banner) -- don't blanket-list every selector in
every rule, since anything listed here is invisible for up to the
full timeout if personalization is slow or fails.

## Testing the GTM template itself

1. `npm run build`, then upload `dist/personalize.js` to
   `cdn.visitorapi.com` so `https://cdn.visitorapi.com/personalize.js`
   resolves.
2. In GTM, Templates -> Tag Templates -> New -> import `template.tpl`
   (or paste its contents into the code editor).
3. Use the template editor's own **Test** tab first -- it runs the
   `___TESTS___` scenario in this file without needing a live
   container.
4. Add the tag to a test container with a real `projectId` and at
   least one rule, then use GTM's **Preview** mode against a real
   page: watch for the `visitor-api-personalize-applied` (or
   `visitor-api-personalize-error`) event in the dataLayer/Preview
   panel to confirm it fired and how many rules matched.

## License

Apache 2.0
