---
source: stories/overlays/Tab.stories.tsx
title: 'Overlays & Navigation/Tab'
blocks: 1
roundtrip: true
sourceHash: 9788db40207163b8
---

<!-- @component -->

Tabs come into the picture more often than you might think, and Studio has one button behind all of them, so a field-group tab, a Review changes panel, and the Tasks sidebar all read as the same control rather than three components that happen to look similar.

|            |                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source     | `packages/sanity/src/ui-components/tab/Tab.tsx`, the Studio shadow of `@sanity/ui` `Tab`                                                                                                                                              |
| Tier       | SERVICE. Fixes padding (`2`) and `muted`, narrowing the primitive to Studio’s tab look, and adds an `iconRight` slot the primitive lacks                                                                                              |
| Audit      | 🟢 holds (`module-tabs`, `alternative-views`). Tabbed switching between views of one region is competent in Studio; the layout-chapter defects the audit found sit elsewhere (`center-stage`, `collapsible-panels`, `movable-panels`) |
| Patterns   | `module-tabs` · `alternative-views`                                                                                                                                                                                                   |
| Call sites | field groups (`ObjectInput/fieldGroups/GroupTab.tsx`) · Review changes (`ChangesTabs`) · release filters (`ReleaseDocumentFilterTabs`) · Tasks sidebar (`TasksListTabs`)                                                              |

So if you are building any surface where one pane offers a handful of alternative views, this is the primitive you compose, and it already looks like the rest of Studio.

That consistency is the point of the shadow. It takes a subset of `@sanity/ui` `Tab` props (`aria-controls`, `focused`, `icon`, `id`, `label`, `selected`, `tone`) and pins padding to `2` and `muted` on, so you cannot accidentally ship a tab that is a little too tall or a little too loud. The added `iconRight` slot ([sanity-io/ui#2173](https://github.com/sanity-io/ui/pull/2173)) is what lets a tab double as the `More` overflow menu (see the icons story).

> **Why it matters:** padding and font size are deliberately _not_ configurable here. If you need a different size you are reaching for the wrong component, every tab in Studio is meant to read the same, and that uniformity is what the shadow exists to guarantee.

The page closes _in context_: a document pane header for the book _Anna Karenina_, its views, Editor, Preview, History, riding a `TabList` across the top of the pane and swapping the panel below without leaving the document.
