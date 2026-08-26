# Personalization rule schema (v1)

This is the config shape a marketer builds in the GTM template's
repeating fields, and that the template hands to the personalization
engine via `callInWindow`.

## Rule shape

```json
{
  "field": "country",
  "value": "US",
  "action": "show",
  "selector": ".us-banner",
  "attribute": null,
  "content": null
}
```

| Property    | Required for                                    | Notes                                                                 |
|-------------|--------------------------------------------------|------------------------------------------------------------------------|
| `field`     | always                                            | one of `CONDITION_FIELDS` (below)                                     |
| `value`     | always                                            | a string, or an array of strings (matches if the visitor's value is any one of them) |
| `action`    | always                                            | one of `ACTION_TYPES` (below)                                          |
| `selector`  | `show`, `hide`, `replaceText`, `replaceAttribute` | CSS selector; matches every element it targets, not just the first    |
| `attribute` | `replaceAttribute`                                | e.g. `href`, `src`                                                     |
| `content`   | `replaceText`, `replaceAttribute`, `redirect`     | new text / new attribute value / redirect target URL                   |

A page can define any number of rules. They're evaluated **in array
order**, and every matching rule's action runs (there's no
first-match-wins short-circuit) — a page can, for example, both swap
a price *and* show a banner off the same `country` value.

## Condition fields (`CONDITION_FIELDS`)

| Field        | Resolved from VisitorAPI response                | Match rule                                              |
|--------------|---------------------------------------------------|----------------------------------------------------------|
| `country`    | `countryCode`                                      | case-insensitive equals                                  |
| `region`     | `region`                                           | case-insensitive equals                                  |
| `city`       | `city`                                             | case-insensitive equals                                  |
| `continent`  | derived from `countryCode` via a built-in ISO country → continent table | case-insensitive equals against `AF`/`AN`/`AS`/`EU`/`NA`/`OC`/`SA` |
| `currency`   | `currencies[]`                                     | case-insensitive: matches if any of the visitor's currencies is in `value` |
| `language`   | `languages[]`                                      | case-insensitive: matches on exact tag (`en-US`) or primary subtag (`en`) |
| `browser`    | `browser`                                           | case-insensitive equals                                  |
| `os`         | `os`                                                | case-insensitive equals                                  |
| `deviceType` | derived heuristic — see below                       | case-insensitive equals against `desktop`/`mobile`/`tablet` |

**`continent` and `deviceType` don't exist as direct fields in the
VisitorAPI response** (`products/integrations/visitorapi.js`) — they're
derived in the engine:

- `continent`: looked up from `countryCode` against a static
  ISO-3166-1 alpha-2 → continent-code table. Best-effort — flag
  corrections as they're found rather than treating it as
  authoritative for every territory.
- `deviceType`: `os` is checked against known mobile/desktop OS
  families (`iOS`, `Android` → mobile; `Windows`, `macOS`, `Linux`,
  `Chrome OS` → desktop) and `deviceFamily` is checked for `iPad` /
  `Tablet` to upgrade a mobile-OS match to `tablet`. This is a
  heuristic, not a guarantee — VisitorAPI's SDK does not return an
  explicit device-category field today.

## Actions (`ACTION_TYPES`)

| Action              | Effect                                                        |
|---------------------|-----------------------------------------------------------------|
| `show`               | remove `display: none` / reveal every element matching `selector` |
| `hide`               | apply `display: none` to every element matching `selector`        |
| `replaceText`        | set `textContent` on every element matching `selector` to `content` |
| `replaceAttribute`   | set `attribute` on every element matching `selector` to `content`  |
| `redirect`           | navigate to `content` (a URL); ignores `selector`                   |

## Validation

`schema.js` exports `validateRule(rule)` (returns an array of human-
readable error strings, empty if valid) and `validateRules(rules)`
(returns `{ [index]: string[] }` for only the invalid rules). The
engine (`engine.js`) skips invalid rules rather than throwing, so one
bad rule in a marketer's config doesn't break every other rule on the
page.

## How this maps onto the GTM template

`template.tpl`'s `rules` field is a `SIMPLE_TABLE` (one row per
rule) with columns matching this schema's properties directly,
except `value`, which is a single comma-separated text column split
into an array in the template's sandboxed JS before being handed to
the engine.

## Open, not yet decided here

- FOUC handling (tracked separately — [#3](https://github.com/visitorapi/visitor-api-personalize/issues/3))
