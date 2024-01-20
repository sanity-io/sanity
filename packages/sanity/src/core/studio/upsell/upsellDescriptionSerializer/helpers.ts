import {
  isPortableTextTextBlock,
  type PortableTextBlock,
  type PortableTextObject,
  type PortableTextSpan,
} from '@sanity/types'

const TRANSFORMATIONS: {
  [type: string]: (
    child: PortableTextObject | PortableTextSpan,
    idx: number,
    block: PortableTextBlock,
  ) => PortableTextObject
} = {
  inlineIcon: (child, idx, block) => {
    if (!isPortableTextTextBlock(block)) return block
    const hasTextLeft = Boolean(
      block.children[idx - 1]?._type === 'span' && block.children[idx - 1]?.text,
    )
    const hasTextRight = Boolean(
      block.children[idx + 1]?._type === 'span' && block.children[idx + 1]?.text,
    )
    return {
      ...child,
      hasTextRight,
      hasTextLeft,
    }
  },
}

export const transformBlocks = (blocks: PortableTextBlock[]): PortableTextBlock[] => {
  return blocks.map((block) => {
    if (isPortableTextTextBlock(block) && block._type === 'block') {
      const children = block.children.map((child, idx) => {
        if (TRANSFORMATIONS[child._type]) {
          return TRANSFORMATIONS[child._type](child, idx, block)
        }
        return child
      })

      return {
        ...block,
        children,
      }
    }
    return block
  })
}
