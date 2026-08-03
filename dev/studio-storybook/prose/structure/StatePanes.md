---
source: stories/structure/StatePanes.stories.tsx
title: 'Document Pane/State Panes'
blocks: 10
roundtrip: true
sourceHash: e9b72eb6f184507b
---

<!-- @component -->

A pane chain resolves each column from the one before it, asynchronously and fallibly. These are the three answers for when that resolution does not land: one for still working on it, one for that went wrong, one for I do not know what that is.

|          |                                                                |
| -------- | -------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/{loading,error,unknown}/` |
| Tier     | SERVICE                                                        |
| Patterns | `error-messages` · `skeleton-first-loading`                    |

They are siblings by position rather than by code: any of them can appear in any column of the pane layout, standing in for whatever should have been there.

> **Why it matters:** every column needs an answer for "the pane is not here yet" and "the pane will never be here", and crucially those answers have to occupy a pane-shaped hole, keeping the column, its width, its header and its place in the chain. Substituting a bare error message would collapse the layout and take the panes to the left of it with it. These three exist so that a failure in column three does not disturb columns one and two.

All three are the pane shell first and content second. The interesting part of each is the chrome rather than the message.

They need the pane layout context and nothing else. The layout hook throws when that context is missing, so a pane cannot be mounted bare, but the full structure resolver, router and tool provider are all unnecessary here.

<!-- @story Loading -->

The default loading pane, showing the message `getWaitMessages` produces for an empty path. It fades in over 200ms rather than appearing instantly - `data-mounted` is set on the next animation frame, and the CSS transitions opacity from 0.

That fade is doing real work. Pane resolution is usually fast enough that a loading state would flash: appear and vanish inside a couple of frames, which reads as a flicker rather than as information. Fading in means a resolution that completes quickly never shows anything at all, while a slow one arrives gently.

<!-- @story LoadingWithTitle -->

When the resolver already knows what it is loading, the title replaces the generic message. Worth noticing that `title` wins over `message` entirely - a pane that knows it is fetching "Blog posts" says so instead of saying "Loading…", because the specific answer is strictly better and the component does not try to show both.

<!-- @story LoadingWithMessage -->

`message` accepts a string, or a function, or a function returning an **observable** - which is the form the default `getWaitMessages` uses. The observable exists so a long wait can escalate its own copy over time ("Loading…" then something more apologetic), without the pane holding a timer. Here it is the simple string form.

<!-- @story Errored -->

The critical-toned pane the structure tool drops in when a pane cannot be built. It is deliberately a shell: it supplies the tone, the header and the padding, and takes the actual explanation as `children`. The caller knows what failed; the pane only knows how a failure should look.

The tone is on the `Pane`, not on a card inside it, so the whole column reads as failed - the correct scope when it is the column that is broken rather than something in it.

<!-- @story ErrorWithCustomTitle -->

Both `title` and `tone` are overridable, so the same shell serves a hard failure and a softer one. A caution-toned pane titled "Unavailable" says something different from a critical one titled "Error" - the first invites you to try later, the second does not.

<!-- @story UnknownType -->

A structure node whose `type` the resolver has no handler for. The type name is interpolated into the message, which is the difference between an error a developer can act on and one they have to reproduce first.

<!-- @story UnknownMissingType -->

The other branch: a structure node with no `type` property. Different message, and correctly so - "I do not handle `customDashboard`" and "you did not tell me what this is" are different mistakes with different fixes. Most components would collapse these into one string; this one does not.

Note the guard is `isRecord(pane) && pane.type`, so a node that is not even an object lands here too rather than throwing.

<!-- @story SideBySide -->

The point of the family, shown as the structure tool would show it: three columns side by side, each in a different state, none of them disturbing the others. This is what "the failure occupies a pane-shaped hole" buys - a broken third column while the first two keep working.

<!-- @story InContext -->

The shape of a real call site. `ErrorPane` is the only one of the three that is a genuine shell, and this is what gets handed to it in practice: a heading, the underlying message, and whatever recovery the caller can offer. The pane contributes the tone, the header, the scroll behaviour and the column.
