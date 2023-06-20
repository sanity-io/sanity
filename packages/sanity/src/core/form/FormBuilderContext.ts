import {AssetSource, ObjectSchemaType, Path, SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {PatchChannel} from './patch'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderFilterFieldFn,
  FormBuilderMarkersComponent,
  RenderAnnotationCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from './types'
import {FormFieldGroup, ObjectMember, StateTree} from './store'

/**
 *
 * @hidden
 * @beta
 */
export interface FormBuilderContextValue {
  /**
   * @deprecated INTERNAL USE ONLY
   * @internal
   */
  __internal: {
    components: {
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
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
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
