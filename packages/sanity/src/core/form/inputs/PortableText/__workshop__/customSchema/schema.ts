import {Rule} from '@sanity/types'
import {createSchema} from '../../../../../schema'

interface PTBlockValue {
  _type: 'block'
  _key: string
  children?: {_type: string; _key: string; text?: string}[]
}

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
    // modal: {type: 'dialog', width: 'auto'},
    modal: {
      type: 'dialog',
      size: 'full',
    },
  },

  fields: [{type: 'string', name: 'title'}],
}

function extractTextFromBlocks(blocks: PTBlockValue[]) {
  if (!blocks) {
    return ''
  }
  return blocks
    .filter((val) => val._type === 'block')
    .map((block) => {
      return (block.children || [])
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
      .custom((block: PTBlockValue): any => {
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
