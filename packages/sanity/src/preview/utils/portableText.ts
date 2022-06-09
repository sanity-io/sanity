import {Block, isBlock, isSpan} from '@sanity/types'

export function isPortableTextArray(blocks: unknown): blocks is Block[] {
  return Array.isArray(blocks) && (blocks.length === 0 || blocks.some(isBlock))
}

export function extractTextFromBlocks(blocks: Block[]): string {
  const firstBlock = blocks.find(isBlock)
  if (!firstBlock || !firstBlock.children) {
    return ''
  }

  return firstBlock.children
    .filter(isSpan)
    .map((span) => span.text)
    .join('')
}
