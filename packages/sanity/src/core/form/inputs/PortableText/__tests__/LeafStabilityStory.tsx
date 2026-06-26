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
        name: 'customStyle',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [
              {title: 'Normal', value: 'normal'},
              {
                title: 'Highlight',
                value: 'highlight',
                component: ({children}) => <mark data-testid="highlight-mark">{children}</mark>,
              },
            ],
          }),
        ],
      }),
    ],
  }),
]

export function LeafStabilityStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}
