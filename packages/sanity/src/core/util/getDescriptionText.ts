import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'

export function getDescriptionText(description: unknown): string {
  if (typeof description === 'string') return description
  if (Array.isArray(description) && description.every(isPortableTextBlock)) {
    return toPlainText(description)
  }
  return ''
}
