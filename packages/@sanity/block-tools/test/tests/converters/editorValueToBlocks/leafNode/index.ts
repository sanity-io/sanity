import defaultSchema from '../../../../fixtures/defaultSchema'

const blockContentType = defaultSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

export default (slateJsonToBlocks, input) => {
  return slateJsonToBlocks(input, blockContentType)
}
