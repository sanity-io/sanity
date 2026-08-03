---
source: stories/navbar/NavDrawerMenus.stories.tsx
title: 'Acme Content'
blocks: 1
roundtrip: true
sourceHash: 4e0d977d665333c1
---

<!-- @component -->

A preference menu that lives inside the navbar drawer is the kind of small, always-there control the shell owns rather than any document. The appearance (color scheme) menu reads the current scheme from context and offers System, Light, and Dark, with a checkmark on the active choice.

|        |                                          |
| ------ | ---------------------------------------- |
| Source | `.../navbar/navDrawer/ApperanceMenu.tsx` |
| Tier   | CHROME                                   |

Its sibling, the locale menu (`LocaleMenu.tsx`), belongs here too but needs a studio configured with multiple locales to show anything; that is a harness follow-up (see the navbar decomposition map).
