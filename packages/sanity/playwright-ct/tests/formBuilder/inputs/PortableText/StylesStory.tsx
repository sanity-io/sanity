import {defineArrayMember, defineField, defineType} from '@sanity/types'
import React from 'react'
import {TestWrapper} from '../../utils/TestWrapper'
import {TestForm} from '../../utils/TestForm'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'defaultStyles',
        of: [
          defineArrayMember({
            type: 'block',
          }),
        ],
      }),
      defineField({
        type: 'array',
        name: 'oneStyle',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [{title: 'Normal', value: 'normal'}],
          }),
        ],
      }),
    ],
  }),
]
export function StylesStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

export default StylesStory
