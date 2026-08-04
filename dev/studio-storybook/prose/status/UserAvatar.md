---
source: stories/status/UserAvatar.stories.tsx
title: 'Lists & Data/UserAvatar'
blocks: 1
roundtrip: true
sourceHash: 756e881183738927
---

<!-- @component -->

Every face in Studio is this one component, and it does more than paint a circle: hand it a resolved user and it works out their identity, assigns them a deterministic colour, and can hang a presence dot in the corner.

|          |                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/components/userAvatar/UserAvatar.tsx`, Studio-only (no DS equivalent)                                                                                                                                                                                                                                                                                 |
| Tier     | SERVICE. Resolves three things around the `@sanity/ui` `Avatar` primitive: the user (image URL or generated initials), a deterministic per-user colour from the `UserColorManager`, and an optional presence-status dot. Given a bare user id it also loads the user (`useUser`) and shows a sized skeleton while pending                                                       |
| Audit    | 🟢 holds. As an identity-rendering primitive it is solid: legible initials fallback, per-user colour, image-load error recovery, a loading skeleton sized to match. Caveat (`similarity`): its presence-status dot (`online`/`editing`/`inactive`) is signalled by colour alone, the same `collaborative-presence` colour-only trait the audit flagged across presence surfaces |
| Patterns | `collaborative-presence` · `similarity`                                                                                                                                                                                                                                                                                                                                         |

Hand it a resolved `User` and it works out the identity (their photo, or initials generated from the name when there is no photo), assigns a deterministic colour so the same person is always the same hue across the app, and can hang a presence-status dot in the corner. Hand it a bare user id instead and it loads the user itself and holds a sized skeleton while it waits.

Passing a `User` object renders immediately; passing a `string` id routes through `useUser` (needs the full store, not exercised here, every story supplies a resolved user). `size` accepts `0-3` (legacy `small`/`medium`/`large` are mapped). `withTooltip` wraps it in the Studio tooltip showing the display name. It is the atom that composes into presence stacks, the navbar presence menu, task assignees, and release activity.

> **Why it matters:** the avatar itself holds up, but its presence dot signals online, editing, or inactive by colour alone, the same `collaborative-presence` trait the audit flagged across presence surfaces. In grayscale the three states collapse to one dot in one corner and "who is actively editing" is lost. The Current/Recommended pair below pairs the dot with a label.

The last story shows it in context: the presence roster in the editor header of Anna Karenina, co-edited live.
