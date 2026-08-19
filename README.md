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
├── continents.js        # ISO country -> continent lookup
├── schema.js             # rule schema + validation (see SCHEMA.md)
├── engine.js              # condition matching + DOM action execution
├── build.js               # bundles the three files above into dist/personalize.js
├── dist/personalize.js    # generated -- the file that actually gets uploaded to the CDN
├── template.tpl            # the GTM Custom Template
├── metadata.yaml           # Gallery metadata (filled in at first submission)
└── test/                   # node:test suite for all of the above
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

Regenerates `dist/personalize.js` from `continents.js`, `schema.js`, and
`engine.js`. Run this after any engine/schema change, then upload the
resulting `dist/personalize.js` to `cdn.visitorapi.com` (manual/out-of-band,
same as the base template's `visitor-api.js`).

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
