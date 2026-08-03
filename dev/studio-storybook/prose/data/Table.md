---
source: stories/data/Table.stories.tsx
title: 'Anna Karenina'
blocks: 12
roundtrip: true
sourceHash: 7b70fd9e0ca6eb53
---

<!-- @component -->

Despite living in the releases folder, this is a fully general table primitive with no release-specific code in it at all: self-contained for interaction, delegated for semantics.

|        |                                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source | `packages/sanity/src/core/releases/tool/components/Table/Table.tsx`                                                                                                                        |
| Tier   | CORE. The virtualized, sortable, searchable table behind the Releases overview                                                                                                             |
| Audit  | 🔴 needs-work (ledger #52). A column whose value is a number never sorts, and fails silently: the header responds, the arrow rotates, no row moves. See the Current/Recommended pair below |

A caller supplies `data`, a `columnDefs` array, a `rowId` path, and a scroll container. It gives back a sticky header, client-side sorting and searching, `@tanstack/react-virtual` row windowing, a loading skeleton, and an empty state.

A second decision worth noticing: the loading state renders three real rows with `isLoading: true` passed down to every cell, rather than a spinner over the table. Each column draws its own skeleton at its own width, so the placeholder has the shape of the thing that is coming.

**Two traps, both silent.** `scrollContainerRef` must be a state value, not a `useRef`: the virtualizer needs a render after the element exists, and a ref mutation gives it none, so the result is a header with no rows underneath and no error to explain it. And a numeric column will not sort unless it is also given a `sortTransform`, which is the defect the Current/Recommended pair below documents.

> **Why it matters:** sorting and searching are held inside the table, so a column header can flip the sort without the parent knowing, but the data is filtered by a function the parent supplies, so the parent decides what "matching" means. The releases overview searches on title and description; another caller could search on anything, and neither has to reimplement the header or the sort toggle. The one thing the table refuses to own is scrolling, since the scroll boundary belongs to the surrounding pane.

<!-- @story Populated -->

Twelve rows in a 340px window, so only a handful are in the DOM at any moment. Scroll it and inspect: the row count stays roughly constant while `data-index` climbs, which is the virtualizer swapping rows in and out. The header stays put because it is `position: sticky` inside the same scroll container.

<!-- @story Sortable -->

Click **Title** or **Author**. The first click sorts descending, clicking the same header again flips direction, and the arrow rotates 180 degrees rather than swapping glyph - a small thing that reads as the same control changing state instead of a different control appearing. Note "Status" has `sorting: false` and so renders as a plain label with nothing to click.

<!-- @story Recommended -->

The same table with one line added to the Year column: `sortTransform: (book) => book.year`. Click **Year** now and it sorts. The transform is an identity function - it changes no value, it only satisfies the `sortColumn?.sortTransform &&` condition that the comparator uses to decide whether a number is allowed to be a number.

That is the workaround, and it works. The actual fix is upstream and smaller: delete that condition, so `parseDate` returns any number it is handed. It cannot regress the transform path, which already returns numbers. Until then, every numeric column in every future caller needs this identity function, and will be silently broken without it.

<!-- @story Searchable -->

The title header is replaced by `Headers.TableHeaderSearch`, which writes into the same table context the sort reads from. Type "lem" or "dune": the filtering itself is done by the `searchFilter` prop this story supplies, matching on title _or_ author, so an author name finds rows whose titles do not contain it. Clear the field and everything returns - the source data is never mutated.

<!-- @story Loading -->

Three skeleton rows, each cell drawing its own placeholder at roughly the width of the content it is standing in for. The search input is disabled while loading, because there is nothing to search yet and an enabled field that returns nothing reads as a broken search rather than a pending one.

<!-- @story Empty -->

No data and not loading. The layout switches to a grid so the empty message centres in the remaining height rather than sitting under the header. An empty table looks composed instead of truncated.

<!-- @story EmptyStateComponent -->

`emptyState` takes a string or a component. The string form is for "nothing matched"; the component form is for "nothing exists yet", where an empty screen is the right moment to explain what the feature is and offer the action that ends the emptiness. Both are the same slot, and choosing between them is a content decision rather than a technical one.

<!-- @story WithRowActions -->

Passing `rowActions` appends a fixed 50px column that the caller never has to declare. It is skipped for skeleton rows (`datum.isLoading`), and when the callback returns nothing an empty box of the same width holds the space - so a row without an action does not pull the other columns sideways.

<!-- @story RowTones -->

`rowProps` returns partial Card props per row, which is how the releases overview tints a row that is currently selected, one whose scheduled date has slipped into the past, and one that has been deleted underneath you. Tone on the row rather than in a cell means the whole row reads as being in that state, which is the honest rendering when the state belongs to the record and not to one of its fields.

<!-- @story EmptyStatePrimitive -->

The empty row rendered outside a table, both forms side by side. It renders a `<tr>` with a `<td colSpan>` - so it is only valid inside a table, and the frames below are supplying one.

<!-- @story InContext -->

The shape the primitive was extracted from: a tool pane with a title, a tab row, and the table filling what is left. Everything the table needs from its surroundings is visible here - the pane owns the height and the scrolling, the table owns the rows.
