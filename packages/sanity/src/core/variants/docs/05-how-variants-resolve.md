---
title: How variants resolve
description: Document IDs, the _system field, and the order the API overlays variant content on top of base content.
beta: true
---

# How variants resolve

Read this if you write code that touches document IDs, checks whether a document is a draft, filters query results, or keys a cache. Variants add a document shape that older assumptions get wrong.

## The document group

A base document and all its variants share one document group, identified by the base published ID. That's what makes existing grouping logic keep working: the last segment of a variant document's ID is always the base published ID.

For a product page with one variant, the group can hold N documents:

```text
product-1                            base published
drafts.product-1                     base draft
versions.hashA.product-1             variant of published
versions.hashB.product-1             variant of drafts
versions.hashC.product-1             variant in the "summer" release
```

`sanity::versionOf("product-1")` matches all of them.

<!-- IMAGE: The document group drawn as a tree, base published at the root with the base draft and the three variant documents hanging off it, each labelled with its ID. Makes the "don't parse IDs" argument land harder than the code block does, because the hashes are visibly meaningless. -->

## Scope IDs are opaque

The middle segment of a variant document's ID is a server-generated hash. It is derived from the variant and the bundle, but it is not reversible and not reconstructable on the client.

Two consequences you have to design around:

**Never build a variant document ID.** There is no client-side function that gives you `versions.<hash>.<id>` from a variant name. Discover IDs by querying, or address documents by coordinates (`publishedId`, `variantId`, `bundleId`) as the actions do.

**Never treat the middle segment as a release name.** For release versions it is the release ID. For variants it is a hash, even when the variant belongs to a release. Code that parses a version ID and looks the result up as a release must tolerate a value that matches no release, rather than throwing or rendering the hash to a user. When you need the release, read it from `_system.release` instead.

## The `_system` field

Every variant document (and in future all documents) carries its own metadata in `_system`. Read a document's role from there rather than inferring it from the ID shape.

| Field      | Meaning                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------- |
| `variant`  | Strong reference to the variant definition, `_.variants.*`                                   |
| `group`    | Weak reference to the base published ID                                                      |
| `bundleId` | `'drafts'`, a release ID, another bundle ID, or unset for the variant of published           |
| `scopeId`  | The opaque hash from the document's own ID                                                   |
| `release`  | Weak reference to the release document, for release-scoped variants                          |
| `draft`    | Weak reference to the ID the variant's draft occupies, present only on variants of published |
| `delete`   | Soft-unpublish marker, set when a release-scoped variant is scheduled for unpublish          |

```json
{
  "_id": "versions.Xy9kLm2Qp.product-1",
  "_type": "product",
  "_system": {
    "variant": {"_ref": "_.variants.Ab12cd34"},
    "group": {"_ref": "product-1", "_weak": true},
    "bundleId": "drafts",
    "scopeId": "Xy9kLm2Qp"
  }
}
```

### Why you now need to check `_system`

Before variants, a document's role was legible from its ID. `product-1` was published, `drafts.product-1` was a draft, `versions.summer.product-1` was in the summer release. Parsing the ID was enough.

Variant documents break that. `versions.Xy9kLm2Qp.product-1` is a draft, but nothing in the ID says so. Read `_system.bundleId` instead, and treat an unset value as the variant of published.

If you have code that switches on ID shape to decide draft versus published versus release, that's the code to revisit. Route on `_system` and it stays correct as the ID model evolves.

## `_id` and `_originalId`

When a query returns variant content, the base document's ID is preserved:

- `_id` is the base document ID, `product-1`.
- `_originalId` is the document that actually supplied the content, `versions.Xy9kLm2Qp.product-1`.

This is the same contract drafts and releases already follow, and it's deliberate. Your frontend's links, routes, and cache keys keep working without variant-specific handling. Nothing downstream needs to know a variant was served.

Read `_originalId` when you need to know _which_ version answered, for debugging, for a preview badge, or for correlating a result with the variant that produced it.

## Overlay order

Variants overlay on top of the perspective you're already querying. Perspective is matched first, then the variant is applied within it. For each document, the API walks a candidate list in order and serves the first one that exists.

**Published perspective**, variant `loyal`:

1. `versions.hash(loyal).product-1`
2. `product-1`

**Drafts perspective**, variant `loyal`:

1. `versions.hash(loyal,drafts).product-1`
2. `versions.hash(loyal).product-1`
3. `drafts.product-1`
4. `product-1`

**Release perspective** (`summer`), variant `loyal`:

1. `versions.hash(loyal,summer).product-1`
2. `versions.hash(loyal).product-1`
3. `versions.summer.product-1`
4. `product-1`

## The overlay is per document

Resolution runs per document, not per query. Within one result set, some documents can be served from a variant and others from base content, and with multiple conditions in play, different documents can be served from _different_ variants.

```ts
const products = await client.fetch(
  `*[_type == "product"]{_id, _originalId, title}`,
  {},
  {variant: {audience: 'loyal', market: 'eu'}},
)
```

If three products have EU-loyal content, forty have loyal content, and the rest have neither, you get all three groups in one response, each with the most appropriate content available for it. `_originalId` is how you tell them apart.

Avoid code that assumes a single variant applied to the whole response. How the winner is chosen per document is covered in [Querying variants](./06-querying-variants.md).
