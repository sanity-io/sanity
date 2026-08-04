---
source: stories/envisioned/AmbientPresence.stories.tsx
title: 'Envisioned/Ambient Presence'
blocks: 1
roundtrip: true
sourceHash: 6db2ba7f11b36be2
---

<!-- @component -->

Presence that lives in a panel is presence consulted after deciding to worry, which is to say, after the collision. Ambient presence inverts the order: the form itself wears the humans.

|          |                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anchor   | `Lists & Data/UserAvatar` (Presence roster, the overlapped-avatar stack this layer composes from) and `Collaboration/Comments`, the panel presence currently hides behind                                                                                                                                                                                                                                                                                            |
| Evidence | audit `collaborative-presence` (ch14: show who else is here, where they’re working, what has activity, ambiently, before opening a panel; add-comment is hover-only and badges show totals, not presence); researcher’s brief §3, presence is one of the sixteen convergent failures; §4 names the reason Studio can win it: presence needs realtime, and Studio is the only product in the field whose foundation was built for the thing the whole field failed at |
| Patterns | `collaborative-presence`                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Each field row carries the real `UserAvatar` of whoever is working it right now, moving as they move; the document header carries the roster. And the payoff moment, the one the whole layer is priced against, is the collision warning: focus a field a colleague is mid-edit in, and the field says so before your first keystroke, naming the person, at the exact moment and place the information is worth something. No panel was opened; nobody asked in Slack.

> **Why it matters:** the colleagues here are simulated on a timer precisely so the ambient layer can be watched keeping itself true with no interaction at all. Click into whichever field Grace currently occupies and watch the warning arrive pre-keystroke; on the real realtime substrate this is the same wiring with the timer replaced by the presence stream Studio already ships.
