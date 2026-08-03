---
source: stories/data/ToneIcon.stories.tsx
title: 'Lists & Data/ToneIcon'
blocks: 3
roundtrip: true
sourceHash: 8724ad64113b293f
---

<!-- @component -->

A lot of status in Studio rides on a single tinted glyph: a positive-green check, a caution-amber clock, a critical-red warning. ToneIcon is the small shared primitive that does that tinting, so every status glyph across the app pulls from the same palette.

|          |                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/toneIcon/ToneIcon.tsx`, Studio-only (no DS equivalent)                                                                                                                                    |
| Tier     | CHROME. A pure presentation atom: it maps a `tone` key to a themed CSS colour variable on an icon, zero domain logic                                                                                                         |
| Audit    | 🔴 needs-work (`similarity`, `draft-publish-lifecycle`). The audit found document status rendered as colour-only dots of identical shape and size, so status is unreadable to colourblind users and to anyone scanning shape |
| Patterns | `similarity` · `draft-publish-lifecycle`                                                                                                                                                                                     |

Hand it any `@sanity/icons` glyph and a `tone` key and it renders the icon in the theme colour for that status. Wraps any `@sanity/icons` glyph and tints it with the theme `--card-badge-<tone>-icon-color` variable. It is the shared tinting primitive behind status glyphs across Releases, Variants, and the perspective menu. The gotcha: ToneIcon only writes the `--card-icon-color` custom property, the rule that reads it lives on `@sanity/ui` `<Text>`, so it must be nested in a `<Text>` (as every real call site does) or it renders in the inherited text colour.

Addressed for `similarity` looks like the `Current` vs `Recommended` pair below: pairing each tone with a distinct icon shape and a text label so the status survives a grayscale render.

> **Why it matters:** ToneIcon writes a CSS custom property; a surrounding text element applies the colour. Drop it anywhere that is not inside that element and the tone is silently ignored: the icon renders in the inherited text colour, exactly as the wrap-gotcha story shows.

The page closes **in context**: the validation summary for the "Anna Karenina" draft, each field issue led by a tone-coloured status glyph.

<!-- @story Current -->

Reproduces the audit finding: status conveyed by hue alone. Four identical `CircleIcon` dots differing only in tone, indistinguishable once color is removed.

<!-- @story Recommended -->

The resolved state: tone is retained but paired with a distinct glyph shape and a label per status. Survives a grayscale render and passes non-color status signalling.
