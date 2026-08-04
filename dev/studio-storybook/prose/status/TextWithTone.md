---
source: stories/status/TextWithTone.stories.tsx
title: 'Document Status/Text With Tone'
blocks: 1
roundtrip: true
sourceHash: e03dc895c3800fef
---

<!-- @component -->

Tone alone is not a signal every editor can read: the audit found validation errors set apart from neutral help text by hue only, invisible in grayscale and to colour-blind editors.

|          |                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/textWithTone/TextWithTone.tsx`, Studio-only, no DS equivalent                                                                                                                                                                                                                                                                                                    |
| Tier     | CHROME. A pure presentation primitive: it wraps `@sanity/ui` `<Text>` and swaps one CSS custom property (`--card-fg-color`) per `tone`, plus an optional `dimmed` opacity. Zero domain logic                                                                                                                                                                                                          |
| Audit    | 🔴 needs-work (`similarity`, `error-messages`). TextWithTone is the mechanism behind colour-only status text. The audit found form errors rendered as a red icon + pink fill with the actual message hidden until hover; where the message is shown, it is distinguished from neutral copy by hue alone. Toned text with no shape or label cue is unreadable in grayscale and to colour-blind editors |
| Patterns | `similarity` · `error-messages`                                                                                                                                                                                                                                                                                                                                                                       |

The little primitive that tints a line of text by tone, the mechanism behind Studio's coloured validation messages, filter labels, and error strips. Any time a line of text in Studio turns red for an error, amber for a caution, or green for success, this is the primitive doing it. TextWithTone wraps `@sanity/ui` `<Text>` and swaps a single CSS custom property per tone, no domain logic, just the colour. That makes it the quiet workhorse behind toned copy across the whole app, and also the exact spot where a colour-only-status habit takes root.

Its CSS defines exactly five tones (`default`, `primary`, `positive`, `caution`, `critical`); any other `ButtonTone` falls through to inherited colour. `muted` short-circuits the tone rule entirely (`&:not([data-muted])`), and `dimmed` drops opacity to 0.3, both are visible in the sweeps below.

> **Why it matters:** when this is used for status, pair the toned text with a leading icon that carries the same meaning by shape, so the message reads as an error before the pink is perceived.

The last story shows it in context: the toned lines composed into a real validation summary for the book Anna Karenina.
