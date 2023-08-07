import {defineField, defineType} from '@sanity/types'
import React from 'react'
import {TestProvider} from './utils/TestProvider'
import {TestForm} from './utils/TestForm'

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
  return (
    <TestProvider schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestProvider>
  )
}

export default ArrayInputStory
