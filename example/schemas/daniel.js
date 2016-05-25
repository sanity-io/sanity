//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  name: 'daniel',
  types: {
    document: {
      type: 'object',
      fields: {
        content: {
          type: 'blocks',
          title: 'Content'
        }
      }
    },
    blocks: {
      type: 'array',
      of: [
        {type: 'paragraph'},
        {type: 'latlon'}
      ]
    },
    latlon: {
      type: 'object',
      fields: {
        lat: {type: 'number'},
        lon: {type: 'number'},
      }
    },
    paragraph: {
      type: 'object',
      fields: {
        content: {
          type: 'array',
          of: [
            {
              type: 'object',
              fields: {
                type: {type: 'string'}
              }
            }
          ]
        }
      }
    }
  }
}
