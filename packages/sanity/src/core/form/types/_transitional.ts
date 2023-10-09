import {
  ArraySchemaType,
  FormNodeValidation,
  ObjectField,
  ObjectSchemaType,
  Path,
  PortableTextBlock,
} from '@sanity/types'
import React from 'react'
import {PatchEvent} from '../patch'
import {PreviewProps} from '../../components'
import {InputProps} from './inputProps'
import {FieldProps} from './fieldProps'
import {ItemProps} from './itemProps'

/**
 * Function for rendering custom block markers
 *
 * @public
 * @hidden
 * @deprecated use `renderBlock`, `renderInlineBlock`, `renderAnnotation` interfaces instead
 */
export type RenderCustomMarkers = (markers: PortableTextMarker[]) => React.ReactNode

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
export type RenderBlockActionsCallback = (props: RenderBlockActionsProps) => React.ReactNode

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
export type FormBuilderCustomMarkersComponent = React.ComponentType<{markers: PortableTextMarker[]}>

/**
 *
 * @hidden
 * @beta
 */
export type FormBuilderMarkersComponent = React.ComponentType<{
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
    field?: React.ComponentType<FieldProps>
    item?: React.ComponentType<ItemProps>
    input?: React.ComponentType<InputProps>
    preview?: React.ComponentType<PreviewProps>
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
  children?: React.ReactNode
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
