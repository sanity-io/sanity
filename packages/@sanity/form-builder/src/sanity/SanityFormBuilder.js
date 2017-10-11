// @flow
import React from 'react'
import SanityFormBuilderContext from './SanityFormBuilderContext'
import {FormBuilderInput} from '../FormBuilderInput'

type PatchChannel = {
  subscribe: () => () => {},
  receivePatches: (patches: Array<*>) => void
}

type Props = {
  value: ?any,
  schema: any,
  type: Object,
  patchChannel: PatchChannel,
  onChange: () => {}
}

export default function SanityFormBuilder(props: Props) {
  return (
    <SanityFormBuilderContext
      value={props.value}
      schema={props.schema}
      patchChannel={props.patchChannel}
    >
      <FormBuilderInput
        type={props.type}
        onChange={props.onChange}
        level={0}
        value={props.value}
        isRoot
        autoFocus
      />
    </SanityFormBuilderContext>
  )
}

SanityFormBuilder.createPatchChannel = SanityFormBuilderContext.createPatchChannel
