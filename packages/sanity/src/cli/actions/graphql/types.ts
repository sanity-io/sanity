export interface GeneratedApiSpecification {
  types: (ConvertedType | ConvertedUnion | ConvertedEnum | InputObjectType)[]
  queries: QueryDefinition[]
  interfaces: ConvertedInterface[]
  generation: string
}

export interface ApiChange {
  type: string
  description: string
}

export interface ValidationResponse {
  validationError: string
  breakingChanges: ApiChange[]
  dangerousChanges: ApiChange[]
}

export interface DeployResponse {
  location: string
}

export interface ApiSpecification {
  types: (ConvertedType | ConvertedUnion)[]
  interfaces: ConvertedInterface[]
}

export interface ConvertedNode {
  kind: 'Type' | 'List' | 'Union' | 'Interface'
  name: string
  type: string
  description: string
  fields: ConvertedFieldDefinition[]
}

export interface ConvertedType {
  kind: 'Type' | 'Interface'
  name: string
  type: string
  fields: ConvertedFieldDefinition[]
  description?: string
  interfaces?: string[]
  originalName?: string
  isReference?: boolean
}

export interface ConvertedDocumentType extends ConvertedType {
  interfaces: ['Document', ...string[]]
}

export interface ConvertedInterface {
  kind: 'Interface'
  name: string
  description?: string
  fields: ConvertedFieldDefinition[]
}

export interface ConvertedUnion {
  kind: 'Union'
  name: string
  types: string[]
  interfaces?: string[]
}

export type FieldArg =
  | {name: string; type: string; isFieldFilter?: boolean}
  | {name: string; type: ConvertedNode}

export interface ConvertedField {
  fieldName: string
  type: string
  filter?: string
  originalName?: string
  description?: string
  isReference?: boolean
  isNullable?: boolean
  isRawAlias?: boolean
  args?: FieldArg[]
  kind?: 'List'
}

export interface ConvertedListField extends ConvertedField {
  kind: 'List'
  children: {
    type: string
    inlineObjects?: string[]
  }
}

export type ConvertedFieldDefinition = ConvertedField | ConvertedListField

export interface InputObjectType {
  kind: 'InputObject'
  name: string
  fields: unknown[] // @todo
  isConstraintFilter?: boolean
}

export interface ListDefinition {
  kind: 'List'
  isNullable?: boolean
  children: {type: string; isNullable?: boolean}
}

export interface QueryDefinition {
  fieldName: string
  type: string | ListDefinition

  filter?: string

  constraints?: {
    field?: string
    comparator: string
    value?: {kind: 'argumentValue'; argName: string}
  }[]

  args: {
    name: string
    type: string | ListDefinition
    description?: string
    isNullable?: boolean
    isFieldFilter?: boolean
  }[]
}

export type InputFilterField =
  | {
      fieldName: string
      type: string
      description?: string
      constraint: {
        field?: string
        comparator: string
      }
    }
  | ListDefinition

export interface ConvertedEnum {
  kind: 'Enum'
  name: string
  values: {
    name: string
    description?: string
    value: unknown
  }[]
}

export interface SchemaDefinitionish {
  name: string
  type: string
  fields?: SchemaDefinitionish[]
}
