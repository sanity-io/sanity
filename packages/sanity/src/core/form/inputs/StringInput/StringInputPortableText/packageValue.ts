import {type PortableTextBlock} from '@portabletext/react'
import {type Path} from '@sanity/types'

/**
 * The path at which {@link packageValue} stores the primitive string inside the produced
 * Portable Text value.
 *
 * @internal
 */
export const ROOT_PATH: Path = [{_key: 'root'}, 'children', {_key: 'root'}]

/**
 * Package a primitive string field value into a Portable Text value. This
 * allows the primitive string to be used by a Portable Text Editor instance.
 *
 * The Portable Text value produced stores the primitive string at the path
 * `[{_key: 'root'}, 'children', {_key: 'root'}]`.
 *
 * @internal
 */
export function packageValue(value: string | undefined) {
  return [
    {
      _type: 'block',
      _key: 'root',
      children: [
        {
          _type: 'span',
          _key: 'root',
          text: value ?? '',
        },
      ],
    },
  ] satisfies PortableTextBlock[]
}
