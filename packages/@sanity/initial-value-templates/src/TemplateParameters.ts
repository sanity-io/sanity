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
