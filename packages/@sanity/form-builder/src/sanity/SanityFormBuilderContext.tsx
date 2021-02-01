// Default wiring for FormBuilderContext when used as a sanity part
import React from 'react'
import {Schema} from '@sanity/types'
import {SanityPreview} from '../legacyParts'
import FormBuilderContext from '../FormBuilderContext'
import inputResolver from './inputResolver/inputResolver'
import * as gradientPatchAdapter from './utils/gradientPatchAdapter'

const previewResolver = () => SanityPreview
type Props = {
  value: any | null
  schema: Schema
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

function prepareMutationEvent(event) {
  const patches = event.mutations.map((mut) => mut.patch).filter(Boolean)
  return {
    snapshot: event.document,
    patches: gradientPatchAdapter.toFormBuilder(event.origin, patches),
  }
}

function prepareRebaseEvent(event) {
  const remotePatches = event.remoteMutations.map((mut) => mut.patch).filter(Boolean)
  const localPatches = event.localMutations.map((mut) => mut.patch).filter(Boolean)
  return {
    snapshot: event.document,
    patches: gradientPatchAdapter
      .toFormBuilder('remote', remotePatches)
      .concat(gradientPatchAdapter.toFormBuilder('local', localPatches)),
  }
}

SanityFormBuilderContext.createPatchChannel = () => {
  const patchChannel = FormBuilderContext.createPatchChannel()
  return {
    receiveEvent: (event) => {
      if (event.type !== 'mutation' && event.type !== 'rebase') {
        return
      }
      patchChannel.receivePatches(
        event.type === 'mutation' ? prepareMutationEvent(event) : prepareRebaseEvent(event)
      )
    },
    onPatch: patchChannel.onPatch,
  }
}
