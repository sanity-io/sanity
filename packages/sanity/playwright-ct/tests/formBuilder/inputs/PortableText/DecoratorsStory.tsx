import {BulbOutlineIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from '@sanity/types'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'defaultDecorators',
        of: [
          defineArrayMember({
            type: 'block',
          }),
        ],
      }),
      defineField({
        type: 'array',
        name: 'customDecorator',
        of: [
          defineArrayMember({
            type: 'block',
            marks: {
              decorators: [{title: 'Highlight', value: 'highlight', icon: BulbOutlineIcon}],
            },
          }),
        ],
      }),
    ],
  }),
]

export function DecoratorsStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

export default DecoratorsStory
