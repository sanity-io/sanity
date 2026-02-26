import {toPlainText} from '@portabletext/react'
import {type PortableTextBlock} from '@sanity/types'
import {randomKey} from '@sanity/util/content'

import {type ReleaseDescription, isStringDescription} from '../types/releaseDescription'

export function stringToPTE(text: string): PortableTextBlock[] {
  if (!text.trim()) return []

  return text.split('\n').map((line) => ({
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

export function pteToString(blocks: PortableTextBlock[]): string {
  if (blocks.length === 0) return ''

  try {
    return toPlainText(blocks)
  } catch (error) {
    console.warn('Could not convert portable text blocks to string:', error)
    return ''
  }
}

export function normalizeDescriptionToPTE(
  description: ReleaseDescription | undefined,
): PortableTextBlock[] {
  if (!description) return []
  if (isStringDescription(description)) return stringToPTE(description)
  return description
}

function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\n+/g, '\n')
}

export function areDescriptionsEquivalent(
  a: ReleaseDescription | undefined,
  b: ReleaseDescription | undefined,
): boolean {
  if (a === b) return true

  const textA = isStringDescription(a) ? a : pteToString(a ?? [])
  const textB = isStringDescription(b) ? b : pteToString(b ?? [])

  return normalizeWhitespace(textA) === normalizeWhitespace(textB)
}
