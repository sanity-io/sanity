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

export type TemplateParameter = FieldDefinition | ArrayFieldDefinition

export interface TypeTarget {
  type: string
}

export interface ReferenceTarget {
  type: 'reference'
  to: TypeTarget | TypeTarget[]
}

export interface FieldDefinition {
  name: string
  type: string
  title?: string
  description?: string
  options?: {[key: string]: any}
}

export type ReferenceFieldDefinition = FieldDefinition & ReferenceTarget

export type ArrayFieldDefinition = FieldDefinition & {
  type: 'array'
  of: (ReferenceTarget | TypeTarget)[]
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
