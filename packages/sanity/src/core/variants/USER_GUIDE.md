# Document Variants — User Guide

This guide explains what document variants are and how to work with them in Sanity Studio: creating variants, adding content to them, editing, publishing, and how variants interact with drafts and releases.

It is written for content editors and studio developers. For the internal architecture, see [`EDITING.md`](./EDITING.md).

> Variants are a beta feature, enabled per workspace with `beta.variants.enabled` in the studio configuration.

## What are variants?

Variants let a single document have **alternative versions of its content for different conditions** — for example a French translation, a version for loyal customers, or a version for a specific region.

Two ideas to keep apart:

- A **variant** (or variant definition) describes _when_ alternative content applies. It has a title and one or more conditions as key/value pairs — for example `locale: fr` or `audience: loyal-customers`. Variants are defined once and apply across your whole dataset.
- A **variant document** is the alternative content of _one_ document for _one_ variant. A document only has content for a variant after you explicitly add it (see below). Documents without a variant document simply don't vary under that condition.

Your **base document** — the regular draft and published version you've always worked with — is never changed by any of this. Variant content lives alongside it, and everything you do to a variant (edit, publish, unpublish, discard) affects only that variant.

When your frontend requests content, it can ask the API for a specific set of conditions (for example `locale: fr`), and documents that have a matching published variant are returned with the variant's content in place of the base content. Documents without a matching variant return their base content as usual. If several variants match, the variant's **priority** decides which one wins.

## Managing variants

Variants are managed in the **Variants tool** (the `/variants` route in the studio navbar).

- **Create a variant**: give it a title and at least one complete condition (key and value). The condition inputs suggest keys and values already used by other variants, so teams converge on consistent naming — but any key/value is allowed.
- **Edit a variant**: change its title, description, conditions, or priority from the variant's detail page.
- **Priority**: when multiple variants match a request, the highest priority wins. The default is `0`.
- **Documents table**: each variant's detail page lists the documents that have content for it, grouped per document.
- **Delete a variant**: available from the overview row menu and the detail page.

## Working with variant content

### Selecting a variant

In the document editor, pick a variant from the **variant picker** in the navbar (next to the perspective picker). The variant selection works _together_ with the perspective:

| Perspective | Variant selected | You are looking at                     |
| ----------- | ---------------- | -------------------------------------- |
| Drafts      | None             | The base draft                         |
| Drafts      | e.g. "French"    | The French **draft** variant           |
| Published   | e.g. "French"    | The French **published** variant       |
| A release   | e.g. "French"    | The French variant **in that release** |

The selection is sticky: it stays active while you navigate between documents, so you can review or edit a whole set of documents "as French".

While the studio is figuring out whether the current document has content for the selected variant, the pane shows a loading state rather than the base document. This is deliberate — you'll never accidentally type into the base draft while a variant is selected.

### Adding a document to a variant

If the document has no content for the selected variant yet, the editor shows a banner: _this document is not part of the variant_. The document is read-only in this state.

Click **Add to variant** to create the variant document. Its content starts as a copy of what you're currently looking at (the base draft or published content, depending on your perspective). After a moment the editor switches to the new variant document and you can start editing.

This works from the default perspective and from a release perspective — in a release, the new variant document is created inside that release.

### Editing

Once a variant document exists, editing works exactly like editing any document: changes are saved continuously to the variant draft. The base document and every other variant are unaffected.

If the selected variant name doesn't match any existing variant definition (for example after a definition was deleted, or a typo in a shared URL), the editor shows an error banner and stays read-only instead of quietly falling back to the base document.

### Publishing

**Publish** on a variant draft publishes it as the **published variant** — the content the API serves for matching conditions. The base published document is not touched.

- If the variant has been published before, the new publish replaces the published variant's content.
- Variant documents in a **release** are not published individually: they're disabled with _"This version is published as part of its release"_ and go live when the release is published, like any other release content.
- The "already published" state and its timestamp reflect the **variant's** publish state, not the base document's.

### Unpublishing

**Unpublish** removes the published variant, so the API stops serving variant content for those conditions and matching requests fall back to the base content.

- On a **published variant**: unpublishing removes it immediately and recreates its content as the variant draft, so nothing is lost.
- On a **release variant**: unpublishing is scheduled — the variant is marked to be unpublished when the release publishes. Until then you can revert the scheduled unpublish.
- A variant draft that has never been published has nothing to unpublish, and the action says so.

The base published document is never affected by unpublishing a variant.

### Discarding changes

**Discard changes** on a variant draft deletes the draft:

- If the variant is published, you revert to the published variant's content.
- If it has never been published, the document simply leaves the variant again (you can re-add it later).

### Duplicating

**Duplicate** on a variant document creates a new regular document (a base draft) with the variant's content. It does not create a new variant document.

## Reviewing changes and history

- **Review changes** on a variant document compares your variant draft against the **published variant** — not against the base published document. If the variant has never been published there is nothing to compare against yet.
- **History** shows the edit and publish timeline of the variant document itself. Restoring an older revision restores it into the variant you're viewing.

## Variants and releases

Variants compose with releases:

- Add variant content to a release by selecting both the release (perspective picker) and the variant (variant picker). The release then carries the variant's changes.
- Publishing the release publishes its variant content into the published variants, together with the rest of the release.
- A scheduled unpublish (see above) also completes when the release is published.
