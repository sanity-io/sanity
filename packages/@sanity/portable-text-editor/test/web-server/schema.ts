import {RawType} from '../../src/types/schema'

export const imageType: RawType = {
  type: 'image',
  name: 'blockImage',
}

export const someObject: RawType = {
  type: 'object',
  name: 'someObject',
  fields: [{type: 'string', name: 'color'}],
}

export const blockType: RawType = {
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

export const portableTextType: RawType = {
  type: 'array',
  name: 'body',
  of: [blockType, someObject],
}
