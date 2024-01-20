import customSchema from '../../../fixtures/customSchema'
import {type BlockTestFn} from '../types'

const blockContentType = customSchema
  .get('blogPost')
  .fields.find((field: any) => field.name === 'body').type

const testFn: BlockTestFn = (html, blockTools, commonOptions) => {
  return blockTools.htmlToBlocks(html, blockContentType, commonOptions)
}

export default testFn
