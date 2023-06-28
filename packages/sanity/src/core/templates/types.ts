import {InitialValueProperty, SchemaType} from '@sanity/types'

/** @public */
export interface Template<Params = any, Value = any> {
  id: string
  title: string
  description?: string
  schemaType: string
  icon?: SchemaType['icon']
  value: InitialValueProperty<Params, Value>
  parameters?: TemplateParameter[]
}

/** @public */
export type TemplateParameter = TemplateFieldDefinition | TemplateArrayFieldDefinition

/** @public */
export interface TypeTarget {
  type: string
}

/** @public */
export interface TemplateReferenceTarget {
  type: 'reference'
  to: TypeTarget | TypeTarget[]
}

/** @public */
export interface TemplateFieldDefinition {
  name: string
  type: string
  title?: string
  description?: string
  options?: {[key: string]: any}
}

/** @internal */
export type ReferenceFieldDefinition = TemplateFieldDefinition & TemplateReferenceTarget

/** @public */
export type TemplateArrayFieldDefinition = TemplateFieldDefinition & {
  type: 'array'
  of: (TemplateReferenceTarget | TypeTarget)[]
}

/**
 * Interface for initial value template item
 *
 * @public
 */
export interface InitialValueTemplateItem extends TemplateResponse {
  /** Initial value id */
  id: string
  type: 'initialValueTemplateItem'
  /** Initial value schema type */
  schemaType: string
}

/**
 * Interface for template response
 *
 * @public
 */
export interface TemplateResponse {
  /** Template id */
  templateId: string
  /** Template title */
  title?: string
  /** template subtitle */
  subtitle?: string
  /** template description */
  description?: string
  /** template parameters */
  parameters?: {[key: string]: any}
  /** template icon */
  icon?: React.ElementType | React.ReactElement
  /**
   * The id of the document to use as initial value
   * @experimental
   */
  initialDocumentId?: string
}
