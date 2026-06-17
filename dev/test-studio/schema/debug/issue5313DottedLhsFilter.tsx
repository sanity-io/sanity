import {defineField, defineType} from 'sanity'

// Repro for https://github.com/sanity-io/sanity/issues/5313.
//
// Symptom: when a patch arrives over the Studio's real-time channel and its
// selector uses a dotted-attribute LHS inside a filter (e.g.
// `arr[asset._ref == "..."]`), `@sanity/mutator`'s JSONPath parser throws
// `Expected ]` from `parseUnion` (see `packages/@sanity/mutator/src/jsonpath/parse.ts`).
// The mutation commits server-side; every open Studio session crashes on the
// incoming patch and the document view stays broken until full reload.
//
// HOW TO TRIGGER IN THIS STUDIO
// 1. `pnpm --filter sanity-test-studio dev` and open the *default* workspace.
// 2. Create a new document of type "Issue 5313 — dotted-LHS filter repro".
//    - Add 1-2 items to the "Broken: asset-ref array" field. Note one of the
//      asset `_ref` values (e.g. `image-abc`).
//    - Add 1-2 items to the "Control: keyed array" field. Note one of the
//      generated `_key` values from the JSON view of the document.
//    - Publish, then leave the document open.
// 3. In a second terminal, run the sibling repro script:
//      node dev/test-studio/schema/debug/issue5313DottedLhsFilter.fire-patch.mjs <docId> broken
//    This issues a mutation using `brokenArr[asset._ref == "..."]` as the
//    selector. The mutation commits, but the open Studio tab throws
//    `Error: Expected ]` from @sanity/mutator and the document view becomes
//    unusable until you reload.
// 4. Reload the Studio. Run the same script with the `control` argument:
//      node dev/test-studio/schema/debug/issue5313DottedLhsFilter.fire-patch.mjs <docId> control
//    This patches via `keyedArr[_key == "..."]` and the Studio handles it
//    cleanly. The contrast isolates the bug to the dotted-attribute LHS.
//
// The underlying parser regression is also covered by
// `packages/@sanity/mutator/test/parse-issue5313.test.ts`.

export const issue5313DottedLhsFilter = defineType({
  name: 'issue5313DottedLhsFilter',
  type: 'document',
  title: 'Issue 5313 — dotted-LHS filter repro',
  description:
    'Two arrays side by side. Patch the "broken" one with a dotted-attribute filter from a second terminal to crash the open Studio tab. Patch the "control" one with a _key filter to confirm the workaround.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      initialValue: 'Issue 5313 repro',
    }),
    defineField({
      name: 'brokenArr',
      type: 'array',
      title: 'Broken: asset-ref array (dotted-LHS filter target)',
      description:
        'Items shaped like the user\'s repro. Patch with selector `brokenArr[asset._ref == "<ref>"]` from a second terminal to crash the open Studio tab.',
      of: [
        {
          type: 'object',
          name: 'assetRefItem',
          fields: [
            defineField({
              name: 'asset',
              type: 'object',
              title: 'Asset',
              fields: [
                defineField({
                  name: '_ref',
                  type: 'string',
                  title: 'Ref',
                  description:
                    'Plain string to keep this self-contained (no real asset upload required). Use this value verbatim as the RHS of the filter in the repro script.',
                  initialValue: 'image-abc',
                }),
              ],
            }),
            defineField({
              name: 'label',
              type: 'string',
              title: 'Label',
              description:
                'Field that the patch will replace, so the effect is visible in the form.',
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'asset._ref'},
          },
        },
      ],
    }),
    defineField({
      name: 'keyedArr',
      type: 'array',
      title: 'Control: keyed array (workaround)',
      description:
        'Same item shape, patched via `keyedArr[_key == "<key>"]`. The Studio handles this cleanly because the parser already accepts a single-attribute LHS.',
      of: [
        {
          type: 'object',
          name: 'keyedItem',
          fields: [
            defineField({
              name: 'asset',
              type: 'object',
              title: 'Asset',
              fields: [
                defineField({
                  name: '_ref',
                  type: 'string',
                  title: 'Ref',
                  initialValue: 'image-xyz',
                }),
              ],
            }),
            defineField({
              name: 'label',
              type: 'string',
              title: 'Label',
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'asset._ref'},
          },
        },
      ],
    }),
  ],
})
