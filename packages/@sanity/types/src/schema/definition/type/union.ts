import {type InsertMenuOptions} from '@sanity/insert-menu'

import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {
  type AutocompleteString,
  type InitialValueProperty,
  type SchemaValidationValue,
} from '../../types'
import {
  type InlineFieldIntrinsicTypeName,
  type IntrinsicDefinitions,
  type IntrinsicTypeName,
  type TypeReferenceDefinition,
} from '../schemaDefinition'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'

/** @public */
export interface UnionOptions extends BaseSchemaTypeOptions {
  /** @alpha */
  insertMenu?: InsertMenuOptions
}

/** @public */
export interface UnionRule<
  Value extends Record<string, unknown> = Record<string, unknown>,
> extends RuleDef<UnionRule<Value>, Value> {}

/** @public */
export type UnionOfEntry<T> = Omit<T, 'name' | 'hidden'> & {name?: string}

/** @public */
export type ObjectBackedUnionIntrinsicTypeName = Extract<
  InlineFieldIntrinsicTypeName,
  | 'block'
  | 'crossDatasetReference'
  | 'file'
  | 'geopoint'
  | 'globalDocumentReference'
  | 'image'
  | 'object'
  | 'reference'
  | 'slug'
>

/** @public */
export type IntrinsicUnionOfDefinition = {
  [K in ObjectBackedUnionIntrinsicTypeName]: Omit<
    UnionOfEntry<IntrinsicDefinitions[K]>,
    'validation' | 'initialValue'
  > & {
    validation?: SchemaValidationValue
    initialValue?: InitialValueProperty<any, any>
  }
}

/** @public */
export type UnionOfType<
  TType extends IntrinsicTypeName = ObjectBackedUnionIntrinsicTypeName,
  TAlias extends IntrinsicTypeName | undefined = undefined,
> =
  | IntrinsicUnionOfDefinition[Extract<TType, ObjectBackedUnionIntrinsicTypeName>]
  | UnionOfEntry<TypeReferenceDefinition<AutocompleteString, TAlias>>

/** @public */
export interface UnionDefinition extends BaseSchemaDefinition {
  type: 'union'
  of: UnionOfType[]
  initialValue?: InitialValueProperty<any, Record<string, unknown>>
  validation?: ValidationBuilder<UnionRule, Record<string, unknown>>
  options?: UnionOptions
}
