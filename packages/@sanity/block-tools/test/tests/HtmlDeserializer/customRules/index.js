import defaultSchema from '../../../fixtures/defaultSchema'

const blockContentType = defaultSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

const rules = [
  // Map 'em' tags to 'strong'
  {
    deserialize(el, next) {
      if (el.tagName.toLowerCase() !== 'em') {
        return undefined
      }
      return {
        _type: '__decorator',
        name: 'strong',
        children: next(el.childNodes)
      }
    }
  },
  {
    // Special case for code blocks (wrapped in pre and code tag)
    deserialize(el, next) {
      if (el.tagName.toLowerCase() !== 'pre') {
        return undefined
      }
      const code = el.children[0]
      const childNodes =
        code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
      let text = ''
      childNodes.forEach(node => {
        text += node.textContent
      })
      return {
        _type: 'span',
        marks: ['code'],
        text: text
      }
    }
  },
  {
    deserialize(el, next) {
      if (el.tagName.toLowerCase() !== 'img') {
        return undefined
      }
      const result = [
        {
          _type: 'image',
          src: el.getAttribute('src')
        }
      ]
      if (el.parentNode.tagName.toLowerCase() === 'a') {
        result.push({
          _type: 'span',
          text: 'Image link'
        })
      }
      return result
    }
  }
]

export default (html, blockTools, commonOptions) => {
  const options = {
    ...commonOptions,
    rules
  }
  return blockTools.htmlToBlocks(html, blockContentType, options)
}
