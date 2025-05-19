import {type EncodedSet, type Encoded, EncodableObject} from '@sanity/descriptors'

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
}

/**
 * A definition of a "core type". This is tied to a specific `jsonType` representation.
 */
export interface CoreTypeDef extends CommonTypeDef {
  subtypeOf: null
  jsonType: 'boolean' | 'number' | 'string' | 'object' | 'array'
}

/**
 * A subtype of another, named, type.
 */
export interface SubtypeDef extends CommonTypeDef {
  subtypeOf: string
}

export interface ArrayTypeDef extends SubtypeDef {
  subtypeOf: 'array'
  of: ArrayElement[]
}

export type ArrayElement = {
  name: string | null
  typeDef: TypeDef
}

export type ObjectField = {
  name: string
  typeDef: TypeDef
  group?: string
  fieldset?: string
}

export interface ReferenceTypeDef extends SubtypeDef {
  subtypeOf: 'reference' | 'crossDatasetReference' | 'globalDocumentReference'
  to: string[]
  weak?: boolean
}

export type TypeDef = CoreTypeDef | ArrayTypeDef | ReferenceTypeDef | SubtypeDef
