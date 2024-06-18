import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {useMemo} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

interface InputStoryProps {
  id?: string
  ptInputProps?: Partial<PortableTextInputProps>
}

export function ToolbarStory(props: InputStoryProps) {
  const {id = 'root', ptInputProps} = props

  const schemaTypes = useMemo(
    () => [
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
                    ],
                  }),
                ],
              }),
              defineArrayMember({
                name: 'object',
                type: 'object',
                title: 'Object',
                fields: [{type: 'string', name: 'title', title: 'Title'}],
                preview: {
                  select: {
                    title: 'title',
                  },
                },
              }),
              defineArrayMember({
                name: 'objectWithoutTitle',
                type: 'object',
                fields: [{type: 'string', name: 'title', title: 'Title'}],
                preview: {
                  select: {
                    title: 'title',
                  },
                },
              }),
              defineArrayMember({
                name: 'nested',
                type: 'object',
                fields: [
                  defineField({
                    name: 'items',
                    type: 'array',
                    of: [
                      defineArrayMember({
                        name: 'item',
                        type: 'object',
                        fields: [
                          defineField({
                            name: 'deep',
                            type: 'array',
                            of: [
                              defineArrayMember({
                                type: 'block',
                                styles: [
                                  {title: 'Normal', value: 'normal'},
                                  {title: 'H2', value: 'h2'},
                                  {title: 'H3', value: 'h3'},
                                  {title: 'H4', value: 'h4'},
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
              input: (inputProps: InputProps) => {
                const editorProps = {
                  ...inputProps,
                  ...ptInputProps,
                } as PortableTextInputProps
                return inputProps.renderDefault(editorProps)
              },
            },
          }),
        ],
      }),
    ],
    [ptInputProps],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm id={id} />
    </TestWrapper>
  )
}

export default ToolbarStory
