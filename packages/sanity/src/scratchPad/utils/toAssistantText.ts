import {
  PortableTextBlock,
  PortableTextChild,
  isPortableTextSpan,
  isPortableTextTextBlock,
} from '@sanity/types'

export const fragmentToAssistantText = (fragment: PortableTextBlock[] | undefined): string => {
  if (!fragment) {
    return ''
  }
  return fragment
    .map((block) => {
      if (isPortableTextTextBlock(block)) {
        return block.children
          .map((child: PortableTextChild) => {
            if (isPortableTextSpan(child)) {
              return child.text
            }
            return `[${child._type || 'Object'}]`
          })
          .join('')
      }
      return `[${block._type || 'Object'}]`
    })
    .join('\n\n')
}
