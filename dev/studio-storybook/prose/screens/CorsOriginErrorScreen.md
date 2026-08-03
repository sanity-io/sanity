---
source: stories/screens/CorsOriginErrorScreen.stories.tsx
title: 'Navbar & Shell/Screens/CORS Origin Error'
blocks: 6
roundtrip: true
sourceHash: ee40215b95222921
---

<!-- @component -->

This is the screen an editor or developer hits when the studio can reach the Content Lake but the Content Lake will not talk back, because this origin is not on the project's CORS allowlist.

|        |                                                                        |
| ------ | ---------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/workspaces/CorsOriginErrorScreen.tsx` |
| Tier   | SERVICE                                                                |

It is the most carefully built screen in this family, and the only one that is really a small decision tree: three distinct outcomes, each with a deep link into Manage that pre-fills the form that resolves it.

> **Why it matters:** a CORS failure is a configuration problem in a different application, and the naive version of this screen is a sentence saying so, technically complete and practically useless, because the reader now has to find the project, find the API tab, and retype an origin they are looking at. Instead this screen constructs the exact Manage URL with the origin and the credentials flag already filled in. It carries the state across the boundary rather than describing it. That is the difference between an error message and a fix.

**The branch worth studying** is "allowed but no credentials". The origin is on the allowlist, so a naive check would call it fine, but the entry does not permit credentialed requests and the studio needs those for login, drafts and mutations. Manage cannot edit a CORS entry, only add and remove, so the screen says remove it and re-add, and pre-fills the re-add. It is a correct fix built around a limitation in another product.

**And a piece of restraint:** `canRegisterStudioForOrigin` re-implements Manage's own host validator so the "Register Studio" option is hidden for origins the registration form would reject, `localhost`, bare IPs. The screen declines to offer help it knows will fail. The comment in the source asks for it to be kept in sync with Manage, which is an honest admission that the duplication is the price of not sending people to a form that silently does nothing.

<!-- @story NotConnected -->

A deployed studio on a registerable origin, in a project the first workspace also points at. Both routes are offered side by side, and the copy separates them by intent rather than by mechanism: **Register Studio** for a real deploy that should sync its schema and manifest (and so enable schema-aware search and Content Agent), **Add CORS origin** for one-off origins that only need to talk to the API. Hover the buttons and read the URLs - the origin and credential flags are already in them.

<!-- @story CorsOnly -->

The same screen on `localhost`. "Register Studio" is gone, and its absence is a decision rather than a layout accident: `canRegisterStudioForOrigin` runs Manage's host rules locally, sees that the registration form would reject this origin, and hides the option. The grid collapses to one column so the remaining card does not read as half of something.

<!-- @story ForeignProject -->

The CORS error names a project that the first configured workspace does not point at, so the studio cannot assume the person looking at this has any authority over it. Registering a studio against a project you do not own is not a thing to offer, so only the CORS route is shown. The origin is registerable here - it is ownership, not the URL, that removes the option.

<!-- @story AllowedWithoutCredentials -->

The subtle one, and the reason this screen is a decision tree rather than a message. The origin is on the allowlist; a check that only asked "is this origin allowed?" would report success while the studio stayed broken. The heading changes to "Enable credentials for this Studio", the copy names the specific capabilities that need them (login, drafts, mutations), and because Manage cannot edit an entry the instruction is to remove and re-add - with a link that pre-fills the re-add, credentials included.

<!-- @story Staging -->

Identical layout, with every Manage link pointed at `sanity.work` instead of `sanity.io`. Storied because the whole value of this screen is that its links land somewhere useful, and a staging studio linking to production Manage would send a developer to a project page that does not exist. Hover a button to check.
