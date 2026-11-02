import {toPlainText} from '@portabletext/toolkit'
import {isPortableTextTextBlock} from '@sanity/types'

// System documents hold untyped JSON, so a stored description can be a string, Portable Text or anything else.
export function getDescriptionText(description: unknown): string {
  if (typeof description === 'string') {
    return description
  }

  if (Array.isArray(description)) {
    return toPlainText(description.filter(isPortableTextTextBlock))
  }

  return ''
}
