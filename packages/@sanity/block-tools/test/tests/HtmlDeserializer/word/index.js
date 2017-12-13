import wordSchema from '../../../fixtures/wordSchema'
const blockContentType = wordSchema.get('blogPost')
  .fields.find(field => field.name === 'body').type

export default (html, blockTools, commonOptions) => {
  const options = {
    ...commonOptions,
    blockContentType
  }
  const result = blockTools.htmlToBlocks(html, options)
  // console.log(JSON.stringify(result, null, 2))
  return result
}
