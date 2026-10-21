# Variants 2.0 design studio

A Studio that shows the Variants 2.0 designs working together, one surface per handoff
component (C1 to C8), each with any number of options (A, B, C, ...).

```
pnpm install                              # from the repo root
pnpm --filter sanity-variants-2-0-studio dev   # http://localhost:3350
```

Project `ppsg7ml5`, dataset `variants-2-0` (private): Nordic Books plus every state in `PERMUTATIONS.md`.
Seed or refresh it with `pnpm seed` (needs `sanity login`); inspect with `node seed/verify.mts`.
Override with `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` (`northfold` switches to the Northfold schema).

## How options work

- `options/registry.ts` lists each component and its options. Add an option by adding an entry.
- `OptionSlot` renders whichever option is in force; a missing renderer shows a placeholder.
- The floating control (bottom left) picks the Nth option for every component (A, B, C, ...) or `Final`.
- Per-component overrides are in the same panel. Choices persist in localStorage.

```tsx
<OptionSlot component="c3" options={{a: <PopoverV1 />, b: <FlyoutV2 />}} />
```

Pinned to the Studio revision Storybook uses (`21388ff`), so the real parts match.

## Stock Studio first

The `beta.variants` flag is off, so the Studio is stock (no Variant selector, no Variants tool,
no inventory). Variants 2.0 designs are additions on top of it, mounted through `OptionSlot`.

## Presentation and scheduled drafts

- Presentation previews `SANITY_STUDIO_PREVIEW_ORIGIN` (default `http://localhost:3456`, the Northfold storefront).
  The storefront has no visual-editing or draft mode yet, so this is a plain preview without overlays.
- Scheduled drafts is switched on explicitly in `sanity.config.ts`.

## Preview

Deployed from this branch to the Sanity Sandbox Vercel team as `variants-2-0-studio` (Vercel Authentication on). The deployed origin must be in the CORS origins of project `ppsg7ml5` before the Studio can load data.

## E9 review sheet: local perspective, compare, review, list, field marks

Built 20-21 Oct 2026 from `docs/initiatives/curation-perspective-selector/DESIGN-STUDIO-BRIEF-E9.md`. Every switch is independent of "Show": All A / All B do not move them, so every older preset keeps today's look. Default is A (today) except where noted. Window group: "Compare and review (E9)". Presets: `E9 · A today`, `E9 · B`, `E9 · C`, `E9 · Data's recommendation (not decided)`, `E9 · Nav B`, `E9 · Nav C (vision)`.

| Switch (URL key)      | A                                      | B                                                                                                                                                     | C                                                                                                                     | Try it                                                                                                                                                                                 |
| --------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paneAddress`         | chips (today)                          | Documents · N button; panes follow global                                                                                                             | B + local row (`differs`, Follow global perspective, missing version with Create draft, narrow-pane menu)             | `/structure/book;book-lighthouse;author-maren-halvorsen,type=author,localPerspective=published,localVariant=aud-members?design=show.a,stage.open-beta,paneAddress.c`                   |
| `compare`             | none                                   | Open beside (Cmd-click a version in the inventory; list flyout)                                                                                       | B + one compare header (D12 title, Showing, Against, N changes in M fields, change list, Copy link, Close), C4 and C6 | `/structure/e9Case;e9-visitors;e9-visitors,localPerspective=drafts,localVariant=aud-members?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,compare.c` |
| `reviewPanel`         | stock                                  | Showing / Against, one-move counterparts, total and filters, Revert with Undo                                                                         | B + pane-owned Showing, two-way link to the field mark, Open full view                                                | open History in the pane menu of `fieldMarksTest;fm-2`                                                                                                                                 |
| `listMark`            | row icon                               | purple diamond on the Has variant stack                                                                                                               | purple side rule and tint                                                                                             | `/structure/e9Set?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,c3.d,listMark.c`                                                                     |
| `listFlyout`          | none                                   | chevron flyout with Open beside                                                                                                                       | B + Cmd-click a row opens beside                                                                                      | same list, `listFlyout.c`                                                                                                                                                              |
| `reviewPass`          | none                                   | Differs word per row, "7 of 10 differ", Review Returning visitors                                                                                     | B + pass held in the list (Document 3 of 7, Next, End, Esc, Looked at)                                                | same list, `reviewPass.c,compare.c`                                                                                                                                                    |
| `fieldMarks`          | shipped                                | one purple "Changed" bar per field (changed > differs from base), roll-up counts, item, block, removed and unknown marks, collapsed field set roll-up | B + peek (before, after, author, Open comparison)                                                                     | `/structure/fieldMarksTest;fm-2?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,fieldMarks.c`                                                          |
| `navLayout`           | today                                  | tools left, search and Create right                                                                                                                   | B + the global perspective inside the navbar; no row under it                                                         | `design=...,navLayout.c` (Row layout and Row width do nothing with C)                                                                                                                  |
| `paneControl`         | none                                   | header chip with the column picker, scoped to the pane                                                                                                | n/a                                                                                                                   | any document pane                                                                                                                                                                      |
| `reviewSet`           | none                                   | release against the base (M3)                                                                                                                         | B + Changed since (M4)                                                                                                | a document list with a release as the global perspective                                                                                                                               |
| `rowWidth`            | full                                   | contained 1200 (recommendation, default)                                                                                                              | compact 880                                                                                                           | any page with the row                                                                                                                                                                  |
| `localMatch` (hidden) | L5b: row goes away when global matches | L5a: row stays, "matches global"                                                                                                                      |                                                                                                                       | `design=...,localMatch.b`                                                                                                                                                              |

Other changes in this round: address row centred by default (`rowLayout`, still switchable), the Variants tool's "Add filter" uses the perspective bar's picker (Stock keeps the shipped menu), one missing-variant banner (C7 replaces the stock one), `?perspective=drafts` is read as the default perspective (it crashed every document pane).

Recommendation preset (not decided): `paneAddress=C, compare=C, reviewPanel=C, listMark=B, listFlyout=B, reviewPass=B, fieldMarks=B`, with `c2=B` and `c3=D`. The Figma frames centre the address row and the row is now centred by default; this README line replaces the earlier note that the default stays actionsRight.

Fixtures: `node seed/seed-e9.mts` and `node seed/seed-refs.mts` (see RUNBOOK, "E9 fixtures" and "References fixtures"). Audit of the shipped field marks and of dark mode: `E9-AUDIT.md`. Journeys: four E9 journeys in `options/journeys.json`. Checks: `journeys/verify-{marks,marks-model,pane-address,compare,compare-model,review,list,rowwidth,refs,variants-filter,one-banner}.mts`; captures land in `journeys-captures/e9-*` (git-ignored; re-run the scripts).

Core changes (all inert without their param or provider, each flagged in its commit): `DocumentPerspectiveProvider` (pane params `localPerspective`, `localVariant`), `GlobalPerspectiveProvider` (`?perspective=drafts` read as the default), `VariantFilterAddControlProvider`, `FieldSetRollupProvider`, `VariantBannerReplacedProvider`.

Not built or limited: list M3 (release against Published) and M4 (Changed since); item marks on arrays of plain values (the public item override does not cover them, the field carries a roll-up instead); mark labels drop to the bar alone when the pane has no room (1280 with an inspector); the Review panel's Against picker offers Published and Drafts only (no releases); "Looked at" lasts for the session.
