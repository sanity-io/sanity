import {type PortableTextEditor} from '@portabletext/editor'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {createContext, useContext, useMemo} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

interface InputStoryProps {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  editorRef?: React.Ref<PortableTextEditor | null>
  ptInputProps?: Partial<PortableTextInputProps>
}

const InputStoryContext = createContext<InputStoryProps>({})

function PTInputWithEditorRef(inputProps: InputProps) {
  const {editorRef, ptInputProps} = useContext(InputStoryContext)
  const editorProps = {
    ...inputProps,
    ...ptInputProps,
    editorRef,
  } as PortableTextInputProps
  return <div data-testid="pt-input-with-editor-ref">{inputProps.renderDefault(editorProps)}</div>
}

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
          defineArrayMember({
            type: 'block',
          }),
        ],
        components: {
          input: PTInputWithEditorRef,
        },
      }),
    ],
  }),
]

export function InputStory(props: InputStoryProps) {
  const {editorRef, ptInputProps} = props
  const contextValue = useMemo(() => ({editorRef, ptInputProps}), [editorRef, ptInputProps])

  return (
    <InputStoryContext.Provider value={contextValue}>
      <TestWrapper schemaTypes={schemaTypes}>
        <TestForm />
      </TestWrapper>
    </InputStoryContext.Provider>
  )
}
