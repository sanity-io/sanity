import {type PortableTextMarkdownBlock} from './portabletext-markdown/types'

// Neither the changelog `contents` nor the docs article schema accepts
// `_type: "callout"` blocks; unwrap them so the inner content survives.
// GFM alert content comes styled as `blockquote` (each `>` line inherits the
// style), which the changelog block schema also rejects - coerce to `normal`.
export function flattenCallouts(blocks: PortableTextMarkdownBlock[]): PortableTextMarkdownBlock[] {
  return blocks.flatMap<PortableTextMarkdownBlock>((block) =>
    block._type === 'callout' ? block.content.map(resetBlockquoteStyle) : [block],
  )
}

function resetBlockquoteStyle(block: PortableTextMarkdownBlock): PortableTextMarkdownBlock {
  if (block._type !== 'block' || block.style !== 'blockquote') return block
  return {...block, style: 'normal'}
}
