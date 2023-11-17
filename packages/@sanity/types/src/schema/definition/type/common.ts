import type {ComponentType, ReactElement, ReactNode} from 'react'
import type {ConditionalProperty} from '../../types'
import type {ObjectOptions} from './object'

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
  i18nTitle?: string
  value?: V
}

/** @public */
export interface EnumListProps<V = unknown> {
  list?: Array<TitledListValue<V> | V>
  layout?: 'radio' | 'dropdown'
  direction?: 'horizontal' | 'vertical'
}
