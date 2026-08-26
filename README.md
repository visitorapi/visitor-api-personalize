# VisitorAPI Personalization

Six GTM templates + one shared engine for personalizing on-page
content by visitor location, language, and currency — built on
[VisitorAPI](https://www.visitorapi.com).

Marketers configure rules (e.g. "country = US → show this banner",
"currency = EUR → swap this price") directly in the Google Tag
Manager UI, with no custom code.

**Status:** core functionality verified end-to-end in a real GTM
container. See the
[GitHub issues](https://github.com/visitorapi/visitor-api-personalize/issues)
for current scope.

## Which template do I use?

There isn't one generic "Personalize" template — each use case is
its own GTM Custom Template, in `templates/`:

| Template | Use it to... |
|---|---|
| `replace-image.tpl` | Swap an `<img>`'s `src` |
| `replace-link.tpl` | Swap an `<a>`'s `href` |
| `replace-text.tpl` | Swap an element's text |
| `show-hide.tpl` | Show or hide an element |
| `redirect.tpl` | Redirect the visitor |
| `replace-attribute.tpl` | Swap any other attribute (advanced escape hatch) |

Why six instead of one: GTM's repeating table field
(`SIMPLE_TABLE`) can't hide columns per row based on another column
in that same row, so a single generic template with a "field ->
value -> action -> selector -> attribute -> content" table means the
Attribute and Content columns show for every row regardless of
whether that row's action needs them — confusing, and confirmed so
in real testing. Splitting by use case means every column in every
template is always relevant. See `CLAUDE.md` for the fuller
rationale and history.

Add one tag per kind of personalization you want; each template's
table supports multiple rows for repeats of that same kind (e.g. 5
different image swaps in one `replace-image.tpl` tag).

## How it relates to the base VisitorAPI GTM template

[`visitor-api-google-tag-manager`](https://github.com/visitorapi/visitor-api-google-tag-manager)
detects visitor data and pushes it into the GTM dataLayer. This repo
builds a personalization layer on top: a small engine that reads
that data and applies content rules to the page, plus GTM templates
that let marketers author those rules without writing JavaScript.

## What's in the repo

```
.
├── continents.js                       # ISO country -> continent lookup
├── schema.js                            # rule schema + validation (see SCHEMA.md)
├── engine.js                             # condition matching + DOM action execution -- shared by every template
├── antiflicker.js                        # FOUC-prevention: hide/reveal via a <style> tag
├── build.js                              # bundles the above into the two dist/ files below
├── dist/personalize.js                   # generated -- goes on the CDN, loaded by every GTM template
├── dist/personalize-antiflicker.js       # generated -- goes on the CDN, loaded directly by the page (not via GTM)
├── templates/
│   ├── use-cases.js                      # per-template config: table columns + buildRules() logic
│   ├── generate.js                       # emits the six .tpl files below from use-cases.js
│   ├── replace-image.tpl                 # generated GTM Custom Templates --
│   ├── replace-link.tpl                  # see "Which template do I use?" above
│   ├── replace-text.tpl
│   ├── show-hide.tpl
│   ├── redirect.tpl
│   └── replace-attribute.tpl
├── test/                                 # node:test suite (fake DOM, fast)
└── e2e/                                  # Playwright suite (real Chromium/Firefox/WebKit)
```

## Running the tests

```bash
npm test
```

Runs `node --test test/*.test.js` -- no dependencies, no install step.
These test `schema.js`/`engine.js`/`antiflicker.js` directly against
fake `document`/`window` objects (fast, no browser needed).

## Running the cross-browser tests

```bash
npm install
npx playwright install chromium firefox webkit  # first time only
npm run build                                    # regenerates dist/, which the fixtures load
npm run test:e2e
```

Runs `e2e/*.spec.js` against real Chromium, Firefox, and WebKit via
Playwright, loading the actual built `dist/personalize.js` and
`dist/personalize-antiflicker.js` into local HTML fixtures
(`e2e/fixtures/`). This is the one thing `node:test`'s fake DOM
can't cover: real `querySelectorAll`/style/attribute behavior across
real browser engines. It calls `window.VisitorAPIPersonalize(...)`
directly with hand-built rules and visitor data -- it doesn't
exercise any of the `templates/*.tpl` files or the real VisitorAPI
network call, since neither can run outside GTM/a live project. Real
GTM Preview-mode testing is still a separate, manual step (see
below).

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
hand with the selectors used across whichever GTM templates' rule
tables you've configured -- they're separate config surfaces (one
lives on the page, one lives in GTM) because the anti-flicker
snippet has to run before GTM does. Only list selectors for rules
where the *original* content
would look wrong being visible even briefly (a swapped price, a
country-specific banner) -- don't blanket-list every selector in
every rule, since anything listed here is invisible for up to the
full timeout if personalization is slow or fails.

## Testing a GTM template

1. `npm run build`, then upload `dist/personalize.js` and
   `dist/personalize-antiflicker.js` to `cdn.visitorapi.com` so both
   URLs resolve.
2. `npm run build:templates` (or use the committed `templates/*.tpl`
   files directly -- they're generated but checked in, same as
   `dist/*.js`).
3. In GTM, Templates -> Tag Templates -> New -> import whichever
   `templates/<use-case>.tpl` you need (or paste its contents into
   the code editor). Repeat per use case -- there's no single
   "install everything" template.
4. Use the template editor's own **Test** tab first -- it runs the
   `___TESTS___` scenario in that file without needing a live
   container.
5. Add the tag to a test container with a real `projectId` and at
   least one rule row, then use GTM's **Preview** mode against a real
   page: watch for the `visitor-api-personalize-applied` (or
   `visitor-api-personalize-error`) event in the dataLayer/Preview
   panel to confirm it fired and how many rules matched.

Confirmed working end-to-end this way with `show-hide.tpl` against a
real GTM container.

## License

Apache 2.0
