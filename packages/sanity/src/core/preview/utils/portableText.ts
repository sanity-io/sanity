import {isPortableTextTextBlock, isPortableTextSpan, PortableTextBlock} from '@sanity/types'

export function isPortableTextPreviewValue(value: unknown): value is PortableTextBlock[] {
  return Array.isArray(value) && (value.length === 0 || value.some(isPortableTextTextBlock))
}

export function extractTextFromBlocks(blocks: unknown): string {
  const firstBlock = Array.isArray(blocks) && blocks.find(isPortableTextTextBlock)
  if (!firstBlock || !firstBlock.children) {
    return ''
  }

  return firstBlock.children
    .filter(isPortableTextSpan)
    .map((span) => span.text)
    .join('')
}
