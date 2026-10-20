# E9 step 0: audit of the shipped field marks and of dark mode

Run on 20-21 Oct 2026 against `explorations/variants-2-0-studio` at `3a48246e91`, Field marks test document `fm-1` (Members variant, Published), `node journeys/audit-fieldmarks.mts`, `audit-bars.mts`, `audit-dark.mts`. Captures in `journeys-captures/e9-audit/`.

## A. Field marks (C9 A and C as shipped)

What is on screen today:

- Left gutter: a 13 px purple rhombus per changed field, also on every ancestor object (Settings, Meta), on array fields and on reference and image fields. It carries a hover tooltip, "Changed from base variant". It is not focusable.
- Right gutter: the stock Studio change bar. It is 1 px wide, amber (light `rgb(231,193,136)`, dark `rgb(117,84,27)`), and shows on a field and on each changed array item. It carries no word.
- C9 C adds a block mark (same rhombus, left of a changed portable text block) and a note under an array when base items are missing.

Measured contrast of the right bar: 1.7:1 on a light card, 2.5:1 on a dark card (3:1 is the floor for a graphical mark).

### Against F2-AC1 to AC8

| AC                                               | Verdict      | Finding                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1 mark at every ancestor, also collapsed       | Partial      | Expanded objects carry a rhombus. No roll-up count anywhere. A collapsed object, fieldset or array item has no signal of its own (F-REND-2/3 still open).                                                                                                    |
| AC2 added, removed, changed apart without colour | Fail         | One shape for all three. Added and removed are not distinguished: an added array item ("Four") and a changed one ("Two") both show the same amber bar; the removed item ("Three") shows nothing unless C9 C is on, and then only as a count under the field. |
| AC3 mark states its axis                         | Partial      | The tooltip says "Changed from base variant" (never "customised": correct), but only on hover. The right bar names no axis.                                                                                                                                  |
| AC4 mark to before/after in 2 actions            | Fail         | The rhombus opens nothing. The stock bar scrolls to Review changes, which does not exist in the variant view. There is no peek.                                                                                                                              |
| AC5 one arbitration rule                         | Not testable | Rhombus (left) and bar (right) sit side by side with no stated priority. Divergence marks are not seeded.                                                                                                                                                    |
| AC6 unknown path labelled                        | Not covered  | No handler and no fixture.                                                                                                                                                                                                                                   |
| AC7 revert only on the owned side                | Pass         | Nothing offers a revert.                                                                                                                                                                                                                                     |
| AC8 keyboard, focus, 24 x 24                     | Fail         | The rhombus is 13 x 13, inside a tooltip trigger that is not a button and cannot take focus. The stock bar button is 15 x 35 and focusable.                                                                                                                  |

### Against the 1 Oct decisions

- "Changed is purple and reads Changed": not implemented. The right gutter is amber, 1 px, wordless. Purple is used for the left rhombus, which the decision reserves for "which version".
- "Left gutter = which version (diamond), right gutter = what changed (bar)": inverted in effect. The diamond is the only thing that says "changed from base", and the bar says "changed from published" in a colour that is not the changed colour.
- "Added green, removed red only": not implemented (no added or removed mark at all).

### What is wrong, plainly

1. The two gutters are not doing the jobs the decisions gave them. The rhombus is doing "what changed" on the variant axis, and the right bar (the stock one) is doing something else in a different colour.
2. There is no non-colour channel and no word, so the marks fail greyscale and F2-AC2.
3. Nothing is reachable by keyboard or touch (rhombus), and nothing leads to before and after.
4. Containers do not roll up. Array items, removed items, collapsed fieldsets, moved items and unknown paths have no mark, or only a partial one.

Fixes in this build: `fieldMarks` B (complete marks) and C (peek). A stays as shipped.

## B. Dark mode

Method: the Studio scheme is set explicitly (`sanityStudio:ui:colorScheme`) while the OS scheme is the opposite, so anything that follows `prefers-color-scheme` instead of the Studio scheme, or hard-codes a colour, shows up. Eight surfaces (document of a variant, base document, version picker, Inventory, Variants tool, Releases, Presentation, Design options window), both directions. Every text element is checked for a light ground in a dark Studio and for contrast under 3:1.

Result:

