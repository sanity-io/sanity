import {markdownToPortableText as originalMarkdownToPortableText} from '@portabletext/markdown'
import TurndownService from 'turndown'

import {type PortableTextHtml, type PortableTextMarkdownBlock} from './types'

type Options = {
  keyGenerator?: () => string
}
export type NormalizedMarkdownBlock = Exclude<PortableTextMarkdownBlock, PortableTextHtml>

const turndownService = new TurndownService()

// small shim to narrow typing of markdownToPortableText to what it actually returns
export function markdownToPortableText(
  markdown: string,
  // note: original markdownToPortableText takes more options, but we don't use them here
  options?: Options,
) {
  return normalize(
    originalMarkdownToPortableText(markdown, options) as PortableTextMarkdownBlock[],
    options,
  )
}
// Normalizes markdown to portable text by converting html blocks to markdown
export function normalize(
  blocks: PortableTextMarkdownBlock[],
  options?: Options,
): NormalizedMarkdownBlock[] {
  return blocks.flatMap((block) =>
    block._type === 'html'
      ? markdownToPortableText(turndownService.turndown(block.html), options)
      : block,
  )
}
