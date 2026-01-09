import {type PortableTextObject} from '@portabletext/editor'
import {type PortableTextBlock} from '@portabletext/react'
import {isPortableTextBlock} from '@portabletext/toolkit'

/**
 * Unpackage a primitive string field value from a Portable Text value.
 *
 * The primitive string must be stored at the path
 * `[{_key: 'root'}, 'children', {_key: 'root'}]`.
 *
 * @internal
 */
export function unpackageValue(value: (PortableTextBlock | PortableTextObject)[] = []): string {
  return (
    value
      .filter((block) => isPortableTextBlock(block))
      .find(({_key}) => _key === 'root')
      ?.children?.find(({_key}) => _key === 'root')?.text ?? ''
  )
}
