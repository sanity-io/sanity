import {defineArrayMember, defineField, defineType} from '@sanity/types'
import React from 'react'
import {TestWrapper} from '../../utils/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
          }),
        ],
      }),
    ],
  }),
]

export function InputStory() {
  return <TestWrapper schemaTypes={SCHEMA_TYPES} />
}

export default InputStory
