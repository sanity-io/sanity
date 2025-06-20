import {type AssetSource, type ObjectSchemaType, type Path} from '@sanity/types'

import type {PatchChannel} from './patch/PatchChannel'
import type {FormFieldGroup} from './store/types/fieldGroup'
import type {StateTree} from './store/types/state'
import {
  type FormBuilderCustomMarkersComponent,
  type FormBuilderFilterFieldFn,
  type FormBuilderMarkersComponent,
} from './types/_transitional'
import {
  type RenderAnnotationCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderItemCallback,
  type RenderPreviewCallback,
} from './types/renderCallback'

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
