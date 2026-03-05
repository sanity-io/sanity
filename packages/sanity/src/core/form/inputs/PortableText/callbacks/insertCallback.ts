import {type PortableTextBlock} from '@sanity/types'

import {insert, PatchEvent} from '../../../patch'
import {type InsertCallback} from './types'

export function createInsertCallback(options: {
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
}): InsertCallback {
  const {block, onChange} = options

  return (givenBlock: PortableTextBlock | PortableTextBlock[]): void => {
    const toInsert = Array.isArray(givenBlock) ? givenBlock : [givenBlock]

    const patches = [insert(toInsert, 'after', [{_key: block._key}])]

    return onChange(PatchEvent.from(patches))
  }
}
