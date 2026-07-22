import {type PortableTextMarkdownBlock} from './portabletext-markdown/types'

// Neither the changelog `contents` nor the docs article schema accepts
// `_type: "callout"` blocks; unwrap them so the inner content survives.
export function flattenCallouts(blocks: PortableTextMarkdownBlock[]): PortableTextMarkdownBlock[] {
  return blocks.flatMap<PortableTextMarkdownBlock>((block) =>
    block._type === 'callout' ? block.content : [block],
  )
}
