---
source: stories/releases/VersionInlineBadge.stories.tsx
title: 'Releases/Version Inline Badge'
blocks: 6
roundtrip: true
sourceHash: 486180f88fc4923c
---

<!-- @component -->

This is the component that makes release copy translatable: because it is an inline span rather than a sentence broken into pieces, the whole sentence stays one translation key and a translator can move the badge wherever their grammar puts it.

|        |                                                                       |
| ------ | --------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/releases/components/VersionInlineBadge.tsx` |
| Tier   | CHROME                                                                |

A release name set inline inside a sentence, tinted to that release's tone. It is what turns "This document is in Autumn campaign" from a sentence with a name in it into a sentence with a release in it. A styled `<span>`, deliberately: it has to sit in the text flow, wrap with it, and inherit the line height around it. A `<Card>` or a `Badge` would be a block in the middle of a paragraph.

Pair it with `getVersionInlineBadge(release)`, which resolves the tone from the release document and returns a component ready to hand to the i18n `<Translate>` helper.

> **Why it matters:** the alternative pattern, a sentence broken into three pieces so a badge can be dropped in the middle, hard-codes English word order and hands translators fragments instead of a sentence. That is why this appears in nearly every release dialog and banner: the copy does the explaining and the badge does the pointing.

<!-- @story Default -->

The resting state. Change the tone in the controls to see the palette; the point of the story is that the badge sits on the text baseline rather than knocking the line out of alignment.

<!-- @story ToneMatrix -->

The full palette. In practice releases only ever produce four of these - caution for asap, suggest for scheduled, neutral for undecided, default for archived - but the component accepts any `BadgeTone` because non-release callers use it too.

<!-- @story ResolvedFromRelease -->

`getVersionInlineBadge(release)` runs the same `getReleaseTone` the avatar uses and hands back a bound component. This is the form call sites actually use, and it is what keeps a release the same colour in a sentence as it is in the perspective menu two surfaces away.

<!-- @story Wrapping -->

The reason it is a span, shown in a narrow column: the badge flows with the paragraph and breaks across lines like any other word. A block-level badge would force a line break before and after itself wherever it landed.

<!-- @story InContext -->

Three of the sentences an editor actually meets, each naming a differently-toned release. Read them together and the pattern is clear: the copy carries the meaning and the badge carries the identity, so neither has to be duplicated in the other.
