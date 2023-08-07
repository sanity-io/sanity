import {defineField, defineType} from '@sanity/types'
import React from 'react'
import {TestWrapper} from './utils/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [{type: 'string'}],
        options: {layout: 'tags'},
      }),
    ],
  }),
]

export function ArrayInputStory() {
  return <TestWrapper schemaTypes={SCHEMA_TYPES} />
}

export default ArrayInputStory
