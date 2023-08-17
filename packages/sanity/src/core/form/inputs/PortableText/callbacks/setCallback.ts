import {normalizeBlock} from '@sanity/block-tools'
import {PortableTextBlock} from '@sanity/types'
import {PatchEvent, set} from '../../../patch'
import {SetCallback} from './types'

export function createSetCallback(options: {
  allowedDecorators: string[]
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
}): SetCallback {
  const {allowedDecorators, block, onChange} = options

  return (givenBlock: PortableTextBlock): void => {
    const patches = [
      set(
        normalizeBlock(givenBlock, {
          allowedDecorators,
        }),

        [{_key: block._key}],
      ),
    ]

    return onChange(PatchEvent.from(patches))
  }
}
