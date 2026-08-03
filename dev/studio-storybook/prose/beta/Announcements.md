---
source: stories/beta/Announcements.stories.tsx
title: 'Content Releases are out of beta'
blocks: 1
roundtrip: true
sourceHash: a782f1d251ec2bc2
---

<!-- @component -->

Something you build only helps editors if it reaches them, and this is how Studio does that without sending an email: a floating teaser, a full reader, and a Help-menu entry that surface a shipped feature to the people already at work.

|          |                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/studio/studioAnnouncements/*`, Studio-only (no design-system equivalent); the in-app "What's new" surface                                                                                 |
| Flag     | `announcements.enabled` (`StudioAnnouncementsProvider`, `@internal @hidden`), off by default; the real Studio also gates on a fetched `productAnnouncement` feed                                                    |
| Tier     | CHROME. A notification/attention layer painted over the studio shell. It fetches a feed and renders three self-contained pieces (floating card, dialog, help-menu entry); nothing here touches document content     |
| Audit    | ⚪ not-audited. The pattern-library pass exercised the authoring surfaces, not this promotional chrome. Its relevant law is `interruption-cost`: a what's-new prompt must be dismissible and never block the editor |
| Patterns | `whats-new`                                                                                                                                                                                                         |

Rather than hoping editors read a changelog, the announcements surface meets them where they work, and because it is chrome painted over the shell, it has to earn that attention without ever getting between the editor and their document.

The three pieces are prop-driven and render offline. `StudioAnnouncementsCard` is the bottom-left floating teaser; `StudioAnnouncementsDialog` is the full reader (one entry per unseen announcement, Portable-Text body via the shared upsell serializer, sticky date header); `StudioAnnouncementsMenuItem` is the Help-menu re-entry point. The provider that fetches the feed and tracks "seen" state is not mounted, fixtures stand in for its output.

> **Why it matters:** this surface lives or dies by whether it can be dismissed. A what's-new prompt must always be closeable and must never block editing. The card's bleed close button and the dialog's click-outside both honor that; if you extend this surface, keep the escape hatch.
