//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default [
  {
    'name': 'document',
    'type': 'object',
    'fields': [
      {
        'name': 'content',
        'type': 'blocks',
        'title': 'Content'
      }
    ]
  },
  {
    'name': 'blocks',
    'type': 'array',
    'of': [
      {
        'type': 'paragraph'
      },
      {
        'type': 'latlon'
      }
    ]
  },
  {
    'name': 'latlon',
    'type': 'object',
    'fields': [
      {
        'name': 'lat',
        'type': 'number'
      },
      {
        'name': 'lon',
        'type': 'number'
      }
    ]
  },
  {
    'name': 'paragraph',
    'type': 'object',
    'fields': [
      {
        'name': 'content',
        'type': 'array',
        'of': [
          {
            'type': 'object',
            'fields': {
              'type': {
                'type': 'string'
              }
            }
          }
        ]
      }
    ]
  }
]
