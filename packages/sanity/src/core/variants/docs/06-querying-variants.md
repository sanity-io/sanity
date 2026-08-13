---
title: Querying variants
description: How your frontend asks for personalized content, by conditions or by variant ID, and how the API picks which variant wins.
beta: true
---

# Querying variants

Your frontend knows things about the current visitor: which segment they're in, which market they're browsing from, which test arm they were assigned. It doesn't know, and shouldn't need to know, which variant definitions exist or which documents have variant content.

So you send what you know about the visitor, and the API works out the rest.

```ts
const data = await client.fetch(
  `*[_type == "page" && slug.current == $slug][0]`,
  {slug},
  {variant: {audience: 'loyal', market: 'eu'}},
)
```

That's the whole mental model. You describe the visitor with conditions. The API finds the definitions whose conditions the visitor satisfies, picks the best match per document, and overlays that content. Documents without matching variant content return base content.

## Setup

Variants are served only by the `X` version of the Content Lake API, and `@sanity/client` 7.26.0 or later is required:

```ts
import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  apiVersion: 'X',
  useCdn: false,
})
```

The `variant` option takes either a conditions object or a single variant ID string. Both forms are covered below.

## Querying by conditions

This is the default approach and the one to reach for.

```ts
const data = await client.fetch(
  `*[_type == "product"]{title, price}`,
  {},
  {variant: {audience: 'loyal'}},
)
```

Conditions serialize to repeated query parameters, sorted:

```text
?variantCondition=audience:loyal&variantCondition=market:eu
```

You can also set a variant once on the client, which is useful when a whole request lifecycle serves one visitor:

```ts
const client = createClient({
  projectId,
  dataset,
  apiVersion: 'X',
  useCdn: false,
  variant: {audience: 'loyal'},
})
```

The `variant` option on `fetch` takes precedence over the one on the client config.

### How a winner is picked

For each document, the API works through these steps.

**1. Find the candidates.** A definition matches when its conditions are a **subset** of the conditions you sent. Every condition on the definition must be present in the request with the same value. Definitions with empty conditions never match.

Requesting `audience: loyal` and `market: eu`:

| Definition          | Conditions                                        | Matches | Why                         |
| ------------------- | ------------------------------------------------- | ------- | --------------------------- |
| Loyal customers     | `audience: loyal`                                 | Yes     | Subset of the request       |
| Loyal in EU         | `audience: loyal`, `market: eu`                   | Yes     | Subset of the request       |
| US shoppers         | `market: us`                                      | No      | Value mismatch on `market`  |
| Loyal EU newsletter | `audience: loyal`, `market: eu`, `campaign: news` | No      | `campaign` wasn't requested |

**2. Rank them.** In order: most conditions matched wins, then higher `priority`, then earlier `_createdAt`, then `_id` alphabetically as a deterministic final tiebreaker.

Specificity comes first. Priority only separates definitions that matched with the same number of conditions.

**3. Serve the highest-ranked definition that has content for this document.**

### Fallback walks down the ranking

The best-ranked definition doesn't necessarily win. The best-ranked definition _that actually has a variant document for that document_ wins.

Take the request `audience: loyal` and `market: eu`, and a product page where an editor created "Loyal customers" content but never created "Loyal in EU" content:

| Definition      | Rank               | Has content for this page | Result     |
| --------------- | ------------------ | ------------------------- | ---------- |
| Loyal in EU     | 1 (two conditions) | No                        | Skipped    |
| Loyal customers | 2 (one condition)  | Yes                       | **Served** |

You get the loyal-customer content, not base content, even though the more specific variant lost. Only when nothing in the ranking has content for a document does that document fall back to base content.

This is the behavior you want, and it's worth understanding why. It means a broad variant covers everything a narrow one doesn't. Create loyal-customer content on 500 pages and EU-loyal content on the three pages where EU actually differs, and an EU loyal visitor gets EU content on those three and loyal content on the other 497. Without this, you'd have to duplicate all 500 pages into the narrower variant to avoid visitors dropping to generic content.

It also means resolution differs per document within a single response. See [How variants resolve](./05-how-variants-resolve.md).

## Querying by variant ID

When you want exactly one specific variant and no matching logic, address it by ID:

```ts
const data = await client.fetch(`*[_type == "product"]{title, price}`, {}, {variant: 'Ab12cd34'})
```

which serializes to:

```text
?variant=Ab12cd34
```

Three differences from querying by conditions:

**One ID only.** You cannot pass several. There's no ranking to perform, so there's nothing to rank.

**That variant, or base content.** Documents with content for `Ab12cd34` return it. Every other document returns base content. No other variant is considered, however well its conditions might have fit.

**The ID is the generated suffix, not the title.** Variant definition IDs are generated 8-character strings, so `_.variants.Ab12cd34` is addressed as `Ab12cd34`.

Find an ID by opening the definition in the Studio, where it's the last segment of the detail page URL, or by querying for it:

```groq
*[_type == "system.variant"]{
  "variantId": name,
  "title": metadata.title,
  conditions,
  priority
}
```

Because IDs are generated rather than readable, hardcoding one into frontend code ties that code to a definition someone can delete. Querying by conditions avoids the coupling. Use IDs for previewing a specific variant, for internal tooling, and for QA, and use conditions in production paths.

## GROQ functions

`sanity::partOfVariant(name)` returns true for documents belonging to a variant, across all its bundles. `name` is the bare variant ID.

```groq
// Every document with content for this variant, in any bundle
*[sanity::partOfVariant("Ab12cd34")]

// How many documents does this variant cover
count(array::unique(*[sanity::partOfVariant("Ab12cd34")]._system.group._ref))
```

It matches the variant of published, the variant of drafts, and variants in releases. It does not match base documents or base release versions.

`sanity::versionOf(id)` works on the document group and is unchanged. It matches base published, base draft, base release versions, and every variant document in the group.

`sanity::partOfRelease(name)` is unchanged for ordinary release documents, and also matches variant documents scoped to that release. It does not match the variant of published or the variant of drafts, which belong to no release.

## Calling the API directly

The same options map to query-string parameters on a `/vX/` URL:

```text
https://{projectId}.api.sanity.io/vX/data/query/{dataset}?query=...
```

By conditions, repeating the parameter:

```text
&variantCondition=audience:loyal&variantCondition=market:eu
```

By ID:

```text
&variant=Ab12cd34
```

The colon separator is why condition keys and values cannot contain colons. See [Variant definitions](./03-variant-definitions.md).

## Perspectives

Variant conditions layer on top of whichever perspective you're querying, and the perspective is matched first. A published-perspective query with conditions returns published variant content. A drafts-perspective query returns draft variant content where it exists, falling back through published variant content before base content. Full candidate chains are in [How variants resolve](./05-how-variants-resolve.md).

The `raw` perspective ignores variant conditions. If you need the underlying documents including every variant version, query `raw` without a variant and filter on `_system` yourself.
