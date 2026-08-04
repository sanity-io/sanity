---
source: stories/actions/Hotkeys.stories.tsx
title: 'Actions & Commands/Hotkeys'
blocks: 1
roundtrip: true
sourceHash: ccb03e850b490a44
---

<!-- @component -->

Hotkeys renders an array of key names as the row of keycaps a reader recognises. A keyboard shortcut only helps people who know it exists, which makes how Studio shows a shortcut part of whether the shortcut works at all.

|             |                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source      | `packages/sanity/src/core/components/Hotkeys.tsx`, Studio-only (no design-system equivalent)                                                                                                     |
| Tier        | CHROME. A display primitive rendering an array of key names as keycaps, with one behaviour on top of `@sanity/ui`'s Hotkeys: platform-aware key rewriting (`Alt` to `Option`, `Option` to `Alt`) |
| Audit       | ⚪ not-audited as a unit, but it is the building block for `keyboard-only`. The audit found "no global keyboard map beyond Cmd+K"; this is what such a map would render its keys with            |
| Determinism | rewriting reads `navigator.platform`, so output depends on the machine viewing the page. Default arg pins `makePlatformAware={false}` to keep the sweeps stable                                  |
| Patterns    | `keyboard-only`                                                                                                                                                                                  |

Hand it `["Ctrl", "Alt", "K"]` and it renders the row of keycaps a reader recognises, whether that row sits beside a menu item, inside a tooltip, or down a discoverable shortcut legend.

The one piece of intelligence on top is that it relabels keys for whoever is looking. The same input renders `Option` on Apple hardware and `Alt` everywhere else, so one legend reads correctly on both without the author writing it twice. The `PlatformAware` story turns that on deliberately and labels the dependency; every other story pins it off.

> **Why it matters:** with `makePlatformAware` on, the keys passed in are not the keys that render. Never snapshot or assert against platform-aware output, and never assume a reader sees the exact strings that were passed.

The last story shows it in context: a keyboard-shortcut legend for the "Anna Karenina" document, each action paired with its platform-aware keycaps.
