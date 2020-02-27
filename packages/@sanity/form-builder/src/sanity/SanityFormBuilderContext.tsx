// Default wiring for FormBuilderContext when used as a sanity part
import React from 'react'
import FormBuilderContext from '../FormBuilderContext'
import SanityPreview from 'part:@sanity/base/preview'
import inputResolver from './inputResolver/inputResolver'

const previewResolver = () => SanityPreview
type Props = {
  value: any | null
  schema: Record<string, any>
  patchChannel: any
  children: React.ReactElement
}

export default function SanityFormBuilderContext(props: Props) {
  return (
    <FormBuilderContext
      value={props.value}
      schema={props.schema}
      patchChannel={props.patchChannel}
      resolveInputComponent={inputResolver}
      resolvePreviewComponent={previewResolver}
    >
      {props.children}
    </FormBuilderContext>
  )
}
SanityFormBuilderContext.createPatchChannel = FormBuilderContext.createPatchChannel
