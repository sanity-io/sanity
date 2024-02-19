import {type PortableTextEditor} from '@sanity/portable-text-editor'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {createRef, type RefObject, useMemo, useState} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

export function InputStory(props: {
  getRef?: (editorRef: RefObject<PortableTextEditor | null>) => void
}) {
  // Use a state as ref here to be make sure we are able to call the ref callback when
  // the ref is ready
  const [editorRef, setEditorRef] = useState<RefObject<PortableTextEditor | null>>({current: null})
  if (props.getRef && editorRef.current) {
    props.getRef(editorRef)
  }

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
                  editorRef: createRef(),
                } as PortableTextInputProps
                if (editorProps.editorRef) {
                  setEditorRef(editorProps.editorRef)
                }
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
    [],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm />
    </TestWrapper>
  )
}
