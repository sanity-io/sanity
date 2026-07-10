import {defineContainer} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {type SanityDocument} from '@sanity/client'
import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'
import {type PortableTextPluginsProps} from 'sanity'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const CONTAINER_NODES = [
  defineContainer({
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
  }),
]

function ContainerPlugins(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <NodePlugin nodes={CONTAINER_NODES} />
    </>
  )
}

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
                name: 'inlineObjectWithTextProperty',
                fields: [
                  defineField({
                    type: 'string',
                    name: 'text',
                    components: {
                      input: (inputProps) => (
                        <div data-testid="inlineTextInputField">
                          {inputProps.renderDefault(inputProps)}
                        </div>
                      ),
                    },
                  }),
                ],
              }),
            ],
          }),
          defineArrayMember({
            type: 'object',
            name: 'testObjectBlock',
            fields: [{type: 'string', name: 'text'}],
            components: {
              input: (inputProps) => (
                <div data-testid="objectBlockInputField">
                  {inputProps.renderDefault(inputProps)}
                </div>
              ),
            },
          }),
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
                                of: [
                                  defineArrayMember({type: 'block'}),
                                  defineArrayMember({
                                    type: 'object',
                                    name: 'cellObjectBlock',
                                    fields: [{type: 'string', name: 'text'}],
                                    components: {
                                      input: (inputProps) => (
                                        <div data-testid="cellObjectBlockInputField">
                                          {inputProps.renderDefault(inputProps)}
                                        </div>
                                      ),
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
            plugins: ContainerPlugins,
          },
        },
      }),
    ],
  }),
]

function FocusTrackingStory({
  focusPath,
  onPathFocus,
  document,
}: {
  focusPath?: Path
  onPathFocus?: (path: Path) => void
  document?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} onPathFocus={onPathFocus} />
    </TestWrapper>
  )
}

export default FocusTrackingStory
