---
source: stories/screens/RedirectingScreen.stories.tsx
title: 'Navbar & Shell/Screens/Redirecting'
blocks: 4
roundtrip: true
sourceHash: 630963f38dfd370f
---

<!-- @component -->

RedirectingScreen is shown for the moment between deciding to send someone somewhere and getting them there.

|        |                                                                 |
| ------ | --------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/screens/RedirectingScreen.tsx` |
| Tier   | CHROME                                                          |

A primary-toned card, a double-chevron, and a line of text. Its whole job is to occupy a gap.

> **Why it matters:** it is toned primary, not caution like its neighbours in this family, and that is the design. Every other full-screen state in this family means something went wrong; this one means something is going right and is not finished yet. If it were caution-toned an editor would read a normal redirect as a fault, which is how "the studio flashed an error at me" reports get filed against a working system.

It is also the only screen here that takes a message from its caller rather than owning its own copy, because the reason for a redirect is knowledge the redirecting code has and the screen does not.

<!-- @story Default -->

With no `reason` passed, it falls back to "Redirecting…" - true, uninformative, and the right default. A caller with nothing specific to say should not be forced to invent something.

<!-- @story WithReason -->

The form real callers use. The value of naming the destination is not reassurance during the redirect - it is far too brief for that - it is that if the redirect stalls, the frozen screen says where it was trying to go.

<!-- @story LongReason -->

The text is rendered as a heading in a `Container width={0}` with no truncation, so it wraps and the card grows. That is the correct behaviour for a message whose length the component cannot control. The same string in a fixed-height chip would be cut off with no tooltip.
