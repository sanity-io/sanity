import {AssetSource, SanityDocument, Schema} from '@sanity/types'
import {createContext} from 'react'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderMarkersComponent,
  FormPreviewComponentResolver,
} from './types'
import {PatchChannel} from './patch/PatchChannel'

/**
 * @alpha
 */
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
    patchChannel: PatchChannel
    resolvePreviewComponent: FormPreviewComponentResolver
  }
}

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
