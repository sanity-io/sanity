---
source: stories/forms/PortableTextRenderers.stories.tsx
title: 'Post'
blocks: 1
roundtrip: true
sourceHash: b60c8cc02a94cdee
---

<!-- @component -->

Three of this subsystem’s failure states never announce themselves, and they fail in three different directions: one drops silently, one falls back silently, and one throws where old content can no longer be trusted to match a live schema.

|          |                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/PortableText/text/{Decorator,ListItem,Style,TextBlock,textStyles}.tsx`, `.../PortableText/_legacyDefaultParts/{Markers,CustomMarkers}.tsx`, `.../StringInput/StringInputPortableText/StringInputPortableText.tsx` |
| Tier     | CORE. The machinery that draws every mark, style and list item the block editor holds; there is no design-system equivalent, same as `Forms & Input/PortableText` itself                                                                                |
| Findings | 3, one silent drop, one silent fallback, one throw on missing schema                                                                                                                                                                                    |

The leaf layer under the whole-field page. `PortableTextInput.stories.tsx` shows the editor as a field; this page isolates what actually draws a mark on a span, a heading or blockquote on a block, a bullet or number on a list item, the tooltip content on a validation marker, and the one-line editor a plain string field swaps to when reviewing changes.

None of the seven components below are re-exported from the `sanity` package. `Decorator` is wired into `renderDecorator` in `Editor.tsx`; `Style` and `ListItem` are wired into `renderStyle`/`renderListItem` alongside `TextBlock` in `Compositor.tsx`. This page reaches all three the same way the whole-field page reaches `TextBlock`: by mounting the real editor (`FormBuilderHarness`) and letting `Compositor.tsx` call them, rather than importing and calling them directly. `DefaultMarkers`/`DefaultCustomMarkers` and `StringInputPortableText` are exercised directly further down, for reasons each of those stories states.

A schema-declared style with no `component` and a name outside the seven built-ins falls back to `Normal`’s look with no visual trace, distinguishable only via a `data-testid` in the DOM. The opposite failure, a style or list-item value that is not declared in the schema **at all**, does not fall back silently: `Style.tsx` and `ListItem.tsx` both `throw new Error('This should never happen')` on that lookup miss, an assumption schema migrations can break for old content, with no story below reproducing it because a thrown render is not one a static build can show.

> **Why it matters:** a mark on a span that matches neither a registered decorator nor a `markDefs` entry, stale content after a schema author removes a decorator, or a dangling reference to a deleted markDef, is silently dropped by the upstream editor before `Decorator` is ever called, rendering as indistinguishable plain text. Content can lose formatting with nothing in the interface saying so.
