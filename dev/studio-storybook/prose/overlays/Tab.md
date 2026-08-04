---
source: stories/overlays/Tab.stories.tsx
title: 'Overlays & Navigation/Tab'
blocks: 1
roundtrip: true
sourceHash: 66d1f92ff9abb13e
---

<!-- @component -->

Tab is the one button behind every tabbed view in Studio: a field-group tab, a Review changes panel, and the Tasks sidebar all read as the same control rather than three components that happen to look similar.

|            |                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source     | `packages/sanity/src/ui-components/tab/Tab.tsx`, the Studio shadow of `@sanity/ui` `Tab`                                                                                                                                              |
| Tier       | SERVICE. Fixes padding (`2`) and `muted`, narrowing the primitive to Studio’s tab look, and adds an `iconRight` slot the primitive lacks                                                                                              |
| Audit      | 🟢 holds (`module-tabs`, `alternative-views`). Tabbed switching between views of one region is competent in Studio; the layout-chapter defects the audit found sit elsewhere (`center-stage`, `collapsible-panels`, `movable-panels`) |
| Patterns   | `module-tabs` · `alternative-views`                                                                                                                                                                                                   |
| Call sites | field groups (`ObjectInput/fieldGroups/GroupTab.tsx`) · Review changes (`ChangesTabs`) · release filters (`ReleaseDocumentFilterTabs`) · Tasks sidebar (`TasksListTabs`)                                                              |

It is the primitive to compose for any surface where one pane offers a handful of alternative views, and it already looks like the rest of Studio.

That consistency is the point of the shadow. It takes a subset of `@sanity/ui` `Tab` props (`aria-controls`, `focused`, `icon`, `id`, `label`, `selected`, `tone`) and pins padding to `2` and `muted` on, so a tab a little too tall or a little too loud cannot accidentally ship. The added `iconRight` slot ([sanity-io/ui#2173](https://github.com/sanity-io/ui/pull/2173)) is what lets a tab double as the `More` overflow menu (see the icons story).

> **Why it matters:** padding and font size are deliberately _not_ configurable here. Reaching for a different size means reaching for the wrong component; every tab in Studio is meant to read the same, and that uniformity is what the shadow exists to guarantee.

The last story shows it in context: a document pane header for the book _Anna Karenina_, its views, Editor, Preview, History, riding a `TabList` across the top of the pane and swapping the panel below without leaving the document.
