import {AssetSource, Path, Schema} from '@sanity/types'
import {createContext} from 'react'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  // FormBuilderFilterFieldFn,
  FormBuilderInputComponentMap,
  FormBuilderMarkersComponent,
  FormInputComponentResolver,
  FormPreviewComponentResolver,
  RenderFieldCallback,
} from './types'
import {PatchChannel} from './patch/PatchChannel'
import {PatchArg} from './patch'

export interface FormBuilderContextValue {
  /**
   * @internal
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase

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

  // filterField: FormBuilderFilterFieldFn

  image: {
    assetSources: AssetSource[]
    directUploads: boolean
  }

  getDocument: () => unknown
  getValuePath: () => Path

  onBlur: () => void
  onChange: (path: Path, ...patches: PatchArg[]) => void
  onFocus: (path: Path) => void
  onSelectFieldGroup: (path: Path, groupName: string) => void
  onSetCollapsed: (path: Path, collapsed: boolean) => void
  onSetCollapsedFieldSet: (path: Path, collapsed: boolean) => void

  renderField: RenderFieldCallback

  resolveInputComponent: FormInputComponentResolver
  resolvePreviewComponent: FormPreviewComponentResolver

  schema: Schema
}

export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
