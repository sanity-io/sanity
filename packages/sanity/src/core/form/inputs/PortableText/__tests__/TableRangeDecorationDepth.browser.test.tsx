import {type RangeDecoration} from '@portabletext/editor'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
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

function TableRangeDecorationDepthHarness(props: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} />
    </TestWrapper>
  )
}

const {render} = await import('vitest-browser-react')

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'b0',
      children: [{_type: 'span', _key: 'b0-s', text: 'root decorated here', marks: []}],
      markDefs: [],
      style: 'normal',
    },
    {
      _type: 'table',
      _key: 't0',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r0',
          cells: [
            {
              _type: 'cell',
              _key: 'c0',
              value: [
                {
                  _type: 'block',
                  _key: 'cb0',
                  children: [
                    {_type: 'span', _key: 'cb0-s', text: 'cell decorated here', marks: []},
                  ],
                  markDefs: [],
                  style: 'normal',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('Portable Text Input - range decorations at depth', () => {
  it('decorates ranges at the root and inside table cells alike', async () => {
    const {getFocusedPortableTextEditor} = testHelpers()

    void render(<TableRangeDecorationDepthHarness document={document} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('cell decorated here')

    await expect.poll(() => decorations().length).toBe(2)
    expect(decorations()).toEqual([
      {text: 'decorated', insideTable: false},
      {text: 'decorated', insideTable: true},
    ])
  })
})

function decorations() {
  return [...window.document.querySelectorAll('[data-testid="probe-decoration"]')].map((node) => ({
    text: node.textContent,
    insideTable: node.closest('table') !== null,
  }))
}
