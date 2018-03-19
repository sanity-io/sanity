import defaultSchema from '../../../../fixtures/defaultSchema'

const blockContentType = defaultSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

export default (blockToSlateState, input) => {
  const result = blockToSlateState(input, blockContentType)
  // console.log(JSON.stringify(result))
  return result
}
