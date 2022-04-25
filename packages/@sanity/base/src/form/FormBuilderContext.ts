import {AssetSource, Path, Schema} from '@sanity/types'
import {createContext} from 'react'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderInputComponentMap,
  FormBuilderMarkersComponent,
  FormInputComponentResolver,
  FormPreviewComponentResolver,
  RenderFieldCallback,
} from './types'
import {PatchChannel} from './patch/PatchChannel'

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
  renderField: RenderFieldCallback
  resolveInputComponent: FormInputComponentResolver
  resolvePreviewComponent: FormPreviewComponentResolver
  getDocument: () => unknown
}

export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
