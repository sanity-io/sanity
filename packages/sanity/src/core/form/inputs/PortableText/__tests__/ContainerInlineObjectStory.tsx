import {defineContainer} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type PortableTextPluginsProps} from '../../../types/blockProps'

const container = defineContainer({
  type: 'table',
  arrayField: 'rows',
  render: ({children, attributes}) => (
    <table {...attributes}>
      <tbody>{children}</tbody>
    </table>
  ),
  of: [
    defineContainer({
      type: 'row',
      arrayField: 'cells',
      render: ({children, attributes}) => <tr {...attributes}>{children}</tr>,
      of: [
        defineContainer({
          type: 'cell',
          arrayField: 'content',
          render: ({children, attributes}) => <td {...attributes}>{children}</td>,
        }),
      ],
    }),
  ],
})

function ContainerPlugin(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <NodePlugin nodes={[container]} />
    </>
  )
}

const inlineNote = defineArrayMember({
  type: 'object',
  name: 'inlineNote',
  fields: [defineField({type: 'string', name: 'text'})],
  preview: {select: {title: 'text'}},
})

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({type: 'block', of: [inlineNote]}),
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
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
                                name: 'content',
                                of: [defineArrayMember({type: 'block', of: [inlineNote]})],
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
        components: {portableText: {enableContainers: true, plugins: ContainerPlugin}},
      }),
    ],
  }),
]

const DOCUMENT: SanityDocument = {
  _id: 'test',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'rev',
  body: [
    {
      _type: 'table',
      _key: 'table-0',
      rows: [
        {
          _type: 'row',
          _key: 'row-0',
          cells: [
            {
              _type: 'cell',
              _key: 'cell-0',
              content: [
                {
                  _type: 'block',
                  _key: 'b-0',
                  style: 'normal',
                  markDefs: [],
                  children: [
                    {_type: 'span', _key: 's-0', text: 'Hi ', marks: []},
                    {_type: 'inlineNote', _key: 'inline-0', text: 'CellNote'},
                    {_type: 'span', _key: 's-1', text: '', marks: []},
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export function ContainerInlineObjectStory() {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}
