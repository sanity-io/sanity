import {defineArrayMember, defineField, defineType} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

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

export function AnnotationsStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}
