# Pending export tombstones

Type-only tombstones for moves that land before
[`SAPP-5034`](https://linear.app/sanity/issue/SAPP-5034) / #16525 merges the
`tombstones/manifest.json` generator.

Each `sapp-*.json` file matches the `root` (and later other entry) shape of
`manifest.json`. While that PR is open:

1. Keep the matching `// <tombstones-pending-sapp-…>` … `// </tombstones-pending-sapp-…>`
   block inline in the entry barrel (`export declare const` / `export type … = never` only).
2. Do **not** emit runtime JS for these names.

After #16525 merges: append the pending entries into `tombstones/manifest.json`,
run `node packages/sanity/src/_exports/tombstones/generate.mjs`, delete the
pending block and this JSON, then rebase.
