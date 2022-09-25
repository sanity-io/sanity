import {InitialValueProperty, SchemaType} from '@sanity/types'

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

export interface TypeTarget {
  type: string
}

export interface TemplateReferenceTarget {
  type: 'reference'
  to: TypeTarget | TypeTarget[]
}

export interface TemplateFieldDefinition {
  name: string
  type: string
  title?: string
  description?: string
  options?: {[key: string]: any}
}

export type ReferenceFieldDefinition = TemplateFieldDefinition & TemplateReferenceTarget

export type TemplateArrayFieldDefinition = TemplateFieldDefinition & {
  type: 'array'
  of: (TemplateReferenceTarget | TypeTarget)[]
}

export interface InitialValueTemplateItem extends TemplateResponse {
  id: string
  type: 'initialValueTemplateItem'
  schemaType: string
}

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
