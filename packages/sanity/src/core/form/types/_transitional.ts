import {
  type FormNodeValidation,
  type ObjectField,
  type ObjectSchemaType,
  type PortableTextMarker,
  type RenderCustomMarkers,
} from '@sanity/types'
import {type ComponentType} from 'react'

import {type PreviewProps} from '../../components'
import {type FieldProps} from './fieldProps'
import {type InputProps} from './inputProps'
import {type ItemProps} from './itemProps'

export type {
  ArrayInputFunctionsProps,
  PortableTextMarker,
  RenderBlockActionsCallback,
  RenderBlockActionsProps,
  RenderCustomMarkers,
} from '@sanity/types'

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
 * @internal
 */
export interface FormBuilderFilterFieldFn {
  (type: ObjectSchemaType, field: ObjectField, selectedLanguageIds: string[]): boolean
}
