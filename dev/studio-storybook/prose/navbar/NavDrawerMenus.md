---
source: stories/navbar/NavDrawerMenus.stories.tsx
title: 'Acme Content'
blocks: 1
roundtrip: true
sourceHash: 233628b10b49a085
---

<!-- @component -->

The appearance (color scheme) menu is a small, always-there preference control that lives inside the navbar drawer, owned by the shell rather than any document. It reads the current scheme from context and offers System, Light, and Dark, with a checkmark on the active choice.

|        |                                          |
| ------ | ---------------------------------------- |
| Source | `.../navbar/navDrawer/ApperanceMenu.tsx` |
| Tier   | CHROME                                   |

Its sibling, the locale menu (`LocaleMenu.tsx`), belongs here too but needs a studio configured with multiple locales to show anything; that is a harness follow-up (see the navbar decomposition map).
