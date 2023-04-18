import {PortableTextBlock} from '@sanity/types'
import {PatchEvent, unset} from '../../../patch'
import {UnsetCallback} from './types'

export function createUnsetCallback(options: {
  block: PortableTextBlock
  onChange: (patches: PatchEvent) => void
}): UnsetCallback {
  const {block, onChange} = options

  return (): void => {
    const patches = [unset([{_key: block._key}])]

    return onChange(PatchEvent.from(patches))
  }
}
