import {type SanityDocument, defineArrayMember, defineField, defineType} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// The root field allows the default decorators, annotations, and lists;
// the cell's block config allows only `strong`, no annotations, no
// lists. Toolbar membership stays field-stable, so the cell's narrower
// config must surface as disabled actions, not missing ones.
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
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
              defineField({type: 'number', name: 'headerRows'}),
              defineField({
                type: 'array',
                name: 'rows',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'row',
                    fields: [
                      defineField({
                        type: 'array',
                        name: 'cells',
                        of: [
                          defineArrayMember({
                            type: 'object',
                            name: 'cell',
                            fields: [
                              defineField({
                                type: 'array',
                                name: 'value',
                                of: [
                                  defineArrayMember({
                                    type: 'block',
                                    styles: [{title: 'Normal', value: 'normal'}],
                                    lists: [],
                                    marks: {
                                      decorators: [{title: 'Strong', value: 'strong'}],
                                      annotations: [],
                                    },
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
            ],
          }),
        ],
        components: {
          portableText: {
            plugins: (props) =>
              props.renderDefault({
                ...props,
                plugins: {
                  ...props.plugins,
                  table: {enabled: true},
                },
              }),
          },
        },
      }),
    ],
  }),
]

export function ToolbarApplicableSchemaStory(props: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} />
    </TestWrapper>
  )
}
