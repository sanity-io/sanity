---
source: stories/forms/CrossDatasetClient.stories.tsx
title: 'The launch announcement'
blocks: 2
roundtrip: true
sourceHash: 3a7e13b650671e17
---

<!-- @component -->

Two of this storybook's other mock clients model a client as a single object with a fixed identity, a correct simplification for a single-dataset story. It is silently wrong the moment a client crosses a dataset boundary, which is exactly what a cross-dataset reference does in production.

|        |                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Source | `lib/crossDatasetClient.ts`, exercised by a harness page, not a component page                                             |
| Tier   | SERVICE. Prints what the client actually returns, because the thing it fixes is invisible in any story that merely uses it |

**The problem it solves.** Both of the storybook's other mock clients model a client as a single thing with a fixed identity. Their `withConfig()` returns the same object:

```ts
withConfig: () => mockClient // upstream test mock
client.withConfig = () => client // lib/mockContentLake.ts
```

`StudioCrossDatasetReferenceInput` does exactly this:

```ts
const crossDatasetClient = client.withConfig({dataset: schemaType.dataset, …}).clone()
```

and everything downstream reads `config()` off the result. Against the old mocks that chain fails twice: `.clone()` does not exist at all, and even if it did, `config()` would keep reporting the original dataset. The failure mode is the dangerous kind, not a crash, but a reference resolving against the wrong dataset while appearing to work.

**Why this page prints values rather than asserting them in prose.** A docblock claiming "the derived client reports the other dataset" is exactly the sort of unverifiable wiring claim that ledger #61 was about. The story runs the real chain and shows the result, so the claim is checkable by looking.

**What is still not storied, and why.** The `crossDatasetReference` input remains uncovered. The client is no longer the blocker; the preview layer is. A cross-dataset reference renders its target through `to[].preview` for a type that is not in this studio's schema by definition, and the mock preview store resolves previews against the local schema. Recorded as ledger #57, whose diagnosis has now been wrong twice and is stated as a boundary rather than a cause.

> **Why it matters:** a dataset with no fixture gets an empty lake rather than the nearest one. Falling back to another dataset's documents would let a misconfigured story pass while asserting something untrue, which is the specific failure this whole file exists to prevent.

<!-- @story Probes_ -->

Five derivations of one client, each printing its own `config()` and the titles its `fetch` returned. The two datasets carry **disjoint** documents on purpose, so a client resolving the wrong lake shows the wrong titles rather than passing quietly.

Rows one and two are the basic claim: `withConfig` produces a genuinely different client. Row three is the exact chain the studio runs, `.withConfig(…).clone()`, and it is the one the old mocks could not survive. Row four re-derives back to the home dataset, which checks that the config merge is not one-way. Row five is the empty-lake guard.
