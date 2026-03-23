import {type PortableTextBlock} from '@sanity/types'

import {set} from '../../../patch/patch'
import {PatchEvent} from '../../../patch/PatchEvent'
import {type SetCallback} from './types'

export function createSetCallback(options: {
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
}): SetCallback {
  const {block, onChange} = options

  return (givenBlock: PortableTextBlock): void => {
    const patches = [set(givenBlock, [{_key: block._key}])]

    return onChange(PatchEvent.from(patches))
  }
}
