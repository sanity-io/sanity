import {PortableTextBlock} from '@sanity/types'
import {FormPatch, unset} from '../../../patch'
import {UnsetCallback} from './types'

export function createUnsetCallback(options: {
  block: PortableTextBlock
  onChange: (patches: FormPatch[]) => void
}): UnsetCallback {
  const {block, onChange} = options

  return (): void => {
    const patches = [unset([{_key: block._key}])]

    return onChange(patches)
  }
}
