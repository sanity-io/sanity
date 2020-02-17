// Default wiring for FormBuilderContext when used as a sanity part
import React from 'react'
import FormBuilderContext from '../FormBuilderContext'
import SanityPreview from 'part:@sanity/base/preview'
import inputResolver from './inputResolver/inputResolver'
import usePresence from 'part:@sanity/base/hooks/presence'
import WithPresence from './WithPresence'

const previewResolver = () => SanityPreview
type Props = {
  value: any | null
  schema: Record<string, any>
  patchChannel: any
  children: React.ReactElement
}

export default function SanityFormBuilderContext(props: Props) {
  const presence = usePresence({namespace: 'formBuilder', documentId: props.value._id})
  return (
    <FormBuilderContext
      value={props.value}
      schema={props.schema}
      patchChannel={props.patchChannel}
      resolveInputComponent={inputResolver}
      resolvePreviewComponent={previewResolver}
    >
      <WithPresence presence={presence}>{props.children}</WithPresence>
    </FormBuilderContext>
  )
}
SanityFormBuilderContext.createPatchChannel = FormBuilderContext.createPatchChannel
