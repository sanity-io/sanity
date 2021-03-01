2018-12-13:  BREAKING: Changed params for `htmlToBlocks` from `(html, options={blockContentType})` to `(html, blockContentType, options={}` as blockContentType is now required.

2019-10-16: `normalizeBlock` now takes a second parameter `options`. You can send in `options.allowedDecorators` which are the allowed decorator names. If you send in this, `normalizeBlock` will remove any span marks that are neither a decorator or exists in `block.markDefs`.

2020-02-13: NEW: `htmlToBlocks` will not normalize all the blocks (give them a _key and merge sibling spans with same set of marks together)

2020-09-03: BREAKING: removed deprecated editor specific methods `blocksToEditorValue` and `editorValueToBlock`. Please use an older version if you need these.

2020-09-03: NEW: `htmlToBlocks` will now support hoisted block type names.

2020-09-03: NEW: `normalizeBlock` now support naming your block type through `options.blockTypeName`
