import {htmlToBlocks} from '@sanity/block-tools'
import {OnPasteFn} from '@sanity/portable-text-editor'

export function extractTextFromBlocks(blocks: {_type: string; children?: any[]}[]) {
  if (!blocks) {
    return ''
  }
  return blocks
    .filter((val) => val._type === 'block')
    .map((block) => {
      return (block.children || [])
        .filter((child) => child._type === 'span')
        .map((span) => span.text)
        .join('')
    })
    .join('')
}

export const handlePaste: OnPasteFn = (input) => {
  const {event, type, path} = input
  const html = 'clipboardData' in event && (event as any).clipboardData.getData('text/html')
  // check if schema has the code type
  const hasCodeType = type.of?.map(({name}) => name).includes('code')
  if (!hasCodeType) {
    // eslint-disable-next-line no-console
    console.log('Run `sanity install @sanity/code-input, and add `type: "code"` to your schema.')
  }
  if (html && hasCodeType) {
    const blocks = htmlToBlocks(html, type, {
      rules: [
        {
          deserialize(el: any, next: any, block: any) {
            /**
             *  `el` and `next` is DOM Elements
             * learn all about them:
             * https://developer.mozilla.org/en-US/docs/Web/API/Element
             **/

            if (!el || !el.children || (el.tagName && el.tagName.toLowerCase() !== 'pre')) {
              return undefined
            }
            const code = el.children[0]
            const childNodes =
              code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
            let text = ''
            childNodes.forEach((node: any) => {
              text += node.textContent
            })
            /**
             * Return this as an own block (via block helper function),
             * instead of appending it to a default block's children
             */
            return block({
              _type: 'code',
              code: text,
            })
          },
        },
      ],
    })
    // return an insert patch
    return {insert: blocks, path}
  }
  return undefined
}
