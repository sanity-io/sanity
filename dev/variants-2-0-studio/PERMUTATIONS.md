# What the studio must be able to show

Source: Figma-Agent reply, 2026-10-19, read from the handoff file (C1, E1 to E3, C3 types T1 to T6),
`docs/initiatives/curation-perspective-selector/` (PARTS-C1, BRIEF-C1-storybook, HANDOFF-FLOWS,
fixtures/documents.json) and the pinned Studio code. Where Figma had no source it said so; so does this file.

**Model (decided by Faheem, 19 Oct):** the Figma agent's reading is the truth. A version is
`draft | published | release` (plus scheduled drafts). A variant's version can sit inside a release.
There is no recursive nesting ("draft of a draft", "release of drafts"); do not build one.

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
  "Narrow by variant"; Option B Variants control empty or picked; document lacks the variant (show base).
- **C2 (picks not made):** base only; draft only; draft + published; variant with own draft; variant published only;
  variant scheduled in a release; variant in an ASAP release; 7 audiences; many versions; missing variant
  (dashed pill); drafts off; live edit.
- **C3 (decided):** list item types T1 to T6; no mark with only draft + published; mark with count when variants or
  releases exist; hover popover, "All users" first then newest edit; "and N more" past 5; scheduled with time of day;
  long titles; null subtitle; presence; variants off = no mark.
- **C4 to C8:** not drawn.

## Real or mock
- **Real in stock Studio:** published, draft, releases, scheduled drafts.
- **Mock (no extension point or not built):** composed address row with chips and dimension picker; "Narrow by variant"
  in the perspective menu; reach counts; versions mark and hover popover on list rows; missing-variant note;
  multi-dimension addresses.
- **Unverified:** that a variant version inside a release can exist in real data today. Treat as mock until checked.

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
