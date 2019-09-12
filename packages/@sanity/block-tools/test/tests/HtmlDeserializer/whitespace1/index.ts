import defaultSchema from '../../../fixtures/defaultSchema'

const blockContentType = defaultSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

export default (html, blockTools, commonOptions) => {
  return blockTools.htmlToBlocks(html, blockContentType, commonOptions)
}
