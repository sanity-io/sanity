---
source: stories/beta/FieldDiffs.stories.tsx
title: 'The quiet rise of structured content'
blocks: 12
roundtrip: true
sourceHash: 0b761fed62775f4a
---

<!-- @component -->

The Review changes panel does not compare two strings and hope an editor notices: it computes the diff for real, field by field, and almost all of the behaviour here lives in how that diff is computed rather than how it is drawn.

|           |                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source    | `packages/sanity/src/core/field/diff/components/`                                                                                                                                                                   |
| Tier      | SERVICE                                                                                                                                                                                                             |
| Patterns  | `draft-publish-lifecycle`                                                                                                                                                                                           |
| Mechanism | `ChangeList` walks a diff tree and dispatches each change to the renderer for its type: strings get segment-level highlighting, booleans get a from/to pair, nested objects get grouped, array items get matched up |

There is no array diff renderer and no object diff renderer. `buildChangeList` expands both into per-item, per-field changes and dispatches each to its own type’s component. So "the tags array changed" is not a sentence this panel can produce, it names the item and the value instead, which is the only version an editor can act on.

Diffs are built with `diffInput(wrap(from), wrap(to))` and rendered inside a real `DocumentChangeContext`. Annotation colours are per author, so the tinting comes from the user-colour manager rather than from a fixed palette.

> **Why it matters:** these stories vary the documents, not the components, and everything below is computed by the real diff function the studio itself calls. That is not fastidiousness: it decides which array items count as the same item moved versus one removed and one added, where a string diff decides a word boundary is, whether an object with three edits is one change or three. Hand-authoring a diff object, the obvious way to story this, would skip precisely that and leave stories that only prove the renderers accept props.

<!-- @story StringEdited -->

One word changed in a title. Notice the diff is **segment-level**, not whole-value: the unchanged text is plain, the removed run is struck through, the added run is highlighted, and they sit inline in one sentence rather than as two separate before/after blocks.

That is the difference between "here are two strings, compare them yourself" and "here is what changed". Hover a highlighted segment for its added/removed label.

<!-- @story StringRewritten -->

When the two values share almost nothing, the segment diff degrades gracefully into one removed run and one added run - which is the honest rendering. A word-level differ that tried harder here would find spurious common substrings and produce a shredded, unreadable result.

<!-- @story FieldAdded -->

A field that had no value now has one. The panel shows an empty from-side rather than omitting it, so "this was blank" and "this was something else" stay distinguishable - a distinction that disappears the moment you render only the new value.

<!-- @story FieldRemoved -->

The inverse. Clearing a field is a change worth reporting as loudly as setting one, and it is the change most easily lost in a panel that only lists present values.

<!-- @story TypeMatrix -->

String, text, slug, number, boolean and datetime all changed at once, so the renderers can be read against each other.

The boolean is the one to look at. It cannot do a segment diff - there is nothing to segment - so it falls back to an explicit from → to pair with an arrow. Same for the number and the datetime. The panel does not pretend every type supports the same treatment; it uses the richest rendering each type can carry.

<!-- @story GroupedObject -->

Two fields changed inside the `seo` object. They are grouped under a breadcrumb naming the object rather than listed flat at the top level, which is what `GroupChange` exists for.

The grouping is what keeps a panel readable on a document with deep content: without it, a change three levels down arrives with no indication of where it lives, and every change looks equally top-level.

<!-- @story ArrayItems -->

The second tag replaced. There is **no array diff renderer** - `buildChangeList` expands the array into per-item changes and dispatches each to the renderer for the item type, here the string one.

Watch what `diffInput` decided. It did not report one item removed and one added: it matched the two values at **position 2** and reported that position as changed. The row reads `#2 cms → #2 structured-content`, with the index carried on both sides. Position-matching is a guess, and it is the right guess far more often than not - most array edits are edits in place - but it means a genuine reorder can read as several simultaneous changes.

Either way the panel names the values rather than saying "the tags array changed", which is the only version of that sentence an editor can act on.

<!-- @story NewDocument -->

Diffing against `{}`: every field reads as added. This is what the releases document diff shows for a document created inside a release, and it is the case that motivates `showFromValue` - see the next story.

<!-- @story NewDocumentWithoutFromValues -->

The same diff with `showFromValue: false`. Every field is still marked as added, but the empty from-side is dropped.

Compare with the story above. When one thing was added among many unchanged fields, "nothing → value" is informative. When _everything_ was added, a column of empty from-sides is a column of noise, and each row reads as though something was lost. Same data, and the right rendering depends on context the component cannot infer - hence a prop.

<!-- @story NoChanges -->

Two identical documents. `ChangeList` renders its own empty state rather than returning null: a heading saying there are no changes, and a sentence telling you how to make some ("edit the document or select an older version in the timeline").

That second sentence is the part worth noticing. An empty Review changes panel is ambiguous - it could mean nothing changed, or it could mean you are looking at the wrong two versions - and the copy resolves the ambiguity by naming the control that would change the comparison. An empty state that only says "nothing here" leaves the reader to work out whether that is the answer or a mistake.

<!-- @story FromToLayouts -->

`FromTo` is the before → after primitive. `inline` keeps both sides on one line with the arrow between them, and is what short values use. `grid` gives each side an equal `minmax(0, 1fr)` column, so long values wrap within their own half instead of pushing the arrow off screen.

The `minmax(0, …)` matters more than it looks: with a plain `1fr` a long unbroken value refuses to shrink below its content width and the layout overflows. It is the standard CSS grid trap, and it is handled here.
