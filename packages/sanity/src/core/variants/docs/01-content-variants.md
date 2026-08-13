---
title: Content variants
description: Give a single document alternative content for different audiences, markets, and test cohorts, without duplicating the document.
beta: true
---

# Content variants

Your homepage hero says one thing to everyone. Marketing wants it to say something else to loyal customers, something else again in the EU, and a third thing for the cohort in next week's A/B test. Today that means three duplicate documents, three URLs, three sets of edits to keep in sync, and a frontend that picks between them.

Variants remove the duplication. One document, one URL, one place editors work. Alternative content lives alongside the original and the API decides which version to serve based on conditions your frontend sends with the query.

> Variants are a beta feature, enabled per workspace and per project. See [Enable variants](./02-enable-variants.md).

<!-- IMAGE: Diagram. One base document at the centre with three variant documents branching off it, and an incoming request labelled `audience: loyal` selecting one of them. This is the core mental model for the whole feature and deserves the most polish of any image in this set. -->

## Two things to keep apart

Almost every question about variants comes back to this distinction.

A **variant definition** describes _when_ alternative content applies. It has a title and one or more conditions as key/value pairs, such as `audience: loyal` or `market: eu`. You define it once and it applies across your whole dataset.

A **variant document** is the alternative content of _one_ document for _one_ variant. A document has content for a variant only after someone explicitly creates it. Documents without a variant document don't vary under that condition, they keep serving their normal content.

Your base document, the draft and published pair you already work with, is never touched by any of this. Editing, publishing, or discarding a variant affects only that variant.

## Use cases

| You want to                                          | Set up                                                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Show different hero copy to returning customers      | One definition, `audience: loyal`, variant documents on the pages you want to change                                                   |
| Run a three-arm headline test                        | Three definitions, `experiment: hero-a`, `hero-b`, `hero-c`                                                                            |
| Adjust pricing language per market                   | One definition per market, `market: eu`, `market: us`                                                                                  |
| Tailor a campaign landing page to its traffic source | One definition per source, `campaign: spring-newsletter`                                                                               |
| Combine segments                                     | Definitions with two conditions, `audience: loyal` plus `market: eu`, which outranks the single-condition ones when both are requested |

## What it enables

**Personalization without duplication.** One product page serves different copy to different segments. Editors see one document in the Studio, with a picker to switch between "All users" and each variant.

**A/B tests on real content.** Each arm is a variant definition. Your frontend sends the arm the visitor was assigned to, and the API returns that arm's content for any document that has it. Documents without variant content fall back to the base version, so you only create variants for the pages the test touches.

**Regional and brand differences that aren't translations.** Different pricing copy, different legal text, different featured products per market. See the note on localization below.

**Variant content in releases.** A variant document can live inside a release and go live when the release publishes, so personalized content ships on the same schedule as everything else.

**Graceful degradation.** Because resolution happens per document, a broad variant covers what a narrow one doesn't. If you have loyal-customer content on 500 pages and EU-loyal content on three, an EU loyal visitor gets the EU content on those three and the loyal content on the rest.

<!-- IMAGE: Diagram of fallback walking down the ranking. Show a request carrying `audience: loyal` + `market: eu`, the narrow "Loyal in EU" definition ranked first but with no content for this document, and the broader "Loyal customers" definition serving instead. This is the least intuitive behavior in the feature and the hardest to hold in your head from the table in Querying variants. -->

### Variants are not localization yet

Variants can carry per-market content, and `market` is a reasonable condition. But variants don't solve translation as a use case. Field-level and document-level translation plugins keep working unchanged alongside variants. A first-party localization primitive is separate future work.

## Requirements

Variants need a recent Studio, a recent client, and the variants API version. The floors are:

| Package          | Minimum |
| ---------------- | ------- |
| `sanity`         | 6.9.0   |
| `@sanity/client` | 7.26.0  |

Set your client's `apiVersion` to `X`. That is the literal letter X, not a placeholder for a number: during the beta, variant content is served only by that API version, and no dated version serves it.

Frontends that render variant content also need current loader and visual editing packages. Full list, install commands, and the config flag are in [Enable variants](./02-enable-variants.md).

## Where to go next

**If you work with content**, read these in order:

- **[Variant definitions](./03-variant-definitions.md)** covers creating and managing the definitions that describe your conditions.
- **[Variant documents](./04-variant-documents.md)** covers creating and editing the alternative content itself, and how it interacts with drafts, published, and releases.
- **[Variants and releases](./07-variants-and-releases.md)** covers scheduling variant content.
- **[Known limitations](./09-known-limitations.md)** lists what doesn't work yet during the beta. Read this before rolling variants out to a team.

**If you build the Studio or the frontend**, start here:

- **[Enable variants](./02-enable-variants.md)** covers package versions, joining the beta, and the workspace config flag.
- **[Querying variants](./06-querying-variants.md)** covers how your frontend asks for personalized content, and how the API picks a winner.
- **[How variants resolve](./05-how-variants-resolve.md)** is the reference for document IDs, the `_system` field, and overlay order.
- **[Presentation and visual editing](./08-presentation-and-visual-editing.md)** covers previewing a variant in context.
- **[Variants API reference](./10-variants-api-reference.md)** collects the document shapes and action payloads in one place.
