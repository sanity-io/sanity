---
source: stories/envisioned/ProvenanceLedger.stories.tsx
title: 'Envisioned/Provenance Ledger'
blocks: 1
roundtrip: true
sourceHash: d6afc9d1007d9f46
---

<!-- @component -->

Three products stream AI output straight into the document with no gate; one has the field's only per-output accept-gate and then erases provenance at the moment of accept; zero of seven observed products can answer which words are machine-written one minute after acceptance.

|          |                                                                                                                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Forms & Input/PortableText`, the block editor these spans would live in, with the acceptance-gate mechanics inherited from the field’s one good example (per the benchmark, WordPress’s Discard/Regenerate/Accept gate) minus its fatal flaw   |
| Evidence | researcher’s brief Claim 1, provenance-preserving AI acceptance, ranked the largest unclaimed opening in the field. The brief’s design sentence is implemented literally here: accept should be an event in the document’s history, not a paste |
| Patterns | `block-editor-authoring` · `content-versioning`                                                                                                                                                                                                 |

The model is three commitments. Accept is an event: the gate’s Accept commits spans that permanently carry model, prompt, and acceptedAt. Provenance survives editing: revising a machine span transitions it to a third, honest state, because the interesting enterprise question is not binary. The document can answer: at any time, a minute or a year after acceptance, which words did the machine write is a query the document itself resolves.

That last property is the procurement question the brief says is already being learned, and it is cheap only on a substrate that models text as spans, the structural advantage Portable Text already has.

> **Why it matters:** toggle the provenance lens and machine spans reveal a dotted underline; the ledger is invisible until asked, so the reading surface pays nothing. Run the full loop: generate, accept, toggle the lens, revise a span, ask again, the revised span still answers, as machine-origin, human-revised.
