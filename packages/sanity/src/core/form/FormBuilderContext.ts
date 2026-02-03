import {type AssetSource, type ObjectSchemaType, type Path} from '@sanity/types'

import {type PatchChannel} from './patch'
import {type FormFieldGroup, type StateTree} from './store'
import {
  type FormBuilderCustomMarkersComponent,
  type FormBuilderFilterFieldFn,
  type FormBuilderMarkersComponent,
  type RenderAnnotationCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderItemCallback,
  type RenderPreviewCallback,
} from './types'

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
