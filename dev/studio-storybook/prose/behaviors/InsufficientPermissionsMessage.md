---
source: stories/behaviors/InsufficientPermissionsMessage.stories.tsx
title: 'Laws & Behaviors/InsufficientPermissionsMessage'
blocks: 1
roundtrip: true
sourceHash: c5cfeceba2b27c81
---

<!-- @component -->

InsufficientPermissionsMessage is the one surface Studio reuses for every access denial. It currently tells the reader who they are without telling them what would unblock them.

|          |                                                                                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/InsufficientPermissionsMessage.tsx`, Studio-only (no design-system equivalent)                                                                                                    |
| Tier     | SERVICE. The reusable access-denial surface. It composes the access-denied icon, a localized "not authorized" explanation keyed by `context`, and a list-formatted rendering of the roles the current user _does_ hold |
| Audit    | 🔴 needs-work (`permission-legibility`). The message tells you that you are blocked and which roles you have, but never which permission is missing or how to get it                                                   |
| Patterns | `permission-legibility`                                                                                                                                                                                                |

It pairs the access-denied icon with a localized explanation keyed to the attempted action, and lists the roles the current user _does_ hold, so the denial at least reads consistently wherever it appears.

The Current stories render the real component across several `context` values (the copy is the shipped i18n). Recommended is a mocked panel, the fix does not exist in the component yet, that names the specific missing grant and gives a next step, per org contract §4.

> **Why it matters:** the shipped message is legible about the user and silent about the block. It names their roles but never the one grant that is actually missing, nor who could give it to them, so a blocked editor learns they are stuck without learning how to get unstuck. That gap is the permission-legibility finding, and what the Recommended panel closes.

The last story shows the message in context: the "Anna Karenina" document footer, where an editor opens Publish and meets this exact access-denied panel.
