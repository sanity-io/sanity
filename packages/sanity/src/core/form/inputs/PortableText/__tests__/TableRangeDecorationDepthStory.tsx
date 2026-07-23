import {type RangeDecoration} from '@portabletext/editor'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// Two decorations over the word "decorated", one targeting a root span
// and one targeting a span inside a table cell. Range decorations are
// the channel inline comments and presence cursors render through, so
// this pins the rendering half of both at container depth.
const rangeDecorations: RangeDecoration[] = [
  {
    component: ({children}) => <span data-testid="probe-decoration">{children}</span>,
    selection: {
      anchor: {path: [{_key: 'b0'}, 'children', {_key: 'b0-s'}], offset: 5},
      focus: {path: [{_key: 'b0'}, 'children', {_key: 'b0-s'}], offset: 14},
    },
  },
  {
    component: ({children}) => <span data-testid="probe-decoration">{children}</span>,
    selection: {
      anchor: {
        path: [
          {_key: 't0'},
          'rows',
          {_key: 'r0'},
          'cells',
          {_key: 'c0'},
          'value',
          {_key: 'cb0'},
          'children',
          {_key: 'cb0-s'},
        ],
        offset: 5,
      },
      focus: {
        path: [
          {_key: 't0'},
          'rows',
          {_key: 'r0'},
          'cells',
          {_key: 'c0'},
          'value',
          {_key: 'cb0'},
          'children',
          {_key: 'cb0-s'},
        ],
        offset: 14,
      },
    },
  },
]

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
                                of: [defineArrayMember({type: 'block'})],
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
          // oxlint-disable-next-line no-explicit-any -- probe wrapper injecting an input-level prop
          input: (props: any) => props.renderDefault({...props, rangeDecorations}),
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

export function TableRangeDecorationDepthStory(props: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} />
    </TestWrapper>
  )
}
