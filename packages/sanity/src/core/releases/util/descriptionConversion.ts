import {toPlainText} from '@portabletext/react'
import {type PortableTextBlock} from '@sanity/types'
import {randomKey} from '@sanity/util/content'

import {type ReleaseDescription, isPTEDescription, isStringDescription} from '../types/releaseDescription'

/**
 * Convert a plain text string to Portable Text blocks.
 * Each line becomes a separate paragraph block.
 *
 * @param text - Plain text string to convert
 * @returns Array of Portable Text blocks
 */
export function stringToPTE(text: string): PortableTextBlock[] {
  if (!text || text.trim() === '') {
    return []
  }

  // Split by newlines to preserve paragraph structure
  const lines = text.split('\n')

  return lines.map((line) => ({
    _type: 'block',
    _key: randomKey(12),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: randomKey(12),
        text: line,
        marks: [],
      },
    ],
  }))
}

/**
 * Convert Portable Text blocks to plain text string.
 * Useful for backwards compatibility and search/export scenarios.
 *
 * @param blocks - Array of Portable Text blocks
 * @returns Plain text string
 */
export function pteToString(blocks: PortableTextBlock[]): string {
  if (!blocks || blocks.length === 0) {
    return ''
  }

  try {
    return toPlainText(blocks)
  } catch (error) {
    console.warn('Failed to convert PTE to string', error)
    return ''
  }
}

/**
 * Normalize description to PTE format for UI rendering.
 * This is the main entry point for view-time conversion.
 * Strings are converted to PTE format in memory without modifying the source.
 *
 * @param description - Release description in either format
 * @returns Portable Text blocks ready for rendering
 */
export function normalizeDescriptionToPTE(
  description: ReleaseDescription | undefined,
): PortableTextBlock[] {
  if (!description) {
    return []
  }

  if (isStringDescription(description)) {
    return stringToPTE(description)
  }

  if (isPTEDescription(description)) {
    return description
  }

  return []
}

/**
 * Check if two descriptions are semantically equivalent.
 * Useful for detecting actual content changes vs format conversions.
 *
 * @param a - First description
 * @param b - Second description
 * @returns True if descriptions have the same text content
 */
export function areDescriptionsEquivalent(
  a: ReleaseDescription | undefined,
  b: ReleaseDescription | undefined,
): boolean {
  if (a === b) return true
  if (!a && !b) return true
  if (!a || !b) return false

  const textA = isStringDescription(a) ? a : pteToString(a)
  const textB = isStringDescription(b) ? b : pteToString(b)

  return textA.trim() === textB.trim()
}
