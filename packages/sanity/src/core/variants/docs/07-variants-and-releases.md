---
title: Variants and releases
description: Scheduling variant content, how release publish maps variant versions, and how archive and unarchive treat variants.
beta: true
---

# Variants and releases

Personalized content usually ships alongside everything else. A spring campaign has new base copy and new loyal-customer copy, and both should go live at the same moment. Variants compose with releases so that works.

## Adding variant content to a release

Select both: the release in the **Version** selector, and the variant in the **Variant** selector. Then create the variant document as usual with **Create variant**.

You can also do it from the document group inventory: **Manage versions**, then **Create variant**, then **Into a release** and pick the release.

The new variant document is created inside that release. The release now carries the variant's changes alongside its base changes, and the release detail page counts it as part of the release.

A release-scoped variant is one document, `versions.<hash>.<publishedId>` with `_system.bundleId` set to the release ID and `_system.release` referencing the release document. Variants don't nest inside releases as a separate layer.

## Publishing

Variant documents in a release are not published individually.

When the release publishes, each of its documents goes to its own target:

| Source document                         | Publish target                   |
| --------------------------------------- | -------------------------------- |
| `versions.summer.product-1`             | `product-1`                      |
| `versions.hash(loyal,summer).product-1` | `versions.hash(loyal).product-1` |

Base release content publishes into the base published document. Variant release content publishes into the **variant of published**, not into the base. A release carrying only variant changes leaves your base published documents untouched.

<!-- IMAGE: Diagram of the two publish targets, base release version arrowing into the base published document and the release variant arrowing into the variant of published, with the base document visibly untouched by the second arrow. The table states this correctly but the "variant content never lands on the base document" point deserves visual emphasis. -->

If a publish target already exists it is overwritten, the same as releases work today.

## Scheduled unpublish

Unpublishing a release-scoped variant is scheduled rather than immediate. The variant is marked with `_system.delete: true`, the same marker base release versions use, and the unpublish completes when the release publishes. You can revert it until then.

This is how you retire personalized content on a schedule: add the variant to a release, mark it for unpublish, and when the release goes live the published variant is removed and matching requests fall back to base content.

## Archive and unarchive

A release action applies to both plain release documents and variant documents scoped to that release.

Archiving the `summer` release archives:

- `versions.summer.*`
- `versions.hash(*,summer).*`

It does not touch:

- `versions.hash(*).*`, variants of published
- `versions.hash(*,drafts).*`, variants of drafts

Unarchiving restores the same release-scoped documents, base and variant alike.

The rule underneath: a release action applies to documents whose bundle _is_ that release. Variants of published and variants of drafts belong to no release, so release actions leave them alone. Your live personalized content is not affected by archiving a release.

## Querying release variants

Query a release perspective with a variant and you get the release's variant content where it exists:

```ts
const data = await client.fetch(
  `*[_type == "product"]{title, price}`,
  {},
  {variant: {audience: 'loyal'}, perspective: ['summer']},
)
```

With the client set to the `summer` perspective, the candidate chain per document is:

1. `versions.hash(loyal,summer).product-1`, the loyal variant in this release
2. `versions.hash(loyal).product-1`, the currently published loyal variant
3. `versions.summer.product-1`, the release's base content
4. `product-1`, base published

Position 2 above position 3 is worth noting when reviewing a release. A published variant outranks the release's base content, so previewing a release as a segment shows you that segment's currently live content for any document the release didn't give variant content to. That's what will actually be served after publish, which is what you want when reviewing.

To see everything a release contains, base and variant:

```groq
*[sanity::partOfRelease("summer")]{
  _id,
  _type,
  "isVariant": defined(_system.variant),
  "variantTitle": _system.variant->metadata.title
}
```

## Scheduling a single variant document

Scheduled publishing is disabled while a variant is selected. The Studio tells you that scheduling is not yet available for variants.

Use releases to schedule variant content instead. See [Known limitations](./09-known-limitations.md).
