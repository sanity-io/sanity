import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderInputComponentMap,
  FormBuilderMarkersComponent,
  FormInputComponentResolver,
  FormPreviewComponentResolver,
} from '@sanity/base/form'
import {AssetSource, Path, Schema} from '@sanity/types'
import {createContext} from 'react'
import {PatchChannel} from './patchChannel'

export interface FormBuilderContextValue {
  components: {
    ArrayFunctions: FormBuilderArrayFunctionComponent
    CustomMarkers: FormBuilderCustomMarkersComponent
    Markers: FormBuilderMarkersComponent
    inputs: FormBuilderInputComponentMap
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
