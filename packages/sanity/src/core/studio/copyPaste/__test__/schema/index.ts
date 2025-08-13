import {type Schema} from '@sanity/types'

import {createSchema} from '../../../../schema/createSchema'
import {authorDocument} from './author'
import {bookDocument} from './documents/book'
import {objectsDocument} from './documents/objects'
import {referencesDocument} from './documents/references'
import {editorDocument} from './editor'
import {hotspotDocument} from './hotspot'
import {linkType, myStringObjectType, nestedObjectType} from './objects'
import {postDocument} from './post'
import {pteCustomMarkersDocument} from './pteCustomerMarkers'

export const mockTypes = [
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
  pteCustomMarkersDocument,
  hotspotDocument,
  objectsDocument,
  referencesDocument,
  bookDocument,
]

export const schema = createSchema({
  name: 'default',
  types: mockTypes,
}) as Schema