- No light island in a dark Studio on any of the eight surfaces. The navbar global pill, the Showing row, the Design options pill, the inventory panel, banners and toasts all take their colours from `--card-*` tokens. The pill has no dark selector of its own because it needs none; no literal colour and no `prefers-color-scheme` rule exists in the navbar, variants or inventory code in `packages/sanity`.
- Reported by the scan, all stock or disabled controls: "Publish" disabled (2.3:1), "Add item" and "No style" placeholders (2.8:1), "Update" and "Reset all" disabled in the Design options window (2.8:1).
- Read from the code: the C2 B raised thumb and the Design options raised surfaces use black drop shadows (`rgba(0,0,0,.18)`), which vanish on a dark ground. The thumb also carries a `--card-border-color` border, so it keeps its edge; no change needed.
- The one real dark-mode gap is the stock change bar at 2.5:1 (see A), which `fieldMarks` B replaces.
- Could not reproduce a missing dark variable on the global pill. If the report came from Storybook, the pill story there is the place to look. No change made to the pill.

`journeys/audit-dark.mts` stays in the repo as the guard for the next round.

## C. The change surfaces as one system (21 Oct night pass)

Walkthrough: preset `E9 · Data's recommendation` + `compare.f` + `navLayout.c`, Field marks test 2 (Returning visitors draft against Published), `node journeys/verify-loop.mts` (open, mark says Changed, open the panel, pick a change and land on its field, open the comparison in the lane, revert one change, counts follow, close; 1440, light and dark).

| #   | Where the surfaces disagreed                                                                                                                                                                                 | Status                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The same change was counted three ways: the marks and the compare header summed a tally (a list of values counted 3 for one added, one removed and one moved value), the panel listed entries (1).           | Fixed: one definition, `countChanges` = the entries the panel lists; marks, header and panel use it.                                                                           |
| 2   | Picking a change in the panel only found top-level fields, so nested fields and array items did not scroll or thicken their mark.                                                                            | Fixed: the field is looked up by its path, then by shorter prefixes.                                                                                                           |
| 3   | In an Against pane (a pane with its own address) the marks compared the global variant, not the pane's own, so the Against pane showed the wrong marks.                                                      | Fixed: `useMarkData` reads the pane's local variant.                                                                                                                           |
| 4   | The compare header read its two documents once, so an edit, a revert or an Undo left its counts stale.                                                                                                       | Fixed: the header re-reads every 2.5 s.                                                                                                                                        |
| 5   | "Open full view" at 1440 folded the Showing pane away (a rack cannot hold the list, a panel and two panes).                                                                                                  | Fixed: below about 1700 px the panel hands over to the lane compare.                                                                                                           |
| 6   | Revert existed only in the panel, so the lane compare could not revert.                                                                                                                                      | Fixed: the compare's change list lists the panel's entries with Revert and Undo.                                                                                               |
| 7   | Revert did not reach the compare header, the marks and the panel together.                                                                                                                                   | Fixed (loop journey asserts: panel total, header count and one Changed mark fewer). A reverted field falls back to "Differs from base": the claim changes, it does not vanish. |
| 8   | Two missing-variant banners (the stock one and C7).                                                                                                                                                          | Fixed: C7 replaces the stock banner (`VariantBannerReplacedProvider`).                                                                                                         |
| 9   | `?perspective=drafts` crashed every document pane.                                                                                                                                                           | Fixed in core (flagged).                                                                                                                                                       |
| 10  | The review pass header ("7 of 10 differ") compares the PUBLISHED variant with the published base; the compare header compares the pane's draft with its Against. Different bases, so the numbers can differ. | Open: the pass header says "against Base" and the compare header names its Against; one base for both needs a decision.                                                        |
| 11  | Compare F is an approximation of L3: the ported bar in its inline layout in the header band, not aligned to the compared chip of the global row; no L2 fold at narrow widths.                                | Open.                                                                                                                                                                          |
| 12  | Arrays of plain values have no item marks (the public item override does not cover them); the field carries a roll-up.                                                                                       | Open (limit of the public API).                                                                                                                                                |
| 13  | Marks drop to a bar without words when the pane has less than about 60 px to its right (1280 with an inspector open).                                                                                        | Open (words stay in the tooltip and the accessible name).                                                                                                                      |

Compare D, E and F reuse the Storybook ComposedAddressBar, ported to `compare/composed/` (see its README for what changed, and for what the component cannot do: it does not read or set the real perspective, so the adapter maps the anchor to the global perspective and the counterpart to the Against pane; it has no read-only left side; a key set on one side only cannot be drawn; a composite address has no variant). The bar caps compared keys at one in the open beta and shows "Open beta compares one dimension at a time".
