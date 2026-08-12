# Comparing a variant to its base: design exploration

Status: **exploration, nothing decided.** No part of this is on a shipping branch.

This is an archive of a design exploration into how the Studio should surface the comparison
between a variant document and the base it is derived from. It records the constraints found in
the existing code, the ten layouts that were drawn, the naming options considered, and the
questions still open. It exists so the thread can be picked up later without repeating the
groundwork.

The work sits underneath a larger question the team has been circling: how the Studio communicates
change confidently across the whole application. Treat the conclusions here as input to that, not
as a settled answer.

|              |                                                                    |
| ------------ | ------------------------------------------------------------------ |
| Origin       | The variant field indicator (PR #13991)                            |
| Spike branch | `spike/variant-vs-base-diff`                                       |
| Prototype    | [`options-prototype.html`](./options-prototype.html)               |
| Related      | [`../EDITING.md`](../EDITING.md), [`../ACTIONS.md`](../ACTIONS.md) |

---

## 1. What started this

The variant field indicator marks a form field when its value differs from the Default audience.
Its tooltip reads "Different from the default. Select to review changes", and activating it opens
the Review changes inspector.

Testing surfaced a contradiction: a field could carry the mark while the inspector said
"There are no changes". Both statements were true, because they answer different questions.

- The **mark** compares the variant against the **base document**, right now.
- The **inspector** compares the variant against **its own earlier revision**.

Typing a value into a variant and then reverting it produces exactly that state: no change over
time, but still a difference from the base. The mark promised a destination that could not explain
it.

---

## 2. The two axes

The whole exploration reduces to naming and surfacing two directions of comparison.

```
                     the variant, right now
                             |
        TIME ----------------+---------------- VERSION
   same document,            |          different document,
   earlier moment            |            same moment
                             |
   the same variant,         |         the base document, now
   as of last week           |         (what Default sees)
```

The product already draws this line, in both the interface and the code:

- **Version** is a layer of a document: `versions.<scopeId>.<groupId>`, covering drafts, releases
  and variants. The document footer says "Manage versions". `useDocumentVersions` returns these.
- **Revision** is a moment in one document's life: `_rev`, the `rev` URL parameter,
  `sinceRevision`, `revisionId`.

Any naming that rides those two words inherits meaning already established elsewhere.

---

## 3. Constraints found in the existing code

These were discovered while exploring and each one eliminated or reshaped an option.

### 3.1 The History tab is a picker, not an archive

`ChangesTabs` renders two tabs. The one labelled **History** renders `EventsSelector`, which
renders **`EventsTimeline`**: a paginated list of document group events (created, edited,
published, unpublished, scheduled, unscheduled, version deleted, group deleted) with "load more"
and expandable release events.

Clicking a row runs:

```
selectRev(event) -> findRangeForRevision(event.id) -> setTimelineRange(since, rev)
```

That writes the same `since` / `rev` state the From/To menus in Review changes write. The two tabs
are two views of one piece of state: History picks the range, Review changes renders the result.

Consequence: "History" is the least accurate label in the panel, and the component behind it is
already called `EventsTimeline`.

### 3.2 Label collision

The outer tabs are `History` and `Review changes`. Any inner control that also offers "History"
puts two of them on screen a few rows apart, meaning different things.

### 3.3 The panel is narrow

Measured at **292px**. Every layout below was drawn at that width. Three tabs fit; long variant
names (for example "Regional Marketing Launch: birmingham / rich-customers / brand-x") do not, and
need truncation with a tooltip.

### 3.4 "To" was never a real choice

For a variant comparison the right-hand operand is always the document being edited. Presenting it
as a picker implies an interaction that does not exist.

### 3.5 Patterns already available

Nothing below requires new primitives.

| Pattern                 | Where it lives                   | What it gives                                                               |
| ----------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `Tab` / `TabList`       | `ui-components/tab/Tab`          | The existing tab row                                                        |
| `EventsTimelineMenu`    | `panes/document/timeline/events` | The From/To revision menus                                                  |
| `VersionMenu` pill      | `structure/diffView/versionMode` | A pill plus `TransferIcon`, the Studio's existing "compare A to B" language |
| `getVersionInlineBadge` | banners                          | Tone-coded perspective badges                                               |
| `ChangeList`            | core                             | Field level diff, connector lines back to the form, and a revert control    |

### 3.6 A single source of truth for the comparison

The spike deliberately reuses `selectVariantBaseDocument`, the same function that decides which
fields get a mark, as the comparison base for the panel. Panel and marks therefore cannot drift
apart: if a field is marked it appears in the list, and the reverse.

---

## 4. The layouts

Ten designs, all drawn at 292px against the same diff so only the chrome varies. The prototype
renders every one of them side by side in light and dark, and shows each in both comparison states.

"Text" counts the elements a reader passes before reaching the diff.

### Baseline: the first working spike

```
What do you want to compare?
[This variant to its base] [A moment in time]
From   Default audience
To     VIP Customers
```

Worked, and proved the comparison was cheap to build. Judged too verbose: seven text elements over
four rows, with free floating labels competing with the question above them.

**Text: 7.**

### A. Third tab

```
History | Changes | Default
(diff)
```

The axis becomes a peer of the two views already in the tab row. From/To disappears in that tab
because the tab name is the comparison.

Reuses `Tab`, `TabList`. Deep linking is free, since `changesInspectorTab` is already a pane
parameter. Three tabs do fit at 292px.

Weakness: two labels are places and one is a relation. Forces renaming "Review changes" to
"Changes" to make room.

**Text: 3.**

### B. The From selector carries it

```
From  [ Default audience  v ]     menu, grouped:  VERSIONS / HISTORY
To      VIP Customers
```

One menu offers both kinds of source in two groups. Choosing implies the axis, so no separate mode
control is needed.

Weakness found when rendered: with From interactive and To static, the two rows look like a matched
pair but only one responds. The static box reads as disabled rather than fixed.

**Text: 3.**

### C. Compare versions header

```
[ Default ]  ->  [ VIP Customers v ]
```

Lifts the two pill plus `TransferIcon` pattern the Studio already uses for comparing versions. In
time mode the same layout holds two revision menus, so one component serves both axes.

Strongest consistency argument, and the largest text reduction of A to D.

Weakness: the existing pattern lives in a full width header, not a 292px panel. Long names must
truncate.

**Text: 2.**

### D. Entry point decides

```
Comparing to the default audience.  Use history instead
(diff)
```

No chooser. Arriving via the field indicator opens the version axis; arriving via the History menu
opens the time axis. A single link crosses over.

Leanest of all. Weakness: the second axis is invisible until discovered, and in dark mode the
crossover link is the only coloured element in the panel, so it pulls more attention than a
secondary action should.

**Text: 1 line.**

### The regression in A to D

A, B and C bought their text savings by removing the mode switch entirely, and D reduced it to a
link. The ability to move deliberately between the two comparisons was lost. Option E restores it.

### E1. Switch plus pills

```
[ Default | History ]
[ Default ]  ->  [ VIP Customers ]
```

Segmented control with one word labels, then both operands.

Weakness: "Default" appears twice in one view, once as the mode and once as the operand.

**Text: 4.**

### E2. Switch plus one pill

```
[ Default | History ]
against  [ Default audience ]
```

Drops the right operand for the reason in 3.4. "against" does the work "From" and "To" were doing,
in one word, and the row reads as a phrase.

The only E variant where nothing is said twice.

**Text: 3.**

### E3. Switch only

```
[ Default | History ]
(diff)
```

Leanest of the E family. Weakness: in Default mode nothing on screen names what is being compared
against, and in History mode the pickers return, so the two states are structurally different.

**Text: 2.**

### F. Rename the outer tabs, keep the inner switch

```
Timeline | Compare
[ Versions | Revisions ]
against  [ Default audience ]
```

E2 with the outer pair renamed per 3.1. One existing string changes
(`changes.tab.history`).

Weakness confirmed when rendered: `Versions` and `Revisions` are near identical shapes at 12px. The
eye cannot separate them without reading, which defeats a two item control meant to be scanned.

**Text: 3.**

### G. Pinned picker, no inner switch

```
Timeline                          Compare
[ Default audience ]  <- pinned   against [ Default audience ]
------------------                (diff)
Edited      Aug 12
Edited      Aug 12
Published   Jul 31
Load more...
```

The version axis moves into the list that was already built for picking. Selecting the pinned row
compares against the base; selecting an event compares against that moment. The Compare tab needs
no switch, because the choice was already made in the picker.

This is the only option that removes the naming problem rather than answering it, because there is
no second set of labels. It also scales: release to base, or variant to variant, are further pinned
rows rather than a third tab or a longer control.

Costs, and the reason it is not a free win:

- It touches `EventsTimeline`, a real component with pagination and event type guards.
- The pinned row is not an event, so it cannot route through `findRangeForRevision`, and `selectRev`
  explicitly rejects delete, unpublish and schedule events as unselectable. The pinned row needs its
  own branch.
- Pinned must mean sticky at top, not merely first in list, or it scrolls away in a long history.
- The row is only meaningful when a variant is selected. On an ordinary document the list is
  unchanged.

**Text: 2 in Compare.**

### Summary

|          | Layout                     | Text   | New components               | Strings changed    |
| -------- | -------------------------- | ------ | ---------------------------- | ------------------ |
| Baseline | Question, tabs, From/To    | 7      | none                         | 3 added            |
| A        | Third tab                  | 3      | none                         | 1 renamed, 1 added |
| B        | From carries it            | 3      | none                         | 1 added            |
| C        | Two pills and an arrow     | 2      | one layout wrapper           | 1 added            |
| D        | Entry point decides        | 1 line | none                         | 2 added            |
| E1       | Switch plus pills          | 4      | none                         | 2 added            |
| E2       | Switch plus one pill       | 3      | none                         | 3 added            |
| E3       | Switch only                | 2      | none                         | 2 added            |
| F        | Renamed tabs, inner switch | 3      | none                         | 1 renamed, 2 added |
| G        | Pinned picker              | 2      | pinned row in the event list | 1 renamed, 1 added |

---

## 5. Naming

Six candidate pairs were considered for the two axes.

|     | Across versions  | Within one version | Assessment                                                                                                                                                              |
| --- | ---------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Versions`       | `Revisions`        | Both are the product's own words and map exactly. They also rhyme and look alike at 12px, confirmed as a problem in the rendered prototype.                             |
| 2   | `Versions`       | `Timeline`         | Same correctness without the lookalike problem. "Timeline" is already the code's word for a document's own history. Collides if the outer tab is also renamed Timeline. |
| 3   | `Audience`       | `Timeline`         | Concrete for variants, breaks as soon as a release is compared to its base.                                                                                             |
| 4   | `Default`        | `History`          | Vague on the left, collides with the outer tab on the right. Rejected.                                                                                                  |
| 5   | `Between`        | `Within`           | Logically the clearest pair. As standalone labels they are adjectives with no object, and read like a filter rather than a view.                                        |
| 6   | `Other versions` | `This version`     | Unambiguous, and the shared noun makes the axis obvious. Two words each.                                                                                                |

Outer tab naming interacts with this. If the outer pair becomes `Timeline` and `Compare`, per 3.1,
then the inner control cannot use Timeline, which pushes it back to pair 1 and its lookalike
problem. Option G avoids the interaction entirely by having no inner control.

---

## 6. Decisions taken during the exploration

Recorded so they are not relitigated without cause.

| Decision                                                          | Reasoning                                                                                                                                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The mark compares against the base, live, in both directions      | A variant is an independent copy with no live link to its base. Comparing anyway is the useful thing. If either side moves, the answer changes. This is intended behaviour, not a limitation. |
| Divergence outranks a variant difference in a shared field gutter | The divergence mark asks the editor to act on a conflict. Only one mark shows at a time.                                                                                                      |
| Top level fields only, for now                                    | Matches the granularity of revert and of the review changes diff, so the three surfaces cannot disagree. Nested granularity is reachable later, and should cover divergence at the same time. |
| No inset ring on the input                                        | The gutter mark is the variant signal. The existing change bar stays as it is.                                                                                                                |
| Panel and marks share one comparison function                     | `selectVariantBaseDocument` decides both. They cannot drift.                                                                                                                                  |

---

## 7. Open questions

1. **Which layout.** G is the current preference, with F as fallback if the `EventsTimeline` work
   proves larger than it appears. Not decided.
2. **Mark colour.** The indicator uses `tone="suggest"`, which resolves to `#7953B6`. The Studio
   Patterns Figma node specifies `foreground-low`, `#721fe5`. Tone was chosen over a hardcoded hex
   so the mark themes correctly in light and dark. Whether the exact hue is load bearing is a
   design call.
3. **Divergence mark size.** The variant mark is now 13px in a 25px control per the Figma pattern.
   The divergence mark in the same gutter still renders at its default 21px. If they should agree,
   that is a change to the divergence indicator.
4. **Revert.** `ChangeList` supplies a revert control in the panel for free. Whether it routes
   correctly through the variant patch path is unverified. The field gutter revert is deliberately
   not built: `gutterEnd` exists in `FormRow` and is empty, waiting for it.
5. **The connector word.** "against" versus "vs." versus dropping it.
6. **Generalisation.** Release to base, and variant to variant, are the obvious next comparisons.
   G accommodates them; the others need structural change.

---

## 8. What exists in code

On `spike/variant-vs-base-diff`, layered on top of the field indicator branch:

| Commit                                                                         | Contents                                                                                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spike(variants): show the variant-vs-default diff where the indicator points` | `CompareWithBaseAudienceView`, modelled on `CompareWithPublishedView`, diffing against `selectVariantBaseDocument`. Roughly 60 lines plus two strings. |
| `spike(variants): make the comparison axis an explicit choice`                 | The baseline layout: a compare control above From/To, with From/To naming versions rather than timestamps.                                             |

Neither is intended for review. Both run: select a variant, open Review changes.

The prototype is a standalone page with no build step:

```
cd packages/sanity/src/core/variants/design-notes
python3 -m http.server 8899
# then open http://127.0.0.1:8899/options-prototype.html
```

It has a light and dark toggle, renders every layout at the real panel width, and shows each in
both comparison states.

---

## 9. Not in scope here

The field indicator itself is a separate, self contained piece of work in PR #13991: read only,
top level fields, no revert. It ships or does not ship independently of anything in this document.
The only tie is its tooltip, which currently promises "Select to review changes" and points at a
panel that answers a different question. Until this exploration lands, that copy is the honest
thing to change.
