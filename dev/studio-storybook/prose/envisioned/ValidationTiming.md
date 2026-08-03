---
source: stories/envisioned/ValidationTiming.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: de3f46d8667c406e
---

<!-- @component -->

Validation timing is a two-sided cliff, and products fall off both edges: validate too early and the form scolds people for work they haven't done, validate too late and the publish attempt becomes an audit of everything at once.

|          |                                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Forms & Input/StringInput`, the Validation timing (Current / Recommended) pair. That pair argues on-blur beats publish-only; this story completes the argument by adding the failure mode on the other side (premature red) and running all three policies simultaneously on the same rule               |
| Evidence | design law 5 (validate after first meaningful interaction, never before input, never only at publish); audit `inline-validation-timing` and `error-messages`; the pattern library’s ch10 Inline Validation Timing entry, whose cross-product capture shows both failure modes shipping in the field today |
| Patterns | `inline-validation-timing` · `error-messages` · `schema-driven-forms`                                                                                                                                                                                                                                     |

A field that is red before the first keystroke teaches editors that red is noise, which is `error-messages` debt bought at form-load. The audit’s actual finding is the other edge, where a fixable slip typed at minute one surfaces at minute forty. The law threads the cliff: the first meaningful interaction ends the editor’s claim on the field, and that is the moment the system may speak. Blur after typing is that moment for text.

All three fields run the same lowercase rule on the real `StringInput` + `FormField` composition; under each, a timeline records when input happened and when the error appeared, in seconds.

> **Why it matters:** type UPPERCASE into each field and tab away. Premature logs an error at t+0.0 before any input existed; publish-only stays silent until you press its Publish, logging the gap between the mistake and its discovery; after-touch logs the error at the blur boundary, the one timestamp that coincides with the editor actually finishing. The timestamps are the argument.
