import {type PortableTextBlock} from '@portabletext/react'

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
