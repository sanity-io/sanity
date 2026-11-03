import {toPlainText} from '@portabletext/toolkit'
import {type PortableTextBlock} from '@sanity/types'

import {isRecord} from '../../util/isRecord'

/**
 * Release descriptions are stored as untyped JSON. Studio writes a string, and other clients
 * have written Portable Text. Rendering that value as a React child throws
 * "Objects are not valid as a React child".
 *
 * Strings pass through unchanged. Portable Text becomes the span text, with inline non-span
 * nodes (such as a release reference) left out. Anything else is empty, so a bad value still
 * cannot crash the page.
 *
 * @internal
 */
export function getReleaseDescriptionText(description: unknown): string {
  if (typeof description === 'string') return description

  const blocks = readBlocks(description)
  if (!blocks || blocks.length === 0) return ''

  try {
    return toPlainText(blocks).trim()
  } catch {
    return ''
  }
}

function readBlocks(description: unknown): PortableTextBlock[] | undefined {
  if (Array.isArray(description)) return description.filter(isBlockLike)
  return isBlockLike(description) ? [description] : undefined
}

function isBlockLike(value: unknown): value is PortableTextBlock {
  return isRecord(value) && typeof value._type === 'string' && Array.isArray(value.children)
}
