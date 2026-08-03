---
source: stories/forms/OptionPreview.stories.tsx
title: 'name'
blocks: 1
roundtrip: true
sourceHash: 744e72215837eaf6
---

<!-- @component -->

Somewhere in the form layer sits the highest-branching unstoried component at seven measured states, and it exists twice: the same file, copied rather than shared, answering for both reference inputs that reach outside the current dataset.

|                 |                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source          | `packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/OptionPreview.tsx` and `packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/OptionPreview.tsx` |
| Tier            | SERVICE. One row of a search dropdown, in the two reference inputs that reach outside the current dataset                                                                     |
| Audit           | 🟡 needs-work (`reference-integrity`, `error-recovery`). The same component exists twice with no shared source, and three of its six outcomes render bare unstyled text       |
| Patterns        | `reference-integrity` · `error-recovery`                                                                                                                                      |
| Measured states | 7, six real plus one unreachable                                                                                                                                              |

One result row in the picker for a cross-dataset or global-document reference. It resolves its own info, so every one of these rows is an independent request. Every story renders **both copies side by side**, which is the argument of this page.

**What reading the two files turned up.**

<details><summary><b>They are the same component twice.</b></summary>

Diff them and the only differences are the imported preview (`CrossDatasetReferencePreview` vs `GlobalDocumentReferencePreview`), the identifiers forwarded to it (`dataset`/`projectId` vs `resourceType`/`resourceId`), and a `ReactNode` return annotation on one. Every branch, every guard, every i18n key and the order they are checked in is identical. A fix to one is a fix to one.

</details>

<details><summary><b>The last return re-checks what the guards already proved.</b></summary>

The file ends with `return referenceInfo && refType && (<Preview …/>)`, but `if (!referenceInfo) return null` and `if (!refType) return …` have both already run. That `&&` chain can never take its falsy path. It is the seventh measured state and it is unreachable.

</details>

<details><summary><b>Three branches render bare strings.</b></summary>

Permission-denied and undeclared-type return `<Stack>{t(…)}</Stack>` with no `Text`, so they inherit whatever typography the surrounding menu happens to set, while the failure branch gets a proper `Alert`. Compare the Permission Denied and Undeclared Type stories against Failed.

</details>

> **Why it matters:** these rows are what a person reads while choosing a document from another dataset. Three of the six outcomes tell them something went wrong, and the three do not look like they came from the same product.
