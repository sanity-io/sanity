import Schema from '@sanity/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {baseTypes} from '../_common/baseTypes'

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

const someObject = {
  type: 'object',
  name: 'someObject',
  options: {
    editModal: 'fullscreen',
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
    annotations: [someObject, linkType],
  },
  of: [someObject, imageType],
  validation: (Rule) =>
    Rule.custom((block) => {
      const length = extractTextFromBlocks([block]).length
      return length < 10 ? 'Please write a longer paragraph.' : false
    }).error(),
}

const ptType = {
  type: 'array',
  name: 'body',
  of: [blockType, someObject, imageType],
}

export const schema = Schema.compile({
  name: 'default',
  types: schemaTypes.concat([imageType, someObject, ptType]).concat(baseTypes),
})

export const portableTextType = schema.get('body')
