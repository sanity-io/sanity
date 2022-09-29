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

/** @beta */
export interface InitialValueTemplateItem extends TemplateResponse {
  id: string
  type: 'initialValueTemplateItem'
  schemaType: string
}

/** @beta */
export type TemplateResponse = {
  templateId: string
  title?: string
  subtitle?: string
  description?: string
  parameters?: {[key: string]: any}
  icon?: React.ElementType | React.ReactElement
  /**
   * @experimental
   */
  initialDocumentId?: string
}
