---
source: stories/screens/ToolScreens.stories.tsx
title: 'Navbar & Shell/Screens/Tool Screens'
blocks: 4
roundtrip: true
sourceHash: 4c5e39551afdb061
---

<!-- @component -->

These are the two screens that replace the studio when there is no tool to render, either the one the URL asked for does not exist, or the config declares none at all.

|        |                                                                      |
| ------ | -------------------------------------------------------------------- |
| Source | `core/studio/screens/ToolNotFoundScreen.tsx` and `NoToolsScreen.tsx` |
| Tier   | CHROME                                                               |

They are storied together because they are the same screen twice, and reading them side by side is the only way to see the one thing that separates them.

> **Why it matters:** these two states have different audiences and the copy knows it. "Tool not found" is almost always an editor with a stale link, so it names the missing tool and stops - there is nothing an editor can do about a tool that is not configured. "No configured tools" is almost always a developer running a studio they are in the middle of setting up, so it says what to do and links to the documentation that says how. Same layout, same caution card, same icon; different reader, different ending.

Worth noticing what neither of them does: offer a way back. Unlike `NotFoundScreen`, there is no button here at all. For "no tools" that is right - there is nowhere to go. For "tool not found" it is more arguable, since the studio may well have other tools that work.

<!-- @story ToolNotFound -->

The URL named a tool the config does not declare. The tool name is rendered in a `<code>` element, which is the screen quietly telling you this is an identifier from a config file rather than a label someone chose - a small but real piece of orientation for whoever has to go and fix it.

<!-- @story NoTools -->

The config declares no tools at all. This is a setup state, not an error state, and the copy treats it as one: a sentence saying what is missing, a sentence saying what to do, and a link to the docs page that does it. Compare the ending of the story above.

<!-- @story SideBySide -->

Both at once. The layouts are identical to the pixel; only the ending differs. Storied because the similarity is the interesting part - somebody built one screen and used it twice, and then made exactly one decision about who each copy was for.
