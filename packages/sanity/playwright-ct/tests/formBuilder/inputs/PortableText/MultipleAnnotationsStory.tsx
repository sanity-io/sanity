import {ColorWheelIcon} from '@sanity/icons'
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
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
            marks: {
              annotations: [
                {
                  type: 'object',
                  name: 'link',
                  title: 'Link',
                  fields: [
                    defineField({
                      type: 'string',
                      name: 'href',
                      title: 'Link',
                    }),
                  ],
                },
                {
                  type: 'object',
                  name: 'highlight',
                  title: 'Highlight',
                  icon: ColorWheelIcon,
                  fields: [
                    defineField({
                      type: 'string',
                      name: 'color',
                      title: 'Color',
                    }),
                  ],
                },
              ],
            },
          }),
        ],
      }),
    ],
  }),
]

export function MultipleAnnotationsStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

export default MultipleAnnotationsStory
