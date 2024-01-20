import {isElement} from '../../../../src/HtmlDeserializer/helpers'
import defaultSchema from '../../../fixtures/defaultSchema'
import {type BlockTestFn} from '../types'

const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((field: any) => field.name === 'body').type

const testFn: BlockTestFn = (html, blockTools, commonOptions) => {
  return blockTools.htmlToBlocks(html, blockContentType, {
    ...commonOptions,
    rules: [
      {
        // Special case for code blocks (wrapped in pre and code tag)
        deserialize(el, next, block) {
          if (!isElement(el) || el.tagName.toLowerCase() !== 'pre') {
            return undefined
          }
          const code = el.children[0]
          const childNodes =
            code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
          let text = ''
          childNodes.forEach((node) => {
            text += node.textContent
          })
          return block({
            _type: 'code',
            language: 'javascript',
            code: text,
          })
        },
      },
    ],
  })
}

export default testFn
