import {BlockTestFn} from '../types'
import defaultSchema from '../../../fixtures/defaultSchema'

const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((field: any) => field.name === 'body').type

const testFn: BlockTestFn = (html, blockTools, commonOptions) => {
  return blockTools.htmlToBlocks(html, blockContentType, commonOptions)
}

export default testFn
