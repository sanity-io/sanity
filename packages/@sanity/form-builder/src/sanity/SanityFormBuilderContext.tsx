// Default wiring for FormBuilderContext when used as a sanity part
import React from 'react'
import FormBuilderContext from '../FormBuilderContext'
import SanityPreview from 'part:@sanity/base/preview'
import inputResolver from './inputResolver/inputResolver'
import * as gradientPatchAdapter from './utils/gradientPatchAdapter'

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
SanityFormBuilderContext.createPatchChannel = () => {
  const patchChannel = FormBuilderContext.createPatchChannel()
  return {
    receiveEvent: event => {
      if (event.type !== 'mutation' && event.type !== 'rebase') {
        return
      }
      const patches =
        event.type === 'mutation'
          ? event.mutations.map(mut => mut.patch).filter(Boolean)
          : [
              {
                id: event.document._id,
                set: event.document
              }
            ]
      patchChannel.receivePatches({
        patches: gradientPatchAdapter.toFormBuilder('internal', patches)
      })
    },
    onPatch: patchChannel.onPatch
  }
}
