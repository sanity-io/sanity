---
title: Known limitations
description: What doesn't work yet during the variants beta, what is intentional, and what to do instead.
beta: true
---

# Known limitations

Variants are in beta. Read this before rolling them out to a team, because a few of these will affect how you plan the rollout rather than just how you write code.

## Not yet

**Only the** `X` **API version serves variant content.** No dated version does yet. Pinning to `X` means you're on a moving version, so behavior can change during the beta. Plan to move to a dated version at general availability.

**The config key is provisional.** `beta.variants.enabled` may be renamed before general availability.

**Access is per project.** Variant content is served only to projects on the feature flag. Contact your Sanity account team or support to have your project added.

**Scheduled publishing is disabled while a variant is selected.** Use releases to schedule variant content. See [Variants and releases](./07-variants-and-releases.md).

**The document group inventory is not optional.** Turning variants on also turns on the newer versions UI and removes the version chips above the document editor. You can't have one without the other during the beta.

## By design

**Variants are not localization.** Variants can carry per-market content, and `market` is a reasonable condition, but they don't solve translation. Field-level and document-level translation plugins keep working unchanged alongside variants. A first-party localization primitive is separate future work.

**Conditions are exact string matches only.** No wildcards, no ranges, no numeric comparison, no boolean logic beyond the subset rule. A condition value is a string because it has to survive a round trip through a URL. Model ranges as discrete buckets, `tier: premium` rather than `spend > 500`.

**Querying by ID takes one ID.** You cannot pass several variant IDs in one query. There is no ranking to perform when you name a variant directly. If you need matching across multiple dimensions, query by conditions instead.

**The** `raw` **perspective ignores variant conditions.** If you need every underlying document including all variant versions, query `raw` without a variant and filter on `_system` yourself.

**Deleting a definition does not cascade.** You have to remove a variant's documents before you can delete the definition. The Studio disables the action with a document count, and Content Lake blocks the write regardless.

**System documents cannot have variants.**
