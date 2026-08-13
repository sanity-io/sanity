---
title: Variant definitions
description: The definitions that describe when alternative content applies, and how to manage them in the Studio.
beta: true
---

# Variant definitions

A variant definition answers one question: under what conditions does alternative content apply? It carries a title, a set of conditions as key/value pairs, and a priority. **It carries no content of its own.**

Definitions are dataset-wide. Create "Loyal customers" once and any document can have loyal-customer content.

## Why you need one first

Nothing else works without a definition. A variant document is permanently tied to its definition, so Content Lake refuses to create variant content pointing at a definition that doesn't exist. Queries need definitions too, since matching conditions against requests is the only way the API knows which variant a request wants.

The practical order is always: define the condition, then add content to documents.

## Condition rules

Conditions are the key/value pairs that decide when a definition applies, such as `audience: loyal`. Keys and values are validated on write, in the Studio and in the API. The rules are strict because conditions travel in URLs as `key:value` pairs.

**Keys** must be lowercase, start with a letter, and then use letters, digits, underscores, or hyphens, up to 64 characters. Keys starting with `_` or `$` are reserved and rejected. Keys cannot contain a colon.

**Values** must be non-empty and cannot contain a colon.

Valid: `audience: loyal`, `market: eu`, `experiment: hero-a`, `account_tier: premium`.

Rejected: `Audience: loyal` (uppercase key), `2nd-visit: true` (starts with a digit), `_internal: x` (reserved prefix), `time: 10:30` (colon in value).

A definition with empty conditions is accepted but inert. It never matches anything.

Matching is exact and literal. There are no wildcards, ranges, or numeric comparisons, so model ranges as discrete buckets: `tier: premium` rather than `spend > 500`.

## In the Studio

Definitions live in the **Variant definitions** tool at `/variants`.

### Creating one

Click **New variant definition**. The dialog asks for:

- **Title**, required. This is what editors pick from in the document editor. "Loyal customers", not `loyal`.
- **Description**, optional. Explain who the variant targets so the next editor doesn't guess.
- **Priority**, defaults to `0`.
- **Conditions**, at least one complete key/value pair.

<!-- IMAGE: The "Create variant definition" dialog filled in for "Loyal customers", with the condition key autocomplete open and showing suggestions drawn from existing definitions. The autocomplete-as-consistency-aid behavior described below is much clearer shown than told. -->

The condition inputs autocomplete from keys and values other definitions already use, and value suggestions are scoped to the key you picked. This is a consistency aid, not a constraint. You can still type a new key or value, which is how you introduce a new dimension.

### The overview

The table lists every definition with its conditions and a live count of documents that have content for it. You can filter and search in this list.

### The detail page

Each definition gets a page with its conditions, priority, description, creation date, total document count, and a count of documents with unpublished changes.

Below that, a table of every document that has content for this variant, with an **Appears in** column showing which bundles each one lives in (published, drafts, or a named release). Filter tabs let you narrow to one bundle. Validation status shows per document, so you can see whether a variant's content is publishable before you ship it.

<!-- IMAGE: A variant definition detail page with several documents in the table, showing the "Appears in" bundle chips and at least one document carrying a validation warning. "Appears in" is hard to picture from prose alone. -->

### Editing a definition

**Edit definition** opens the same dialog as create. Changing the title or description is cosmetic.

Changing **conditions** is not. Definitions are dataset-wide and resolution is evaluated per request, so an edit takes effect immediately for every document that has content for this variant. Widening a condition can start serving personalized content to visitors it was never written for, and narrowing one can silently stop serving it to the audience it was written for. Treat a conditions edit on a live definition as a content change, not a settings change.

### Deleting

Delete is available from the overview row menu and the detail page, but it's blocked while the variant has documents.

The Studio disables the action and tells you how many documents are in the way, and Content Lake refuses the write regardless. Deleting a definition never cascades to variant documents. Remove the documents first.

## For developers

Definitions are stored as system documents of type `system.variant` with IDs under `_.variants.*`. Two properties of that shape leak into everyday use:

**The ID is generated, not chosen.** The suffix is an 8-character random string, so you get `_.variants.Ab12cd34`, not `_.variants.loyal-customers`. This matters when [querying by variant ID](./06-querying-variants.md).

**The title is metadata.** It's stored under `metadata.title`, has no effect on matching, and you can change it freely.

The full document shape, the create/edit/delete action payloads, and the GROQ for listing definitions are in the [Variants API reference](./10-variants-api-reference.md).

Creating variant content is covered in [Variant documents](./04-variant-documents.md).
