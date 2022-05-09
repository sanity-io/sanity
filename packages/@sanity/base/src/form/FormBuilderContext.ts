import {AssetSource, Path, SanityDocument, Schema} from '@sanity/types'
import {createContext} from 'react'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderMarkersComponent,
  FormPreviewComponentResolver,
  RenderInputCallback,
} from './types'
import {PatchChannel} from './patch/PatchChannel'
import {PatchEvent} from './patch'

export interface FormBuilderContextValue {
  /**
   * @deprecated INTERNAL USE ONLY
   */
  __internal: {
    components: {
      ArrayFunctions: FormBuilderArrayFunctionComponent
      CustomMarkers: FormBuilderCustomMarkersComponent
      Markers: FormBuilderMarkersComponent
    }
    file: {
      assetSources: AssetSource[]
      directUploads: boolean
    }
    filterField: FormBuilderFilterFieldFn
    image: {
      assetSources: AssetSource[]
      directUploads: boolean
    }
    getDocument: () => SanityDocument | undefined
    getValuePath: () => Path
    onChange: (event: PatchEvent) => void
    patchChannel: PatchChannel // eslint-disable-line camelcase
    resolvePreviewComponent: FormPreviewComponentResolver
  }

  renderField: RenderInputCallback
  schema: Schema
}

export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
