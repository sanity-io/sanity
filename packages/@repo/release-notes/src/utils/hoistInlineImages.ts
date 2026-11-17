import {type PortableTextBlock} from './portabletext-markdown/types'

type Span = Extract<PortableTextBlock['children'][number], {_type: 'span'}>
type InlineImage = Extract<PortableTextBlock['children'][number], {_type: 'image'}>

/**
 * The changelog schemas on sanity.io only allow spans inside a text block, but
 * markdown puts an image that shares a paragraph with text (or with other
 * images, as in the badge rows some tools append to a PR) inline. This moves
 * every inline image out to its own block-level image, splitting the text
 * around it into separate blocks, and drops any other inline object. Text
 * segments that are only whitespace are dropped, and each remaining segment
 * keeps only the mark definitions its spans still reference.
 */
export function hoistInlineImages<Block extends PortableTextBlock>(
  block: Block,
): (Block | InlineImage)[] {
  if (block.children.every((child) => child._type === 'span')) {
    return [block]
  }

  const result: (Block | InlineImage)[] = []
  let spans: Span[] = []

  const flushSpans = () => {
    if (spans.some((span) => span.text.trim() !== '')) {
      const marks = new Set<string>(spans.flatMap((span) => span.marks ?? []))
      result.push({
        ...block,
        _key: result.length === 0 ? block._key : `${block._key}-${result.length}`,
        children: spans,
        markDefs: block.markDefs.filter((markDef) => marks.has(markDef._key)),
      })
    }
    spans = []
  }

  for (const child of block.children) {
    if (child._type === 'span') {
      spans.push(child)
      continue
    }
    flushSpans()
    if (child._type === 'image') {
      result.push(child)
    }
  }
  flushSpans()

  return result
}
