import {
  type EncodableObject,
  type EncodableValue,
  type Encoded,
  type EncodedSet,
} from '@sanity/descriptors'

export type RegistryType = 'sanity.schema.registry'
export type EncodedRegistry = EncodedSet<'sanity.schema.registry'>
export type EncodedNamedType = Encoded<'sanity.schema.namedType', NamedType>

export type NamedType = {
  name: string
  typeDef: TypeDef & EncodableObject
}

export interface CommonTypeDef extends EncodableObject {
  title?: string
  description?: string | JSXMarker

  fields?: ObjectField[]
  groups?: ObjectGroup[]
  fieldsets?: ObjectFieldset[]

  liveEdit?: true
  hidden?: true | FunctionMarker
  readOnly?: true | FunctionMarker
  options?: EncodableValue
  initialValue?: EncodableValue
  placeholder?: string
  deprecated?: {reason: string}

  validation?: Validation[]

  /** Number of rows which should be used by the `text` type. */
  rows?: string
}

/** In some scenarios we need to encode special information. */
export type Marker =
  | FunctionMarker
  | UndefinedMarker
  | UnknownMarker
  | NumberMarker
  | CyclicMarker
  | JSXMarker
  | ObjectMarker

export type FunctionMarker = {__type: 'function'}

/** Denotes that we've reached the max depth of what we're willing to encode. */
export type DepthMarker = {__type: 'maxDepth'}

/** Denotes that we've reached a cycle in the object graph. */
export type CyclicMarker = {__type: 'cyclic'}

/** Denotes that a JSX value was encountered. */
export type JSXMarker = {__type: 'jsx'; type: string; props: EncodableObject}

/** Denotes an undefined value. This can only appear inside arrays. */
export type UndefinedMarker = {__type: 'undefined'}

/** Denotes an unknown value that couldn't have been serialized */
export type UnknownMarker = {__type: 'unknown'}

/** Denotes a number which we've turned into a string for serialization. */
export type NumberMarker = {__type: 'number'; value: string}

/**
 * Denotes an object. This is only used when we see an object with "__type" and
 * want to avoid it being interpreted as a marker.
 **/
export type ObjectMarker = {__type: 'object'; value: EncodableObject}

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

export type ObjectFieldset = {
  name: string
  title?: string
  description?: string
  group?: string
}

export type ObjectGroup = {
  name: string
  title?: string
  hidden?: true | FunctionMarker
  default?: true
  i18n?: ObjectI18n
}

export interface ReferenceTypeDef extends SubtypeDef {
  extends: 'reference' | 'crossDatasetReference' | 'globalDocumentReference'
  to: ReferenceTarget[]
  weak?: boolean
}

export type ReferenceTarget = {
  name: string
}

export type TypeDef = CoreTypeDef | ArrayTypeDef | ReferenceTypeDef | SubtypeDef

/**
 * A validation contains a list of rules.
 */
export type Validation = {
  rules: Rule[]
  level: 'error' | 'warning' | 'info'
  message?: ValidationMessage
}

export type ValidationMessage = string | ObjectMessage

export type ObjectMessage = Record<string, string>

export type ObjectI18nValue = {
  key: string
  ns: string
}

export type ObjectI18n = Record<string, ObjectI18nValue>

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

/**
 * A "rule" specifies a constraint on the value.
 *
 * This terminology is inspired by JSON Schema when possible.
 */
export type Rule =
  | {type: 'required'}
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
