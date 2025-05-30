import {type EncodedSet, type Encoded, EncodableObject, EncodableValue} from '@sanity/descriptors'

export type RegistryType = 'sanity.schema.registry'
export type EncodedRegistry = EncodedSet<'sanity.schema.registry'>
export type EncodedNamedType = Encoded<'sanity.schema.namedType', NamedType>

export type NamedType = {
  name: string
  typeDef: TypeDef
}

export interface CommonTypeDef extends EncodableObject {
  title?: string
  hidden?: boolean
  readOnly?: boolean
  fields?: ObjectField[]
  validation?: Validation[]
}

/**
 * A definition of a "core type". This is tied to a specific `jsonType` representation.
 */
export interface CoreTypeDef extends CommonTypeDef {
  extends: null
  jsonType: 'boolean' | 'number' | 'string' | 'object' | 'array'
}

/**
 * A subtype of another, named, type.
 */
export interface SubtypeDef extends CommonTypeDef {
  extends: string
}

export interface ArrayTypeDef extends SubtypeDef {
  extends: 'array'
  of: ArrayElement[]
}

export type ArrayElement = {
  name: string | null
  typeDef: TypeDef
}

export type ObjectField = {
  name: string
  typeDef: TypeDef
  groups?: string[]
  fieldset?: string
}

export interface ReferenceTypeDef extends SubtypeDef {
  extends: 'reference' | 'crossDatasetReference' | 'globalDocumentReference'
  to: string[]
  weak?: boolean
}

export type TypeDef = CoreTypeDef | ArrayTypeDef | ReferenceTypeDef | SubtypeDef

/**
 * A validation contains a list of rules.
 *
 * `required` means that the value.
 */
export type Validation = {
  rules: Rule[]
  level: 'error' | 'warning' | 'info'
  message?: ValidationMessage

  /** The value must be present. */
  required?: true
}

export type ValidationMessage = string | LocalizedMessage

export type LocalizedMessage = Record<string, string>

/** Field reference makes it possible for a rule to refer to another field in the same object. */
export type FieldReference = {
  type: 'fieldReference'
  path: string[]
}

/**
 * NestedRule is used when composing with `allOf`/`anyOf`.
 */
export type NestedRule = {
  rules: Rule[]

  /** The validation message, if set, will override the message from the inner rules. */
  message?: ValidationMessage
}

/**  */
export type Rule =
  | {type: 'integer'}
  | {type: 'email'}
  | {type: 'datetime'}
  | {type: 'uppercase'}
  | {type: 'lowercase'}
  | {type: 'uniqueItems'}
  | {type: 'reference'}
  | {type: 'assetRequired'}
  | {type: 'allOf'; children: NestedRule[]}
  | {type: 'anyOf'; children: NestedRule[]}
  | {type: 'enum'; values: EncodableValue[]}
  | {type: 'minimum'; value: string | FieldReference}
  | {type: 'exclusiveMinimum'; value: string | FieldReference}
  | {type: 'maximum'; value: string | FieldReference}
  | {type: 'exclusiveMaximum'; value: string | FieldReference}
  | {type: 'length'; value: string | FieldReference}
  | {type: 'precision'; value: string | FieldReference}
  | {type: 'regex'; pattern: string; invert?: true}
  | {type: 'uri'; allowRelative?: boolean}
  | {type: 'custom'; name?: string; optional?: true}
