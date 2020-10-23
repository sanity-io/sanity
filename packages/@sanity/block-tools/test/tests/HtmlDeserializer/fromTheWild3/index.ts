import defaultSchema from '../../../fixtures/defaultSchema'

const blockContentType = defaultSchema.get('blogPost').fields.find((field) => field.name === 'body')
  .type

export default (html, blockTools, commonOptions) => {
  return blockTools.htmlToBlocks(html, blockContentType, {
    ...commonOptions,
    rules: [
      {
        // Special case for pictures
        deserialize(el, next, block) {
          if (el.tagName.toLowerCase() !== 'picture') {
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
