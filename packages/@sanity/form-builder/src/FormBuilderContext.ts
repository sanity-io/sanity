import {AssetSource, Path, Schema, ValidationMarker} from '@sanity/types'
import React, {createContext} from 'react'
import {PortableTextMarker, RenderCustomMarkers} from './inputs/PortableText/types'
import {PatchChannel} from './patchChannel'
import {
  FormArrayInputFunctionsProps,
  FormBuilderFilterFieldFn,
  FormInputComponentResolver,
  FormInputProps,
  FormPreviewComponentResolver,
} from './types'

export interface FormBuilderContextValue {
  components: {
    ArrayFunctions: React.ComponentType<FormArrayInputFunctionsProps<any, any>>
    CustomMarkers: React.ComponentType<{markers: PortableTextMarker[]}>
    Markers: React.ComponentType<{
      markers: PortableTextMarker[]
      renderCustomMarkers: RenderCustomMarkers
      validation: ValidationMarker[]
    }>
    inputs: Record<string, React.ComponentType<FormInputProps<any, any>> | undefined>
  }
  file: {
    assetSources: AssetSource[]
    directUploads: boolean
  }
  image: {
    assetSources: AssetSource[]
    directUploads: boolean
  }
  getValuePath: () => Path
  /**
   * @internal
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  filterField: FormBuilderFilterFieldFn
  schema: Schema
  resolveInputComponent: FormInputComponentResolver
  resolvePreviewComponent: FormPreviewComponentResolver
  getDocument: () => unknown
}

export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
