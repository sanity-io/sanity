---
title: Variant documents
description: The alternative content itself. How to create, edit, publish, and unpublish variant documents, and how they interact with drafts, published, and releases.
beta: true
---

# Variant documents

A variant document is the alternative content of one document for one variant. Create a "Loyal customers" definition and nothing changes anywhere. Open a product page, pick that variant, and create content for it, and now that one page has loyal-customer content. Every other product page is untouched and keeps serving its base content to everyone.

That per-document opt-in is the core of the model. You only create variant content where the content actually differs.

## Selecting a variant

The document editor navbar has a **View as** row with two selectors, **Version** and **Variant**. Version is the perspective you already know: drafts, published, or a release. Variant defaults to **All users (Default)**, meaning no variant, and lists your definitions by title.

<!-- IMAGE: The "View as" row with both selectors open side by side, so it's obvious these are two independent axes rather than one list. The table below is accurate but abstract without it. -->

The two work together:

| Version   | Variant             | You're editing                              |
| --------- | ------------------- | ------------------------------------------- |
| Drafts    | All users (Default) | The base draft                              |
| Drafts    | Loyal customers     | The Loyal customers draft variant           |
| Published | Loyal customers     | The Loyal customers published variant       |
| A release | Loyal customers     | The Loyal customers variant in that release |

The selection is sticky. It stays active as you navigate between documents, so you can review a whole section of the site as a segment sees it.

## Creating variant content

There are two routes to the same result.

### From the document editor

If the document has no content for the selected variant, a banner tells you so, naming the version and the variant: "No Drafts variant document exists for Loyal customers." The document is read-only in this state.

<!-- IMAGE: The document editor showing the "No Drafts variant document exists for Loyal customers" banner with the "Create variant" button. Pair this with the no-banner case below so the difference between the two states is unmistakable. -->

Click **Create variant**. The new variant document starts as a copy of what you're looking at, the base draft or the base published content depending on your version. The editor switches to the new document and you can edit.

This works from the default version and from inside a release, where the new variant document is created in that release.

### From the document group inventory

**Manage versions** opens the document group inventory, which lists everything in the document: base draft, base published, any release versions, and any variants. It has its own **Create variant** entry point.

Pick a definition, then pick where the content should live: **As a draft**, or **Into a release** followed by the release. Bundles that already have content for that definition aren't offered again; instead they appear under **Or view existing variants**, which jumps you straight to them.

## Editing

Once a variant document exists, editing is ordinary editing. Changes save continuously to the variant displayed. The base document and every other variant are unaffected.

## Publishing

**Publish** on a variant draft publishes it as the published variant, which is the content the API serves for matching conditions. The base published document is not touched.

- Publishing again replaces the published variant's content.
- Variant documents in a release are not published individually. They go live with the rest of the release.

## Unpublishing

**Unpublish** removes the published variant, so matching requests fall back to base content.

- On a published variant, this is immediate. The published variant is deleted and its content is recreated as the variant draft, so nothing is lost.
- On a release variant, it's scheduled. The variant is marked to be unpublished when the release publishes, and you can revert that until then.

The base published document is never affected.

## Discarding changes

**Discard changes** deletes the variant draft. If the variant is published, you revert to the published variant's content. If it was never published, the document leaves the variant entirely and you can add it again later.

## Duplicating

**Duplicate** on a variant document creates a new regular document, a base draft, holding the variant's content. It does not create another variant document.

// TODO: Review this, duplicating a variant should create a variant document.

## Reviewing changes and history

**Review changes** compares your variant draft against the **published variant**, not against the base published document.

**History** shows the edit and publish timeline of the variant document itself. Restoring an older revision restores it into the variant you're viewing.

## What they are, technically

Variant documents are version documents. They occupy the same slot in a document group that a release version does:

```text
versions.<scopeId>.<publishedId>
```

`publishedId` is the base published document's ID, which is what keeps a variant document in the same document group as the base. `scopeId` is an opaque hash generated by the server when the variant document is created.

You cannot compute or predict a scope ID. It isn't derived from the variant name in any way you can reverse. This is the single most important constraint for anyone writing code against variants: you discover a variant document's ID by looking it up, never by constructing it. Everything in the [API reference](./10-variants-api-reference.md) that looks indirect, addressing documents by coordinates instead of by ID, follows from that.

For one base document and one variant, several sibling variant documents can exist at once:

| Sibling                   | ID shape                         | `_system.bundleId` |
| ------------------------- | -------------------------------- | ------------------ |
| Variant of published      | `versions.<hashA>.<publishedId>` | unset              |
| Variant of drafts         | `versions.<hashB>.<publishedId>` | `'drafts'`         |
| Variant in a release      | `versions.<hashC>.<publishedId>` | the release ID     |
| Variant in another bundle | `versions.<hashD>.<publishedId>` | that bundle's ID   |

Each has its own hash. The base published and draft documents are separate again, and variants never touch them.

## Interaction with drafts and releases

Variants compose with drafts and releases, with one rule that differs from what you might expect: variant documents are never nested inside another version ids.

**A draft variant is one document**, `versions.<hash>.<publishedId>` with `_system.bundleId` set to `'drafts'`. There is no `drafts.versions.<hash>.<id>`.

**A release variant is also one document**, `versions.<hash>.<publishedId>` with `_system.bundleId` set to the release. Again, no nesting.

System documents cannot have variants.

Publishing a release publishes its variant content into the published variants, alongside the rest of the release. Details, including how archive and unarchive treat variant content, are in [Variants and releases](./07-variants-and-releases.md).

## For developers

Variant documents are created, published, unpublished, and deleted through actions that address them by coordinates (`publishedId`, `variantId`, `bundleId`) rather than by ID. The payloads are in the [Variants API reference](./10-variants-api-reference.md). The full `_system` shape is in [How variants resolve](./05-how-variants-resolve.md).
