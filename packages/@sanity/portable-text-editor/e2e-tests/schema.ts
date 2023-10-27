import {defineType} from '@sanity/types'

export const imageType = {
  type: 'image',
  name: 'blockImage',
}

export const someObject = {
  type: 'object',
  name: 'someObject',
  fields: [{type: 'string', name: 'color'}],
}

export const blockType = {
  type: 'block',
  name: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'H1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'H4', value: 'h4'},
    {title: 'H5', value: 'h5'},
    {title: 'H6', value: 'h6'},
    {title: 'Quote', value: 'blockquote'},
  ],
  of: [someObject],
}

export const portableTextType = defineType({
  type: 'array',
  name: 'body',
  of: [blockType, someObject],
})
