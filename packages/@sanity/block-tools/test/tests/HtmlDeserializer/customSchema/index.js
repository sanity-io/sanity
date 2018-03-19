import customSchema from '../../../fixtures/customSchema'

const blockContentType = customSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

export default (html, blockTools, commonOptions) => {
  return blockTools.htmlToBlocks(html, blockContentType, commonOptions)
}
