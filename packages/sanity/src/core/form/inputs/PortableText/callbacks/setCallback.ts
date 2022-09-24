import {normalizeBlock} from '@sanity/block-tools'
import {PortableTextBlock} from '@sanity/portable-text-editor'
import {FormPatch, set} from '../../../patch'
import {SetCallback} from './types'

export function createSetCallback(options: {
  allowedDecorators: string[]
  block: PortableTextBlock
  onChange: (patches: FormPatch[]) => void
}): SetCallback {
  const {allowedDecorators, block, onChange} = options

  return (givenBlock: PortableTextBlock): void => {
    const patches = [
      set(
        normalizeBlock(givenBlock, {
          allowedDecorators,
        }),

        [{_key: block._key}]
      ),
    ]

    return onChange(patches)
  }
}
