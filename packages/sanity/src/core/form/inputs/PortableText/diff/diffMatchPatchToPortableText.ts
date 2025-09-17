import {type DiffMatchPatch} from '@portabletext/patches'
import {applyPatches, parsePatch} from '@sanity/diff-match-patch'
import {type PortableTextBlock, type PortableTextObject} from '@sanity/types'

/**
 * Given a patch targeting a Portable Text span, this function constructs a Portable Text block
 * reflecting the effect of applying that patch to an empty string.
 *
 * This can be used to create an optimistic representation of a newly inserted block.
 *
 * The technique used is fairly naive, but sufficient for constructing a value for the purpose of
 * optimistic diffing.
 */
export function diffMatchPatchToPortableText({
  path,
  value,
}: DiffMatchPatch): PortableTextBlock | undefined {
  const block = path.reduceRight<Partial<PortableTextObject>>((portableText, segment, index) => {
    if (index === path.length - 1 && segment !== 'text') {
      throw new Error('Patch path must terminate at Portable Text text field')
    }

    if (segment === 'text') {
      return {
        _type: 'span',
        text: applyPatches(parsePatch(value), '')[0],
      }
    }

    if (segment === 'children') {
      return {
        _type: 'block',
        children: [portableText],
      }
    }

    if (typeof segment === 'object' && segment !== null) {
      if (!('_key' in segment)) {
        throw new Error('Expected `_key` in path segment')
      }

      portableText._key = segment._key
      return portableText
    }

    throw new Error('Unexepected path segment')
  }, {})

  // If the path was successfully traversed (right-to-left) and ultimately resulted in a top-level
  // object of `_type: "block"`, assume that the produced object is a valid `PortableTextBlock`.
  //
  // This would be safer using a proper type guard, but `isPortableTextBlock` has some difficulties
  // handling the `Partial<PortableTextObject>` type.
  if (block._type === 'block') {
    return block as PortableTextBlock
  }

  return undefined
}
