# What the studio must be able to show

Source: the Variants 2.0 design handoff (Figma pages C1, E1 to E3, list item types T1 to T6), its parts and flows
notes, the Nordic Books fixture and the pinned Studio code, as of 2026-10-19. Where the handoff had no source it said
so; so does this file.

**Model (decided 19 Oct):** the handoff's reading is the truth. A version is
`draft | published | release` (plus scheduled drafts). A variant's version can sit inside a release.
There is no recursive nesting ("draft of a draft", "release of drafts"); do not build one.

## C3 edge: release only (answered by the handoff, 19 Oct)
A document that exists only inside a release (no published base, no draft) shows the SAME versions control: the mark
appears whenever a document has more than draft and published, and a release version counts. The small base-state
badge on the control's corner describes the base document, so with no base there is NO badge (never fake a ring). In
the popover there is no "All users (Default)" first row; the list starts with the release version(s), newest edit
first, with the release name and scheduled time. Seeded as `book-release-only` (subtitle "edge: release only"), in the
ASAP (Copy) release. Not drawn in Figma yet; the studio is the first place to compare it.

## Axes
- **State:** published; draft; release version (as soon as possible, scheduled, undecided; archived or
  published releases); scheduled draft (separate Studio feature); agent bundle (rare).
- **Variant (fixtures say "audience"):** one dimension in open beta. Explorations also show Market, Locale,
  Channel, Plan, Campaign, Experimentation. Counts to show: 0, 1, 2 to 4, 5+.
- **Address:** state x variant values, set together for pane and global.
- **Switches (off = stock):** variants, releases, drafts (drafts off = published default, no Drafts row), live edit.
- **Perspective row:** hidden, shown, minimised; pending chip.

## By component
- **C1:** 3 switches x variant count x row state x picked values (none, 1, 2, 4); Option A pill menu with and without
  "Add a dimension…" (GA) or "View as…" (open beta); Option B Variants control empty or picked; document lacks the variant (show base).
- **C2 (picks not made):** base only; draft only; draft + published; variant with own draft; variant published only;
  variant scheduled in a release; variant in an ASAP release; 7 audiences; many versions; missing variant
  (dashed pill); drafts off; live edit.
- **C3 (decided):** list item types T1 to T6; no mark with only draft + published; mark with count when variants or
  releases exist; hover popover, "All users" first then newest edit; "and N more" past 5; scheduled with time of day;
  long titles; null subtitle; presence; variants off = no mark.
- **C4 to C8:** not drawn.

## Real or mock
- **Real in stock Studio:** published, draft, releases, scheduled drafts.
- **Mock (no extension point or not built):** composed address row with chips and dimension picker; "Add a dimension…" (GA) or "View as…" (open beta)
  in the perspective menu; reach counts; versions mark and hover popover on list rows; missing-variant note;
  multi-dimension addresses.
- **Verified 2026-10-19:** a variant version inside a scheduled or ASAP release exists in real data (Black Friday lists
  3 variant versions, scheduled 20 Nov 2026 9:00), and so does a variant whose base was never published. Stock Studio
  (variants flag off) shows these as plain duplicate rows, which is the gap the designs fill.

## Open beta
- **Must:** stock Studio unchanged with switches off; ONE variant dimension; state menu unchanged; row with 1 to 2 chips;
  variant versions draft, published, scheduled; C3 mark and popover; missing-variant note; a document with 12 versions.
- **Later:** multi-dimension columns and rail, presets, narrow width, permissions, 36-version scale.

## Fixture coverage (Nordic Books, 10 documents)
Covered: many audiences, variant draft + published, scheduled variant in a release, ASAP release, draft only,
published only, long title, 5 versions, base + variant draft.
Missing: a second dimension (locale, market, channel); scheduled draft outside a release; undecided release;
archived or published release; variant with no published base; one document with 12 versions (max is 8);
explicit "document lacks the active variant"; agent bundle; presence on a variant version; per-document data for the
draftsDisabled and liveEdit worlds.

## Seeded in `variants-2-0` (project ppsg7ml5, private) by `seed/seed.mts`

Run `pnpm seed` (idempotent; needs a Sanity CLI login) and `node seed/verify.mts` to list what exists.
- The 10 Nordic Books documents with every version in the fixture (7 audiences; published, draft, scheduled in
  Halloween 31 Oct and Black Friday 20 Nov, ASAP "ASAP (Copy)").
- **Added for the missing cases:** scheduled draft outside a release (`rSchedDraft`, cardinality one); undecided release;
  published release; archived release; variant with no published base (`book-rail`); a second dimension, locale
  (en-GB, de-DE, fr-FR) alone and combined with audience (`book-translations`); two live-edit books.
- **Dimensions for C1's three picker forms:** 53 definitions over seven dimensions (Audience 7, Locale 3, Market 3, Channel 3,
  Campaign 2, Plan 3, Country 30, the last one for the picker's tall-list case). The Config panel limits how many the picker shows: 1 = flat list, 2 = columns, 5 = rail. Checked live.
- **Still missing:** a document with more than 12 versions; agent bundle; presence on a variant version; the
  draftsDisabled world (a workspace setting, not data); a variant defined with no document that has it, beyond
  `book-field-guide` and `book-tidewater` (no variants).
- Times: "when" in the fixture is not reproduced; created and edited times are real (seed time). Releases are in
  Europe/Berlin (+01:00 after 25 Oct).
- The archived release holds no visible version (archiving discards it); only its state is seeded.

## C4 Option A: Andrej's inventory side panel, live (19 Oct)
Ported from the Storybook Variants 2.0 branch at db53306896 (`c4/inventory/`: model, panel, menus, date span picker; each
file has a header). His mock "Lisbon guide" fixtures are replaced by a live world (`useLiveWorld.ts`): the open
document's versions, the real releases, the variant definitions and the dimensions the studio shows. Choosing a row sets
the studio perspective and the C1 row's variant values. Not carried over: the navbar eye and the bulk bar that replaces
the toolbar. His three sample saved views are removed (saved views are a fast follow). Changed fields and workflow
stages are not computed from live data yet, so those columns and the By stage view are empty.
