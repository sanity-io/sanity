import {AssetSource, ObjectSchemaType, Path, SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {PatchChannel} from './patch'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderMarkersComponent,
  FormFieldGroup,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from './types'
import {ObjectMember, StateTree} from './store'

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
  }

  autoFocus?: boolean
  changesOpen?: boolean
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  focusPath: Path
  focused?: boolean
  groups: FormFieldGroup[]
  id: string
  members: ObjectMember[]
  readOnly?: boolean
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
}

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
