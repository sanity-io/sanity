import {AssetSource, ObjectSchemaType, Path, SanityDocument, SchemaType} from '@sanity/types'
import {createContext} from 'react'
import {PatchChannel} from './patch'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderMarkersComponent,
  FormFieldGroup,
  FormPreviewComponentResolver,
  InputProps,
  ObjectMember,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from './types'

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
    resolveInputComponent: (options: {schemaType: SchemaType}) => React.ComponentType<InputProps>
    resolvePreviewComponent: FormPreviewComponentResolver
  }

  autoFocus?: boolean
  changesOpen?: boolean
  compareValue: {[field in string]: unknown} | undefined
  focusPath: Path
  focused?: boolean
  groups: FormFieldGroup[]
  id: string
  members: ObjectMember[]
  readOnly?: boolean
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
}

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
