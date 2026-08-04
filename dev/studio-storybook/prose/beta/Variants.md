---
source: stories/beta/Variants.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: 49c6842f60d57752
---

<!-- @component -->

One document, many audiences: Content Variants let a single piece carry per-audience, per-market, or per-locale copies, each targeted by conditions and shown to the right reader automatically. This is Sanity's headline bet on personalised content, and its value is still under-told.

|          |                                                                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/variants/`, Studio-only (no design-system equivalent)                                                                                                                                                                            |
| Flag     | `beta.variants.enabled`, default off (`BetaFeatures.variants`, `core/config/types.ts`). When enabled, the plugin registers the Variants tool, the navbar "View as" row, and variant-scoped document handling                                               |
| Tier     | SERVICE. A net-new content primitive composed from existing machinery (releases table, perspective router, preview store); not editing-core, not chrome                                                                                                    |
| Audit    | 🔴 needs-work (`content-versioning`). The benchmark flagged Studio versioning surfaces as under-explained; Variants is the headline default-disabled bet and its in-product value narrative is still thin, these stories double as the missing walkthrough |
| Patterns | `content-versioning`                                                                                                                                                                                                                                       |

The idea is simple to say and deep to build: write once, define who each variant is for, and let the perspective router serve the matching copy.

Content Variants let one document group carry per-audience/per-locale variant copies, targeted by `conditions` (audience, market, locale, plan, and so on) with a `priority` order. A variant _definition_ is a `system.variant` document at `_.variants.<id>`; the _content_ lives in ordinary version documents whose `_system.variant` points back at the definition. The surfaces here run the real store, hooks and table code against a fixture client (list and counts queries) and a fixture preview store (membership id-set); see `lib/variantsFixtures.ts`.

The `Overview` and `Detail` stories mount the whole `VariantsTool` on a stateful router: clicking a variant row opens the real detail view (grouped document table, release bundle chips resolved from the seeded releases store, live validation on the title-less fixture document).

> **Why it matters:** keep the two halves straight. A variant definition is a system.variant document that describes an audience; the variant content lives in ordinary version documents that point back at that definition. The definition is the rule, the version is the copy, conflate them and the model stops making sense.
