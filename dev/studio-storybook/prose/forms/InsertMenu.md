---
source: stories/forms/InsertMenu.stories.tsx
title: 'Forms & Input/InsertMenu'
blocks: 10
roundtrip: true
sourceHash: 4dc484ca8be28843
---

<!-- @component -->

The automatic filter default is the piece worth studying: rather than always showing a search field or never showing one, the insert menu counts its own options and shows the filter only past five.

|          |                                                  |
| -------- | ------------------------------------------------ |
| Source   | `packages/sanity/src/insert-menu/InsertMenu.tsx` |
| Tier     | SERVICE                                          |
| Patterns | `progressive-disclosure`                         |

The "+" menu in Portable Text and array inputs, the list of things you can insert at this point in the content. Entirely prop-driven: schema types in, a selection out, plus a handful of display options. No context, no store, no schema resolution.

> **Why it matters:** that threshold is the design. Below it, scanning is faster than typing and a search box is an obstacle between an author and three visible choices; above it, scanning starts to cost more than typing. A menu that adapts to its own content is doing work that would otherwise land on every schema author as a configuration decision they have no basis for making.

The labels are passed in as a prop, not resolved from i18n inside the component. That is because this menu is vendored, the same source is built into the Sanity app frontend, which has a different translation layer. Handing the strings in keeps one component honest in two applications.

<!-- @story Default -->

Three types, under the auto-filter threshold, so no search field appears. Everything is visible; a filter would be a control standing between you and three items you can already read.

<!-- @story AutoFilter -->

The same component with nine types. Past five, `filter: 'auto'` turns the search field on by itself. Type "co" and it narrows to Code block alone - the match is a substring test on the title, so "Callout" does not qualify.

Compare with the story above: nothing was configured differently. The menu counted.

<!-- @story FilterForced -->

`filter: true` overrides the count. A schema author who knows their three types have long, similar names might want this - but the default exists because most of them do not, and would be guessing.

<!-- @story FilterForcedOff -->

The inverse: nine types and no search. Storied because it is the configuration most likely to be regretted - the list is scrollable and nothing tells the reader how far it goes.

<!-- @story NoResults -->

Type something that matches nothing - "zzz" - and the menu says so rather than showing an empty box. An empty menu and a menu with no matches look identical without this, and the difference is whether you should clear the filter or give up.

<!-- @story Grouped -->

Groups render as a row of filter chips above the list, with an "All" chip prepended by the component rather than declared by the schema author.

They are **filters, not sections**: picking Media narrows the list rather than scrolling to a heading. That is the right choice for a menu that already has a search field - two ways to narrow, one way to read - where sections would give you two ways to read and one way to narrow.

<!-- @story GridView -->

With more than one view configured, a view toggle appears in the header and the first entry wins by default. Grid is for menus where the icon carries the meaning - a set of layout blocks, say - and list is for menus where the name does.

The grid view also accepts `previewImageUrl` per type, so a schema author can show a thumbnail of what each block looks like instead of a glyph. That is the version worth reaching for when the types are visual.

<!-- @story NoIcons -->

`showIcons: false` strips the glyphs. Compare with the default: with icons the list is scannable by shape; without them it is a column of words that all have to be read. The default is on, and this is the story that justifies it.

<!-- @story Everything -->

Every option on at once, which is also the point at which to ask whether they should be. Three narrowing mechanisms - search, group chips, and the view toggle - stacked above nine items is more chrome than content.

Storied as a caution rather than a recommendation. The options exist for large, genuinely heterogeneous menus; on a normal one, the auto-filter default and nothing else is the better answer.
