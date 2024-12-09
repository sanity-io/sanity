import {type InsertMenuOptions} from '@sanity/insert-menu'

import {type FieldReference} from '../../../validation'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty, type SchemaValidationValue} from '../../types'
import {
  type IntrinsicDefinitions,
  type IntrinsicTypeName,
  type TypeAliasDefinition,
} from '../schemaDefinition'
import {
  type BaseSchemaDefinition,
  type BaseSchemaTypeOptions,
  type SearchConfiguration,
  type TitledListValue,
} from './common'

export type {InsertMenuOptions}

/** @public */
export interface ArrayOptions<V = unknown> extends SearchConfiguration, BaseSchemaTypeOptions {
  list?: TitledListValue<V>[] | V[]
  // inferring the array.of value for ArrayDefinition cause too much code-noise and was removed.
  // Since we don't have the type-info needed here, we allow values
  layout?: 'list' | 'tags' | 'grid'
  /** @deprecated This option does not have any effect anymore */
  direction?: 'horizontal' | 'vertical'
  sortable?: boolean
  modal?: {type?: 'dialog' | 'popover'; width?: number | 'auto'}
  /** @alpha This API may change */
  insertMenu?: InsertMenuOptions
  /**
   * A boolean flag to enable or disable tree editing for the array.
   * If there are any nested arrays, they will inherit this value.
   * @deprecated tree editing beta feature has been disabled
   */
  treeEditing?: boolean
}

/** @public */
export interface ArrayRule<Value> extends RuleDef<ArrayRule<Value>, Value> {
  min: (length: number | FieldReference) => ArrayRule<Value>
  max: (length: number | FieldReference) => ArrayRule<Value>
  length: (length: number | FieldReference) => ArrayRule<Value>
  unique: () => ArrayRule<Value>
}

/** @public */
export type ArrayOfEntry<T> = Omit<T, 'name' | 'hidden'> & {name?: string}

/** @public */
export type IntrinsicArrayOfDefinition = {
  [K in keyof IntrinsicDefinitions]: Omit<
    ArrayOfEntry<IntrinsicDefinitions[K]>,
    'validation' | 'initialValue'
    /* concession: without this "widening" these are considered unknown in array.of when not using defineArrayMember */
  > & {validation?: SchemaValidationValue; initialValue?: InitialValueProperty<any, any>}
}

/** @public */
export type ArrayOfType<
  TType extends IntrinsicTypeName = IntrinsicTypeName,
  TAlias extends IntrinsicTypeName | undefined = undefined,
> = IntrinsicArrayOfDefinition[TType] | ArrayOfEntry<TypeAliasDefinition<string, TAlias>>

/** @public */
export interface ArrayDefinition extends BaseSchemaDefinition {
  type: 'array'
  of: ArrayOfType[]
  initialValue?: InitialValueProperty<any, unknown[]>
  validation?: ValidationBuilder<ArrayRule<unknown[]>, unknown[]>
  options?: ArrayOptions
}
