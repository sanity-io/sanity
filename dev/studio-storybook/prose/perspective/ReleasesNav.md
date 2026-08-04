---
source: stories/perspective/ReleasesNav.stories.tsx
title: 'Navbar & Shell/Perspective/Releases Nav'
blocks: 7
roundtrip: true
sourceHash: 6859307483013f63
---

<!-- @component -->

ReleasesNav is the pill in the studio navbar that names which view of the content a person is currently editing, and opens the menu that changes it. Everything an editor sees below it, every document, every list, every preview, is filtered through whatever this says.

|          |                                                               |
| -------- | ------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/perspective/navbar/ReleasesNav.tsx` |
| Tier     | SERVICE                                                       |
| Patterns | `visible-system-state`                                        |

Three parts in a rounded container: an optional link to the Releases tool, the current perspective label, and a chevron button opening the perspective menu.

**One rendering decision:** the whole nav is wrapped in `AnimatedTextWidth`, which animates the container width when the label changes. Switching perspective visibly moves the surrounding navbar. That is deliberate, the motion is the confirmation that the switch took, but it means anything laid out next to this control has to tolerate a neighbour that changes size.

**Harness note:** these stories mount the real component over a real `createRouter` with a `releases` tool registered, because `ReleasesToolLink` encodes tool-scoped router state and throws on a router that has no scoped route for that tool name. The perspective itself is seeded per story, see `lib/perspectiveHarness.tsx`.

> **Why it matters:** this is the highest-stakes small control in the studio, because it silently changes the meaning of everything else on screen. A document that looks published is published in this perspective; switch to a release and the same document shows different field values with no other visual change. So the control is designed to be permanently readable rather than merely available: the label is always visible, never collapsed to an icon, and it names the perspective in full rather than abbreviating it.

<!-- @story Drafts -->

The default, and where a studio sits almost all of the time: drafts layered over published content, which is what an editor means by "the current state of things". Click the chevron to open the menu.

<!-- @story Published -->

Published-only. Note what this does to the studio underneath: the perspective stack is empty, so drafts are not layered at all and every document shows exactly what a visitor to the live site would get. This is the read-only preview of reality, and the label is the only thing on screen saying so.

<!-- @story InARelease -->

A release selected. The label is no longer a static word but a link - clicking the release name navigates to that release in the Releases tool, via an `IntentLink` rather than a hard-coded URL. That is the difference that matters: drafts and published are states, a release is a _thing_, and the label reflects that by becoming navigable.

The title also runs through `ReleaseTitle`, so a long release name truncates at 50 characters with the full name on hover, and the pill has a hard `maxWidth: 180px` on top of that.

<!-- @story NoBorder -->

The borderless variant, for chrome that already provides a boundary. The control keeps its radius and padding, so it still reads as a single unit rather than three loose buttons - the border was never what was holding it together.

<!-- @story ReleasesDisabled -->

A workspace with releases turned off in config. The control does not disappear - drafts and published are still perspectives and still need switching between - but `areReleasesEnabled` goes false and the menu offers only the two system perspectives. Open it and compare with the Drafts story: same control, a much shorter menu.

<!-- @story NoReleasesYet -->

Releases are available but none exist. This is the state every new studio is in, and it is a different state from "releases disabled" even though the closed pill looks identical. The distinction only appears when the menu is open, which is a fair argument that the closed control is under-informative here - though the counter-argument, that a navbar is not the place to advertise an empty feature, is also reasonable.
