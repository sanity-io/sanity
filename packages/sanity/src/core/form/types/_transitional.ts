import {
  type ArraySchemaType,
  type FormNodeValidation,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'

import {type PreviewProps} from '../../components'
import {type PatchEvent} from '../patch'
import {type FieldProps} from './fieldProps'
import {type InputProps} from './inputProps'
import {type ItemProps} from './itemProps'

/**
 * Function for rendering custom block markers
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export type RenderCustomMarkers = (markers: PortableTextMarker[]) => ReactNode

/**
 * Props for rendering block actions
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export interface RenderBlockActionsProps {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (block: PortableTextBlock) => void
  unset: () => void
  insert: (block: PortableTextBlock | PortableTextBlock[]) => void
}

/**
 * Function for rendering custom block actions
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export type RenderBlockActionsCallback = (props: RenderBlockActionsProps) => ReactNode

/**
 * A generic marker for attaching metadata to specific nodes of the Portable Text input.
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 * @param type - a type name for this marker
 * @param data - some data connected to this marker
 * @param path - the path to the Portable Text content connected to this marker
 */
export interface PortableTextMarker {
  type: string
  data?: unknown
  path: Path
}

/**
 * Component for rendering custom block markers
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export type FormBuilderCustomMarkersComponent = ComponentType<{markers: PortableTextMarker[]}>

/**
 *
 * @hidden
 * @beta
 */
export type FormBuilderMarkersComponent = ComponentType<{
  markers: PortableTextMarker[]
  renderCustomMarkers?: RenderCustomMarkers
  validation: FormNodeValidation[]
}>

/**
 *
 * @hidden
 * @beta
 */
export type FormBuilderInputComponentMap = Record<
  string,
  {
    field?: ComponentType<FieldProps>
    item?: ComponentType<ItemProps>
    input?: ComponentType<InputProps>
    preview?: ComponentType<PreviewProps>
  }
>

/**
 * These are the props an implementation of the ArrayFunctions component will receive
 *
 *
 * @hidden
 * @beta
 */
export interface ArrayInputFunctionsProps<Item, SchemaType extends ArraySchemaType> {
  children?: ReactNode
  onItemAppend: (itemValue: Item) => void
  onChange: (event: PatchEvent) => void
  onValueCreate: (type: SchemaType) => Item
  onItemPrepend: (itemValue: Item) => void
  readOnly?: boolean
  schemaType: SchemaType
  value?: Item[]
}

/**
 * @internal
 */
export interface FormBuilderFilterFieldFn {
  (type: ObjectSchemaType, field: ObjectField, selectedLanguageIds: string[]): boolean
}
