// @flow
// Default wiring for FormBuilderContext when used as a sanity part
import React from 'react'
import FormBuilderContext from '../FormBuilderContext'
import SanityPreview from 'part:@sanity/base/preview'
import inputResolver from './inputResolver/inputResolver'
import type {Node} from 'react'

const previewResolver = () => SanityPreview

type Props = {
  value: ?any,
  schema: Object,
  patchChannel: any,
  children: Node
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
