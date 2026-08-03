---
source: stories/customisation/CustomInput.stories.tsx
title: 'Article'
blocks: 3
roundtrip: true
sourceHash: 1118463c6c0d51c2
---

<!-- @component -->

InputProps carries a renderDefault function, and that single prop is the difference between Sanity's customisation model and the usual one: you're handed the default component as an argument, not an empty slot.

|      |                                                            |
| ---- | ---------------------------------------------------------- |
| Seam | `form.components.input`, typed `ComponentType<InputProps>` |
| Tier | SERVICE                                                    |

The normal move is to decorate rather than replace, so the studio's own components remain the substrate of your customisation rather than something you route around. This is the most common UI customisation in Sanity, replacing how a field is rendered, shown three ways against the same document so the trade is visible.

The three stories below are the same schema and the same document. The only thing that changes is the `form.components.input` entry in the workspace config, and that config is the real one, resolved by `createWorkspaceFromConfig` exactly as a studio would. Nothing here is simulated.

Read them in order. Default shows what Studio gives you. Wrapped shows that decorating costs you nothing. Replaced shows what you are actually signing up for when you skip `renderDefault`: the validation marker on Summary disappears, and so does everything else Studio was doing on your behalf.

> **Why it matters:** decorate rather than replace whenever you can. The default component handed to you as an argument is the substrate every other Studio behaviour is built on, and skipping it silently removes capability nothing else warns you about, not just the look.

<!-- @story Default -->

No customisation at all. Note what is here without anyone asking: field titles and descriptions, a validation marker on Summary because the value exceeds its `max(60)` rule, correct input types per field, and the change-indicator gutter down the left.

This is the baseline the next two stories are measured against.

<!-- @story Replaced -->

The same form again, with an input that never calls `renderDefault`. Compare it against story 1 field by field.

**Gone:** the validation marker on Summary. The field descriptions. The per-type inputs - the number field is now a text box. The change indicators. Read-only handling, presence, and focus-path behaviour, none of which are visible here but all of which have stopped working.

None of that is a bug in the replacement; it is simply everything the default was providing, and a replacement inherits none of it. That is the honest cost of the seam, and the reason `renderDefault` exists.

There are legitimate reasons to replace outright - a genuinely different editing surface for a field type, say - but it should be a decision made against this list rather than the default reflex.
