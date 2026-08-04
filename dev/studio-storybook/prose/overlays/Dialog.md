---
source: stories/overlays/Dialog.stories.tsx
title: 'Overlays & Navigation/Dialog'
blocks: 1
roundtrip: true
sourceHash: bb0e512399519418
---

<!-- @component -->

Dialog is what Studio throws up when it needs to stop an editor and ask something, delete this document, discard these changes, or hold a short focused form, and its width presets are coarser than the sentences they are asked to hold: a one-sentence confirm at the width every confirm dialog ships with sets its copy on a line nearly 25 percent past comfortable reading length.

|             |                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `packages/sanity/src/ui-components/dialog/Dialog.tsx`, Studio shadow of `@sanity/ui` `Dialog`                                                                                                                                               |
| Tier        | SERVICE. Enforces an opinionated, capped footer (at most a cancel and a confirm button) and supplies localized default button labels                                                                                                        |
| Audit       | 🔴 needs-work (`modal-panel`, `escape-hatch`, `spinners-loading`, `destructive-friction`). The Delete/Unpublish confirm can sit on "Looking for referring documents…" indefinitely, and while it does, no confirm button is rendered at all |
| Patterns    | `modal-panel` · `escape-hatch` · `spinners-loading` · `destructive-friction` · `readable-measure` · `cognitive-load`                                                                                                                        |
| Width scale | `0` 320px/~44ch (primitive default) · `1` 640px/~94ch (what confirm dialogs pass) · `2` 960px/~144ch · `3` 1280px/~195ch · `4` 1600px/~245ch · `5` 1920px/~295ch · `auto` fits content                                                      |

The shadow’s job is to make every one of those look and behave the same: it takes the `@sanity/ui` primitive, pins the footer to at most a cancel and a confirm button, fills in translated default labels, and toggles body padding, so the header and body are composed while the frame handles the rest.

The Studio `Dialog` wraps `@sanity/ui` `Dialog` and adds: a fixed footer layout (`footer.cancelButton` / `footer.confirmButton` plus an optional `footer.description`), localized fallback labels pulled from `common.dialog.cancel-button.text` / `common.dialog.confirm-button.text`, a `padding` boolean that toggles the default body padding, `animate=true` by default, and `bodyHeight` / `zOffset` passthrough. Confirm defaults to `tone="critical"`; cancel defaults to `mode="bleed"`.

The two-variant pair reproduces the audit finding on the real component: Current is the stuck destructive confirm (spinner, no confirm button), Recommended resolves the wait with a bounded error, a live confirm, and a clear escape hatch.

> **Why it matters:** width is a blunt instrument, and here it governs readability. The presets jump 320 to 640 to 960px, so a one-sentence confirm at the standard confirm width sets its copy on a line near 94 characters, past the 75-character reading-comfort ceiling with most of the field left empty. Cap the prose, a measure-limited container around 62 characters, not the dialog; reserve the larger widths for genuinely wide content like tables and side-by-side diffs. The full study is below.

---

### Width & measure

`width` passes straight through to `@sanity/ui` `Dialog`, whose preset indexes `theme.sanity.container[width]` (px). The Studio wrapper sets no default of its own, so an omitted `width` inherits the primitive default of `0`. Body copy is `<Text size={1}>` (13px) inside the wrapper’s `padding={4}` box (space[4] = 20px each side), so the readable text field is `container[width] − 40px`. At 13px Inter (avg glyph advance ≈ 0.49em ≈ 6.37px) each preset yields:

| `width`                        | card max     | text field | measure        |
| ------------------------------ | ------------ | ---------- | -------------- |
| `0`, the `@sanity/ui` default  | 320px        | 280px      | ~44ch          |
| `1`, what confirm dialogs pass | 640px        | 600px      | ~94ch          |
| `2`                            | 960px        | 920px      | ~144ch         |
| `3`                            | 1280px       | 1240px     | ~195ch         |
| `4`                            | 1600px       | 1560px     | ~245ch         |
| `5`                            | 1920px       | 1880px     | ~295ch         |
| `auto`                         | fits content | n/a        | shrinks to fit |

Principle: hold text-first dialogs to a 45 to 75ch measure. Confirmations, alerts and prompts are prose, and prose past ~75 characters per line lengthens the eye’s return-sweep and measurably slows reading. The presets are coarse, `0` lands at ~44ch, then `1` jumps straight to ~94ch with nothing between, so a one-sentence confirm at `width={1}` sets its copy on a single ~600px line, ~25% past the comfort ceiling with most of the field left empty. The fix caps the _prose_, not the dialog: wrap body copy in a measure-limited container (`max-width` ≈ 62ch / ~396px) so the frame keeps room for header and footer while the text reads at a comfortable width. Reserve `width={2}` and up for genuinely wide content, tables, side-by-side diffs, media grids, never for sentences.

Proposed scale (RFC): the jumps are too big at the bottom, where most dialogs live, 320 to 640 to 960 in +320 steps, so there is no preset near the ~60 to 70ch text sweet spot. A finer low end, keeping `0` as the sensible default and letting `width={2}` land where `width={1}` is today, gives text-first dialogs a native preset and pushes the large sizes up where only tables and media need them. This renumbering is a `@sanity/ui` `theme.container` change, cross-cutting and breaking, an RFC for the design-system owners, not a story-layer edit; the measure-capped container above is the ship-now fix that needs no token change.

| preset | current px · measure | proposed px · measure | intended content                  |
| ------ | -------------------- | --------------------- | --------------------------------- |
| `0`    | 320 · ~44ch          | 320 · ~44ch           | confirmations, alerts, prompts    |
| `1`    | 640 · ~94ch          | 480 · ~69ch           | text-first bodies (measure-ideal) |
| `2`    | 960 · ~144ch         | 640 · ~94ch           | short forms (today’s `width={1}`) |
| `3`    | 1280 · ~195ch        | 800 · ~119ch          | multi-column forms                |
| `4`    | 1600 · ~245ch        | 1024 · ~155ch         | tables, side-by-side diffs        |
| `5`    | 1920 · ~295ch        | 1280 · ~195ch         | media grids, wide canvases        |

Content type to width, measure governs text: confirmation / alert / prompt uses `0` or a measure-capped container (~62ch), never above ~75ch; short form uses today `1` (proposed `2`); multi-column form uses today `2` (proposed `3`); table or side-by-side diff uses today `2`–`3` (proposed `4`); media grid or canvas uses today `3`+ (proposed `5`).

In production: `ConfirmDeleteDialog` and `ConfirmDiscardDialog` both ship at `width={1}`; the discard confirm’s entire body is the 65-character sentence "Are you sure you want to discard all changes since last published?" set on one 600px line (a ~94ch field, unconstrained). `UnpublishVersionDialog` uses `width={0}` (~44ch) and is already comfortable. The Measure current/recommended pair reproduces the discard confirm and the measure-capped fix, each with a grayscale measure ruler under the copy.

The page closes _in context_: the real Delete confirm for the book _Anna Karenina_, its reference check resolved to a concrete count (three documents point at it) before the editor commits, a live open, confirm, cancel flow.
