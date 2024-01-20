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
        // Special case for pictures
        deserialize(el, next, block) {
          if (!isElement(el) || el.tagName.toLowerCase() !== 'picture') {
            return undefined
          }
          return block({
            _type: 'image',
            _sanityAsset: 'image@<url>',
          })
        },
      },
    ],
  })
}

export default testFn
