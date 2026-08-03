---
source: stories/envisioned/GeometricIdentity.stories.tsx
title: 'Envisioned/Geometric Identity'
blocks: 1
roundtrip: true
sourceHash: 95b4160f4908b046
---

<!-- @component -->

Initials plus hue is a two-channel identity, and both channels are weak: initials collide, and hue is the one channel that does not survive grayscale, colour-blindness, or print.

|          |                                                                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Lists & Data/UserAvatar`, the Colors and Initials stories (identity = initials + deterministic per-user hue) and its Current pair, which already proved the presence dot collapses in grayscale                            |
| Evidence | audit `similarity` (ch13: status/identity carried by colour-only signals of identical shape) and `collaborative-presence`; researcher’s brief §3, presence surfaces are only as trustworthy as the identity atom under them |
| Patterns | `similarity` · `collaborative-presence`                                                                                                                                                                                     |

Anna Lindqvist, Aki Larsen, Amara Levy and André Laurent are all "AL," and real orgs hit collisions like that fast. The identity atom deserves a third channel: a deterministic geometric sigil, one of eight marks derived from the user id the same way the hue already is, docked on the avatar corner the presence dot does not use. Same-initials users become dot-AL, square-AL, ring-AL, chevron-AL: distinguishable at a glance, nameable out loud, and stable forever because the derivation is a hash, not an assignment.

The real `UserAvatar` renders untouched underneath, this is an additive channel, not a replacement, exactly like the anchor's dot-plus-label recommendation. The derivation playground lets you type any id and watch the identity derive live, determinism you can falsify by typing the same id twice.

> **Why it matters:** strip hue from the collider roster and current renders four identical avatars; the sigil row stays four distinct people. Cover the labels and try to tell four people all initialed AL apart, colour and grayscale, current and sigiled.
