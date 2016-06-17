//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  name: 'blocks',
  types: [
    {
      name: 'document',
      type: 'object',
      fields: [
        {
          name: 'content',
          title: 'Content / blocks',
          type: 'array',
          editor: 'prosemirror',
          of: [
            {
              type: 'paragraph',
              title: 'Paragraph'
            },
            {
              type: 'latlon',
              title: 'Lat lon'
            }
          ]
        }
      ]
    },
    {
      name: 'latlon',
      type: 'object',
      fields: [
        {
          name: 'lat',
          type: 'number'
        },
        {
          name: 'lon',
          type: 'number'
        }
      ]
    },
    {
      name: 'paragraph',
      type: 'object',
      fields: [
        {
          name: 'content',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'type',
                  type: 'string'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
