import {type PortableTextEditor} from '@portabletext/editor'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {useMemo} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

interface InputStoryProps {
  editorRef?: React.Ref<PortableTextEditor | null>
  ptInputProps?: Partial<PortableTextInputProps>
}

export function InputStory(props: InputStoryProps) {
  const {editorRef, ptInputProps} = props

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
              }),
            ],
            components: {
              input: (inputProps: InputProps) => {
                const editorProps = {
                  ...inputProps,
                  ...ptInputProps,
                  editorRef,
                } as PortableTextInputProps
                return (
                  <div data-testid="pt-input-with-editor-ref">
                    {inputProps.renderDefault(editorProps)}
                  </div>
                )
              },
            },
          }),
        ],
      }),
    ],
    [ptInputProps, editorRef],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm />
    </TestWrapper>
  )
}
