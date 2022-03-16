import {createSchema} from '@sanity/base/schema'
import {Rule} from '@sanity/types'

const imageType = {
  type: 'image',
  name: 'blockImage',
}

const linkType = {
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
    },
  ],
}

const someAnnotationType = {
  type: 'object',
  name: 'someAnnotation',
  options: {
    modal: {
      size: 'medium',
    },
  },
  fields: [{type: 'string', name: 'title'}],
}

const someObject = {
  type: 'object',
  name: 'someObject',
  options: {
    // editModal: 'fullscreen',
    modal: {
      type: 'dialog',
      size: 'full',
    },
  },
  fields: [{type: 'string', name: 'title'}],
}

function extractTextFromBlocks(blocks) {
  if (!blocks) {
    return ''
  }
  return blocks
    .filter((val) => val._type === 'block')
    .map((block) => {
      return block.children
        .filter((child) => child._type === 'span')
        .map((span) => span.text)
        .join('')
    })
    .join('')
}

export const blockType = {
  type: 'block',
  name: 'myBlockType',
  styles: [
    {title: 'Paragraph', value: 'normal'},
    {title: 'Heading 1', value: 'h1'},
    {title: 'Heading 2', value: 'h2'},
    {title: 'Heading 3', value: 'h3'},
    {title: 'Heading 4', value: 'h4'},
    {title: 'Heading 5', value: 'h5'},
    {title: 'Heading 6', value: 'h6'},
    {title: 'Quotation', value: 'blockquote'},
  ],
  marks: {
    annotations: [someAnnotationType, linkType],
  },
  of: [someObject, imageType],
  validation: (rule: Rule) =>
    rule
      .custom((block) => {
        const length = extractTextFromBlocks([block]).length
        return length < 10 ? 'Please write a longer paragraph.' : null
      })
      .error(),
}

const ptType = {
  type: 'array',
  name: 'body',
  of: [blockType, someObject, imageType],
}

export const schema = createSchema({
  name: 'default',
  types: [imageType, someObject, ptType],
})

export const portableTextType = schema.get('body')
