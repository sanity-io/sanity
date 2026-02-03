import {normalizeBlock} from '@portabletext/block-tools'
import {type PortableTextBlock} from '@sanity/types'

import {insert, PatchEvent} from '../../../patch'
import {type InsertCallback} from './types'

export function createInsertCallback(options: {
  allowedDecorators: string[]
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
}): InsertCallback {
  const {allowedDecorators, block, onChange} = options

  let toInsert

  return (givenBlock: PortableTextBlock | PortableTextBlock[]): void => {
    toInsert = Array.isArray(givenBlock) ? givenBlock : [givenBlock]
    toInsert = toInsert.map((blk) =>
      normalizeBlock(blk, {
        allowedDecorators,
      }),
    )

    const patches = [insert(toInsert, 'after', [{_key: block._key}])]

    return onChange(PatchEvent.from(patches))
  }
}
