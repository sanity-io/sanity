import {AssetSource, ObjectSchemaType, Path, SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {PatchChannel} from './patch'
import {
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
import {FormFieldGroup, StateTree} from './store'

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
  readOnly?: boolean
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
}

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
