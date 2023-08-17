import type {PortableTextTextBlock, PortableTextSpan, PortableTextObject} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && (typeof value == 'object' || typeof value == 'function')
}

/**
 * Assert that a given object is a portable-text text-block type object
 *
 * @remarks
 * * The `markDefs` and `style` property of a block is optional.
 * * Block types can be named, so expect anything of the _type property.
 *
 * @alpha
 */
export function isPortableTextTextBlock<T = PortableTextSpan | PortableTextObject>(
  value: unknown,
): value is PortableTextTextBlock<T> {
  return (
    isRecord(value) &&
    typeof value._type === 'string' && // block types can be named, so expect anything here.
    Array.isArray(value.children) &&
    value.children.every((child) => isRecord(child)) &&
    ('markDefs' in value // optional property
      ? Array.isArray(value.markDefs) && value.markDefs.every((def) => isRecord(def))
      : false) &&
    ('style' in value ? typeof value.style === 'string' : true) // optional property
  )
}

/**
 * Assert that a given object is a portable-text span-type object
 *
 * @remarks
 * The `marks` property of a block is optional.
 *
 * @alpha
 */
export function isPortableTextSpan(value: unknown): value is PortableTextSpan {
  return (
    isRecord(value) &&
    value._type === 'span' &&
    typeof value.text === 'string' &&
    ('marks' in value // optional property
      ? Array.isArray(value.marks) && value.marks.every((mark) => typeof mark === 'string')
      : true)
  )
}

/**
 * Assert that a given object is a portable-text list-text-block-type object
 *
 * @remarks
 * Uses `isPortableTextTextBlock` and checks for `listItem` and `level`
 *
 * @see isPortableTextTextBlock
 *
 * @alpha
 */
export function isPortableTextListBlock<T = PortableTextSpan | PortableTextObject>(
  value: unknown,
): value is PortableTextTextBlock<T> {
  return (
    isPortableTextTextBlock(value) &&
    'listItem' in value &&
    typeof value.listItem === 'string' &&
    'level' in value &&
    Number.isInteger(value.level)
  )
}
