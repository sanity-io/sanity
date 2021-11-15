import {isBlock, isSpan} from '@sanity/types'

type Span = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

type MarkDef = {_key: string; _type: string}

type Block = {
  _type: string
  _key: string
  children: Span[]
  markDefs: MarkDef[]
}

export function isPortableTextArray(blocks: any): blocks is Block[] {
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
