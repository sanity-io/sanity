---
source: stories/presentation/PreviewTarget.stories.tsx
title: 'Overlays & Navigation/Preview Target'
blocks: 3
roundtrip: true
sourceHash: 161ce35e49e09b96
---

<!-- @component -->

This page is the load target for Presentation's iframe stories. Rather than stand up a second server, it serves itself: same origin, no extra process, ships with the static build for free.

|        |                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------ |
| Source | `dev/studio-storybook/stories/presentation/PreviewTarget.stories.tsx` (harness, not Studio code) |
| Tier   | harness                                                                                          |

`Preview` opens a `@sanity/comlink` channel to whatever loads in its iframe, so storying it needs a front end. A real Next.js app would work and would become a second process that has to be running for these stories to pass, in CI and in the portable tarball. Storybook already serves every story at `iframe.html?id=…` on the same origin, so the target is just another story: no extra server, and it ships with the static build for free.

> **Why it matters:** the handshake is real. `Preview` creates the controller channel and this page creates the matching node, using the actual protocol, so the Presentation machine genuinely leaves its loading state. But visual editing itself is not: a production front end wraps content in stega-encoded values and click-to-edit overlays, and this page renders a plain document that only answers the handshake. The connection is real; the editing loop is not, and the Presentation stories say so rather than implying otherwise.

<!-- @story Default -->

Opened directly, outside an iframe, the status reads **not embedded** - there is no parent to hand shake with, and the node is not started. That is the correct behaviour rather than a failure, and it is what you are looking at right now.

To see it connected, open the Presentation stories, which load this page in the Preview iframe.

<!-- @story AlternateRoute -->

The same target reporting a different path, so a Presentation story can demonstrate navigation between two routes without either of them being a real page.
