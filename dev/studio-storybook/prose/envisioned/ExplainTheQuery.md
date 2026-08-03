---
source: stories/envisioned/ExplainTheQuery.stories.tsx
title: 'Dune'
blocks: 1
roundtrip: true
sourceHash: b103d8556b49005f
---

<!-- @component -->

A search result is an answer to a question the editor did not quite ask, and a bare list makes them guess the question back.

|          |                                                                                                                                                                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Actions & Commands/CommandList`, the Keyboard navigation (combobox) story: the exact input-plus-listbox composition the global search overlay mounts. This story keeps that harness and changes only what a result row is allowed to say                                                                                                         |
| Evidence | researcher’s brief Claim 3, explainable retrieval (all seven observed products return search results as bare lists; not one says why a result matched); audit `explain-the-query` and `sampling-disclosure`. The brief names Studio’s unfair advantage: GROQ is inspectable and Vision already exposes query mechanics beautifully, to developers |
| Patterns | `explain-the-query` · `sampling-disclosure`                                                                                                                                                                                                                                                                                                       |

Every row here carries its match provenance: which field matched, the matched term highlighted in its own context, and, the case no product handles, matches that travelled through a reference, labelled as the path they took. Try `dune` (title matches), `desert` (body matches, highlighted mid-sentence), and `herbert` (neither title nor body contains it, the rows explain they matched through the referenced author, which in a bare list reads as a search bug and here reads as the content model working).

> **Why it matters:** flip the explain switch off mid-query and the same result set becomes unaccountable. Editors mistrusting search, duplicates created because the original couldn't be found, is what this row template is priced against.
