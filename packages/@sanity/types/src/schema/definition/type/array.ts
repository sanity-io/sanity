import {FieldReference} from '../../../validation'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty, SchemaValidationValue} from '../../types'
import {IntrinsicDefinitions, TypeAliasDefinition, IntrinsicTypeName} from '../schemaDefinition'
import {BaseSchemaDefinition, TitledListValue} from './common'

/** @public */
export interface ArrayOptions<V = unknown> {
  list?: TitledListValue<V>[] | V[]
  /**
   * layout: 'tags' only works for string array
   * layout: 'grid' only works for arrays with objects
   */
  // inferring the array.of value for ArrayDefinition cause too much code-noise and was removed.
  // Since we don't have the type-info needed here, we allow values
  layout?: 'tags' | 'grid'
  direction?: 'horizontal' | 'vertical'
  sortable?: boolean
  modal?: {type?: 'dialog' | 'popover'; width?: number | 'auto'}
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
  TAlias extends IntrinsicTypeName | undefined = undefined
> = IntrinsicArrayOfDefinition[TType] | ArrayOfEntry<TypeAliasDefinition<string, TAlias>>

/** @public */
export interface ArrayDefinition extends BaseSchemaDefinition {
  type: 'array'
  of: ArrayOfType[]
  initialValue?: InitialValueProperty<any, unknown[]>
  validation?: ValidationBuilder<ArrayRule<unknown[]>, unknown[]>
  options?: ArrayOptions
}
