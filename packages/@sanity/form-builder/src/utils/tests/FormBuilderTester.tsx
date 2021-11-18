//  Schema prop
// dummy document prop

import {FormFieldPresence} from '@sanity/base/presence'
import {Marker, Path, Schema, SchemaType} from '@sanity/types'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import React from 'react'
import {FormBuilder} from '../../sanity/legacyPartImplementations/form-builder'

type PatchChannel = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  subscribe: () => () => {}
  receivePatches: (patches: any[]) => void
}

type FormBuilderProps = {
  value: any | null
  schema: Schema
  type: SchemaType
  markers: Marker[]
  patchChannel: PatchChannel
  compareValue: any
  onFocus: (path: Path) => void
  readOnly: boolean
  onChange: (patches: any[]) => void
  filterField: (field: any) => boolean
  onBlur: () => void
  autoFocus: boolean
  focusPath: Path
  presence: FormFieldPresence[]
}
const patchChannel = FormBuilder.createPatchChannel()

export const DEFAULT_PROPS = {
  level: 0,
  markers: [],
  presence: [],
  compareValue: undefined,
  readOnly: undefined,
  filterField: () => true,
  patchChannel: patchChannel as any,
  onBlur: () => undefined,
  autoFocus: undefined,
  focusPath: [],
}

export const FormBuilderTester = React.forwardRef(function FormBuilderTester(
  props: FormBuilderProps,
  ref
) {
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <FormBuilder {...props} />
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
})
