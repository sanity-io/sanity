import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'

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
            of: [
              defineArrayMember({
                type: 'object',
                title: 'Inline Object',
                fields: [
                  defineField({
                    type: 'string',
                    name: 'title',
                    title: 'Title',
                  }),
                  defineField({
                    type: 'array',
                    name: 'caption',
                    title: 'Caption',
                    of: [{type: 'block'}],
                  }),
                ],
                components: {
                  input: (inputProps) => {
                    return (
                      <div data-testid="inlinePopover">{inputProps.renderDefault(inputProps)}</div>
                    )
                  },
                },
              }),
            ],
          }),
          defineArrayMember({
            type: 'object',
            name: 'nestedObjectBlock',
            title: 'Nested Object Block',
            fields: [
              defineField({
                type: 'array',
                name: 'siteOverrides',
                title: 'Site overrides',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'siteOverride',
                    fields: [
                      defineField({
                        type: 'array',
                        name: 'content',
                        title: 'Content',
                        of: [
                          {
                            type: 'block',
                            marks: {
                              annotations: [
                                {
                                  type: 'object',
                                  name: 'nestedAnnotation',
                                  title: 'Nested annotation',
                                  fields: [
                                    defineField({
                                      type: 'string',
                                      name: 'value',
                                      title: 'Annotation value',
                                    }),
                                  ],
                                },
                              ],
                            },
                          },
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
]

function NestedInputStory({document, focusPath}: {document?: SanityDocument; focusPath?: Path}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} />
    </TestWrapper>
  )
}

export default NestedInputStory
