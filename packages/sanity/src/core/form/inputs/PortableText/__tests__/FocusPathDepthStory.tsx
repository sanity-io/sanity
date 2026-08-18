import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// A table-enabled field whose cells hold spans and inline objects, for
// pinning the focus-path span suffix (`.text`) at container depth.
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
                                    of: [
                                      defineArrayMember({
                                        type: 'object',
                                        name: 'inlineNote',
                                        title: 'Inline note',
                                        fields: [
                                          defineField({
                                            type: 'string',
                                            name: 'note',
                                          }),
                                        ],
                                        preview: {select: {title: 'note'}},
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

export function FocusPathDepthStory(props: {
  document?: SanityDocument
  onPathFocus?: (path: Path) => void
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} onPathFocus={props.onPathFocus} />
    </TestWrapper>
  )
}
