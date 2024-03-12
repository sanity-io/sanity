import {type ComponentType, type ReactElement, type ReactNode} from 'react'

import {type ConditionalProperty, type DeprecatedProperty} from '../../types'
import {type ObjectOptions} from './object'

/** @public */
export type FieldsetDefinition = {
  name: string
  title?: string
  description?: string
  group?: string
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  options?: ObjectOptions
}

/** @public */
export type FieldGroupDefinition = {
  name: string
  title?: string
  hidden?: ConditionalProperty
  icon?: ComponentType
  default?: boolean
}

/** @public */
export interface BaseSchemaDefinition {
  name: string
  title?: string
  description?: string | ReactElement
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  icon?: ComponentType | ReactNode
  validation?: unknown
  initialValue?: unknown
  deprecated?: DeprecatedProperty
  /*
   * These are not the properties you are looking for.
   * To avoid cyclic dependencies on Prop-types, the components property is
   * added to each intrinsic definition in sanity/core/schema/definitionExtensions.ts
   */
  /*components?: {
    diff?: ComponentType<any>
    field?: ComponentType<any>
    input?: ComponentType<any>
    item?: ComponentType<any>
    preview?: ComponentType<any>
  }*/
}

/** @public */
export interface TitledListValue<V = unknown> {
  _key?: string
  title: string
  value?: V
}

/** @public */
export interface I18nTitledListValue<V = unknown> {
  _key?: string
  title: string
  i18nTitleKey?: string
  value?: V
}

/** @public */
export interface EnumListProps<V = unknown> {
  list?: Array<TitledListValue<V> | V>
  layout?: 'radio' | 'dropdown'
  direction?: 'horizontal' | 'vertical'
}

/** @public */
export interface SearchConfiguration {
  search?: {
    /**
     * Defines a search weight for this field to prioritize its importance
     * during search operations in the Studio. This setting allows the specified
     * field to be ranked higher in search results compared to other fields.
     *
     * By default, all fields are assigned a weight of 1. However, if a field is
     * chosen as the `title` in the preview configuration's `select` option, it
     * will automatically receive a default weight of 10. Similarly, if selected
     * as the `subtitle`, the default weight is 5. Fields marked as
     * `hidden: true` (no function) are assigned a weight of 0 by default.
     *
     * Note: Search weight configuration is currently supported only for fields
     * of type string or portable text arrays.
     */
    weight?: number
  }
}
