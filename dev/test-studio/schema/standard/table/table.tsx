import {defineType} from '@sanity/types'

import {defineTable} from './defineTable'

export default defineType({
  name: 'rowedTable',
  title: 'Table',
  type: 'document',
  fields: [
    defineTable([
      {type: 'string', name: 'stringCell', title: 'String'},
      {type: 'slug', name: 'slugCell', title: 'Slug'},
      {type: 'date', name: 'dateCell', title: 'Date'},
      {type: 'reference', to: [{type: 'author'}], name: 'referenceCell', title: 'Author reference'},
      {
        type: 'object',
        name: 'objectCell',
        title: 'Name',
        fields: [
          {
            type: 'string',
            name: 'firstName',
            title: 'First Name',
          },
          {
            type: 'string',
            name: 'lastName',
            title: 'Last Name',
          },
        ],
      },
      {
        type: 'array',
        name: 'arrayCell',
        title: 'Array',
        of: [
          {
            type: 'string',
            name: 'stringItem',
            title: 'String Item',
          },
        ],
      },
    ]),
  ],
})
