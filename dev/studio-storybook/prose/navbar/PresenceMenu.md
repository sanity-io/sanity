---
source: stories/navbar/PresenceMenu.stories.tsx
title: 'Acme Content'
blocks: 3
roundtrip: true
sourceHash: 6d809b7bc3861a92
---

<!-- @component -->

PresenceMenu is the navbar's global presence indicator: the stacked avatars of everyone currently in the studio, plus a menu listing them with where they are. It is the shell surfacing collaboration at a glance, distinct from the per-document presence shown inside the editor.

|        |                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/components/navbar/presence/PresenceMenu.tsx`                         |
| Tier   | CHROME. It frames the collaborative session; the live editing presence is a SERVICE surface elsewhere |

> **Why it matters:** two things must be seeded for this story to be honest. `useGlobalPresence()` gets a fixture room of three collaborators, one per `status` (`editing`, `online`, `inactive`). And `useCanInviteProjectMembers()` gets a mock project store, because it fetches `/projects/:id/grants` only when the menu opens, so an unseeded story renders perfectly and then throws the instant someone clicks it. That is exactly what this chapter shipped once, and the reason the storybook now has an interaction gate alongside the render gate.

<!-- @story EmptyRoom -->

The resting state of a single-author studio: no avatars in the bar, and a menu that says so rather than showing an empty list. Worth storying because it is the state a solo author sees all day.

<!-- @story CannotInvite -->

The same menu for a user whose role lacks the `sanity.project.members` invite grant: the roster still lists everyone, but the "Invite members" footer is gone. This is the permission seam the menu actually models, and it is invisible until you open the menu.
