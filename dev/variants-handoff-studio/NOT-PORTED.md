# Not ported in the 10 Nov update (main + #15831, #15832, #15833)

The Handoff Studio branch (`handoff/content-variants-open-beta-current`) took main for real Studio code. These proposed hooks and copies of
core files did not survive. Nothing here is a regression in main.

## Dropped (no call site left in main's rewritten files)

- `DocumentGroupPickerMenu`'s `otherDocumentId` prop (the comparison picker no longer hides the document on the other side).
- `DocumentStatusBar` greyed actions (`footerGreyed`): main's `DocumentStatusBarActions` has no `disabled` prop.
- The Handoff's own versions popover (`DocumentVersionsStatus` as proposed): main's shipped v1 popover (#15749) is used.
- `PerspectiveFilter`, `PerspectiveFilter.css` (`SegmentDivider`), the PerspectiveFilter story: main deleted them.

## Re-applied on main's code

- `ReleasesMenu` `trigger` prop (PROPOSED): the Handoff's own state control needs a custom trigger (replaces `GlobalPerspectiveMenu`'s `trigger`).
- Proposed context files now use React `createContext` (main removed `sanity/_createContext`).

## Inlined into `dev/variants-handoff-studio` (their core files moved or were deleted)

- `c1/RhombusOutlined.tsx`, the segment divider in `c1/AddressRow.tsx`, chips in `c7/OpenBetaBanner.tsx` (main's `VersionInlineBadge` has no `icon` prop).

## To check by eye (type-checks, not looked at one by one)

- Hooks whose providers are mounted but whose call sites main rewrote: `PerspectiveMenuExtension` (extra rows, label suffix, section), `DocumentPaneExtension`,
  `VariantBannerReplaced`, `VariantDetailExtension`, `FieldSetRollup`, `NavbarNeutral`, `DocumentListItemOverride`, `DocumentListArrange`.
  Their exports and context files are kept; main's files no longer call them, so a design option that relies on one shows stock Studio.
