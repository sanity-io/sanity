---
source: stories/beta/ScheduledDrafts.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: 71f50c31f2ac93b5
---

<!-- @component -->

Scheduling one document to publish itself is a small feature with a big trust requirement: the author is handing the publish button to a clock. These dialogs are where that hand-off is made honest.

|          |                                                                                                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/singleDocRelease/components/`, Studio-only (no design-system equivalent)                                                                                                                                                                                |
| Flag     | `scheduledDrafts.enabled`, default off (`DefaultPluginsWorkspaceOptions`, `core/config/types.ts`). When enabled, the plugin registers the scheduled-draft document actions, the perspective-navbar menu item, and the override banner                                             |
| Tier     | SERVICE. A document-lifecycle primitive composed from the releases machinery (a single-document `scheduled` release), not editing-core, not chrome                                                                                                                                |
| Audit    | 🔴 needs-work (`draft-publish-lifecycle`, `content-versioning`). The benchmark flagged Studio versioning surfaces as under-explained. A scheduled draft is a release wearing a simpler hat; these confirmation dialogs are the moments the mechanism is made legible to an author |
| Patterns | `draft-publish-lifecycle` · `content-versioning`                                                                                                                                                                                                                                  |

Spelling out exactly what happens and when means nobody is surprised by content going live while they sleep. Under the hood it is the full releases machinery, deliberately wearing a simpler hat.

A scheduled draft is a single-document `scheduled` release: the edited version document is parked in a release whose `intendedPublishAt` fires the publish. Both dialogs run the real hooks, `useScheduledDraftDocument` resolves the version document (and its live `Preview`) through the release-bundle seam, and `useScheduleDraftOperations` provides the confirm handlers, against a fixture preview store (a `partOfRelease` id-set override) and a seeded releases store. See `lib/scheduledDraftFixtures.ts`.

The confirm handlers are the real operations store running against the mock client; in a static story nothing invokes them (autodocs never clicks), so the dialogs render their upcoming-schedule state cleanly. The override banner and navbar menu item are gated surfaces too, the banner is storied under Document Banners/In a live pane → "Scheduled draft override", not duplicated here.

> **Why it matters:** a scheduled draft is not a separate primitive, it is a single-document scheduled release wearing a simpler hat. If you touch the releases machinery, you touch this too; the two stay in lockstep by design.
