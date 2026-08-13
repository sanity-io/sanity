---
title: Variants API reference
description: Document shapes and action payloads for variant definitions and variant documents.
beta: true
---

# Variants API reference

Everything you need to manage variants from code. For how querying works, see [Querying variants](./06-querying-variants.md). For the ID model and the `_system` field, see [How variants resolve](./05-how-variants-resolve.md).

## Client setup

All variant actions need the `X` API version and a write token:

```ts
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  apiVersion: 'X',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})
```

`@sanity/client` doesn't export dedicated typed helpers for these actions yet, so trigger them with `client.action()`.

## Variant definitions

### The document

Definitions are stored as system documents:

```ts
interface VariantDefinitionDocument {
  _id: `_.variants.${string}`
  _type: 'system.variant'
  name: string
  conditions: Record<string, string>
  priority: number
  metadata?: Record<string, unknown>
}
```

A real one looks like this:

```json
{
  "_id": "_.variants.Ab12cd34",
  "_type": "system.variant",
  "name": "Ab12cd34",
  "conditions": {"audience": "loyal"},
  "priority": 0,
  "metadata": {
    "title": "Loyal customers",
    "description": [
      {
        "_type": "block",
        "children": [{"_type": "span", "text": "Returning customers with an account."}]
      }
    ]
  }
}
```

Things worth knowing about that shape:

**The ID is generated, not chosen.** The suffix is an 8-character random string, so you get `_.variants.Ab12cd34`, not `_.variants.loyal-customers`. `name` holds the same suffix. IDs are case-sensitive.

**Definitions are addressed two ways.** The full document ID is `_.variants.<suffix>`, but actions and query parameters take the bare suffix (`Ab12cd34`). The API calls the bare form `variantId`.

**The title is metadata.** `metadata.title` is what editors see. It has no effect on matching and you can change it freely. `metadata.description` is Portable Text.

`conditions` **is an exact-match map.** A definition matches a request when every one of its conditions appears in that request with the same value. Key and value rules are in [Variant definitions](./03-variant-definitions.md).

`priority` **defaults to** `0` and only breaks ties between definitions that match with equal specificity. Higher wins.

### Create

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.create',
  variantId: 'Ab12cd34',
  conditions: {audience: 'loyal'},
  priority: 0,
  metadata: {title: 'Loyal customers'},
})
```

`variantId` is required, the rest are optional. The action creates `_.variants.Ab12cd34` with `_type: 'system.variant'` and `name: 'Ab12cd34'`.

It fails if a definition with that ID already exists, if the ID isn't a single path segment, or if any condition key or value breaks the rules. Feature access and definition count limits are checked server-side.

### Edit

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.edit',
  variantId: 'Ab12cd34',
  patch: {
    set: {
      'conditions': {audience: 'loyal', market: 'eu'},
      'priority': 10,
      'metadata.title': 'Loyal customers in the EU',
    },
  },
})
```

Patches are allowed only under `conditions`, `conditions.*`, `priority`, `metadata`, and `metadata.*`. Patches to `_id`, `_type`, `name`, or system timestamps are rejected.

To clear metadata:

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.edit',
  variantId: 'Ab12cd34',
  patch: {unset: ['metadata']},
})
```

Pass `ifRevisionId` for optimistic concurrency. The action fails if the current revision doesn't match.

Editing conditions changes which requests the variant matches immediately, for every document that has content for it. See the warning in [Variant definitions](./03-variant-definitions.md).

### Delete

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.delete',
  variantId: 'Ab12cd34',
})
```

Fails if the definition doesn't exist, or if `ifRevisionId` is supplied and doesn't match. It does not cascade to variant documents, and strong references from existing variant documents block it. You'll get an integrity error naming the conflict.

### Listing definitions

```groq
*[_type == "system.variant"] | order(priority desc, _createdAt asc) {
  "variantId": name,
  "title": metadata.title,
  conditions,
  priority
}
```

