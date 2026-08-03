---
source: stories/releases/CreateReleaseMenuItem.stories.tsx
title: 'Releases/Create Release Menu Item'
blocks: 5
roundtrip: true
sourceHash: 8a2261b28b51469f
---

<!-- @component -->

This component never hides itself. Both of its failure modes render the row, greyed, with an explanation on hover, rather than removing it, and that restraint is why it exists as a component rather than a plain menu row.

|        |                                                                          |
| ------ | ------------------------------------------------------------------------ |
| Source | `packages/sanity/src/core/releases/components/CreateReleaseMenuItem.tsx` |
| Tier   | SERVICE                                                                  |

The "New release" row that appears in the perspective menu and the releases tool. One menu item, three states, and the two that are not the happy path are the reason it is a component at all: it renders enabled, or disabled because you are at the plan limit, or disabled because you lack permission, and in both disabled cases it attaches a tooltip saying which.

The permission check is a live request in a real studio (`checkWithPermissionGuard` against the release-operations store). The harness seeds a `ReleasePermissions` value into the resource cache, which is where `useReleasePermissions` looks before it builds a real store, the same seam `useReleasesStore` uses. The limit comes from `workspace.releases.limit`, so it is set per story through the config.

> **Why it matters:** an action that vanishes teaches an editor nothing, and leaves them unable to tell an interface that lacks the feature from one that has it and is withholding it. The tooltip converts a dead end into an answerable question, ask an administrator, or upgrade the plan. The two reasons are also checked in a fixed order, limit before permission, so an editor at both never sees a permissions message they cannot act on.

<!-- @story Enabled -->

Three active releases against no configured limit. The row is live and clicking it opens the create dialog.

<!-- @story LimitReached -->

A workspace capped at three releases, with three already active. The row is disabled and its tooltip names the number - hover it. This is the state a plan boundary produces. The count in the message comes from the workspace config rather than a hard-coded string, so it stays true across plans.

<!-- @story NoPermission -->

The same row for an editor whose role cannot create releases. Visually identical to the limit case, deliberately - both are "you cannot do this right now" - and distinguished only by the tooltip, because the remedy is different: one is a conversation with an administrator, the other with whoever owns the plan.

<!-- @story InContext -->

Where it sits: last in the menu that lists the releases you can switch into, below the ones that already exist. The placement is the argument - having looked through what is there and not found it, the next thing offered is making it.
