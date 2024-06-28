import {type Schema} from '@sanity/types'

import {createSchema} from '../../../../schema'
import {authorDocument} from './author'
import {editorDocument} from './editor'
import {linkType, myStringObjectType, nestedObjectType} from './objects'
import {postDocument} from './post'

export const schema = createSchema({
  name: 'default',
  types: [
    linkType,
    myStringObjectType,
    nestedObjectType,
    {
      name: 'customNamedBlock',
      type: 'block',
      title: 'A named custom block',
      marks: {
        annotations: [linkType, myStringObjectType],
      },
      of: [
        {
          type: 'object',
          name: 'test',
          fields: [myStringObjectType],
        },
        {
          type: 'reference',
          name: 'strongAuthorRef',
          title: 'A strong author ref',
          to: {type: 'author'},
        },
      ],
    },
    authorDocument,
    editorDocument,
    postDocument,
  ],
}) as Schema