## Variant documents

Variant documents are addressed by coordinates, not IDs: `publishedId`, `variantId`, and `bundleId`. Scope IDs are opaque server-generated hashes, so an ID-based API would be unusable.

`bundleId` means the same thing everywhere: `undefined` or omitted is the variant of published, `'drafts'` is the variant of drafts, and a release name is the variant in that release.

### Create

From an explicit document body:

```ts
await client.action({
  actionType: 'sanity.action.document.variant.create',
  publishedId: 'product-1',
  variantId: 'Ab12cd34',
  bundleId: 'drafts',
  document: {
    _type: 'product',
    title: 'Welcome back',
  },
})
```

Or forked from an existing document:

```ts
await client.action({
  actionType: 'sanity.action.document.variant.create',
  publishedId: 'product-1',
  variantId: 'Ab12cd34',
  bundleId: 'drafts',
  baseId: 'drafts.product-1',
  ifBaseRevisionId: '<rev>',
})
```

`baseId` is the document whose fields get copied. `ifBaseRevisionId` is an optional guard that fails the action if the source has changed.

### Publish

```ts
await client.action({
  actionType: 'sanity.action.document.variant.publish',
  publishedId: 'product-1',
  variantId: 'Ab12cd34',
  bundleId: 'drafts',
})
```

`bundleId` is the **source** being published, `'drafts'` or a release name. The published variant is the target, so naming it as the source is rejected.

The source variant document's content is copied into the variant of published, creating it if absent and overwriting it if present, and the source is deleted. The base published document is never touched.

`ifPublishedVariantRevisionId` gives you an optimistic lock on the target, taken from the published variant sibling's revision and not from the base published document.

### Unpublish

```ts
// Hard unpublish: remove the published variant
await client.action({
  actionType: 'sanity.action.document.variant.unpublish',
  publishedId: 'product-1',
  variantId: 'Ab12cd34',
  bundleId: undefined,
})

// Soft unpublish: schedule removal with a release
await client.action({
  actionType: 'sanity.action.document.variant.unpublish',
  publishedId: 'product-1',
  variantId: 'Ab12cd34',
  bundleId: 'summer-campaign',
})
```

With `bundleId` omitted or `undefined`, the published variant is deleted and its content recreated as the variant draft. With a release name, the release-scoped variant is marked with `_system.delete: true` and the unpublish completes when the release publishes.

`'drafts'` is not a valid target. A drafts-scoped variant has nothing published to unpublish. `bundleId` is a required field rather than an optional one precisely so you have to choose the published variant deliberately.

### Delete

```ts
await client.action({
  actionType: 'sanity.action.document.variant.delete',
  publishedId: 'product-1',
  variantId: 'Ab12cd34',
  bundleId: 'drafts',
  purge: false,
})
```

Deletes only the addressed variant document. Other bundles' variant documents and the base pair are unaffected. `purge` also removes history from the transaction log and defaults to `false`.

### The definition reference on a variant document

You don't write this reference by hand. When you create a variant document, Content Lake sets it for you under `_system`:

```json
{
  "_id": "versions.Xy9kLm2Qp.product-1",
  "_system": {
    "variant": {"_ref": "_.variants.Ab12cd34"},
    "group": {"_ref": "product-1", "_weak": true},
    "bundleId": "drafts",
    "scopeId": "Xy9kLm2Qp"
  }
}
```

The `variant` reference is strong, which is what gives you the write-time existence check and the block on deletion. Because it's a reference and not a plain string, you can traverse it in GROQ:

```groq
*[_type == "product" && defined(_system.variant)]{
  _id,
  "variantTitle": _system.variant->metadata.title
}
```

### Finding a variant's documents

```ts
const documents = await client.fetch('*[sanity::partOfVariant($variantId)]', {
  variantId: 'Ab12cd34',
})
```

More GROQ helpers are in [Querying variants](./06-querying-variants.md).
