import {ComponentType} from 'react'
import {CustomFilter, FieldFilter, SearchFilter} from '../../types'
import {
  CustomOperators,
  FieldOperators,
  SupportedCustomType,
  SupportedFieldType,
} from '../filters/types'

/**
 * @internal
 */
export interface OperatorDefinitions {
  arrayCountEqual: WithFieldFunction<number>
  arrayCountGt: WithFieldFunction<number>
  arrayCountGte: WithFieldFunction<number>
  arrayCountLt: WithFieldFunction<number>
  arrayCountLte: WithFieldFunction<number>
  arrayCountNotEqual: WithFieldFunction<number>
  assetEqual: WithFieldFunction<string>
  booleanEqual: WithFieldFunction<boolean>
  dateAfter: WithFieldFunction<Date>
  dateBefore: WithFieldFunction<Date>
  dateEqual: WithFieldFunction<Date>
  dateLast: WithFieldFunction<DateLastValue>
  dateNotEqual: WithFieldFunction<Date>
  dateRange: WithFieldFunction<DateRangeValue>
  defined: WithFieldFunction<never>
  notDefined: WithFieldFunction<never>
  numberEqual: WithFieldFunction<number>
  numberGt: WithFieldFunction<number>
  numberGte: WithFieldFunction<number>
  numberLt: WithFieldFunction<number>
  numberLte: WithFieldFunction<number>
  numberNotEqual: WithFieldFunction<number>
  numberRange: WithFieldFunction<NumberRangeValue>
  referenceEqual: WithFieldFunction<string>
  references: WithCustomFunction<string>
  stringEqual: WithFieldFunction<string>
  stringMatches: WithFieldFunction<string>
  stringNotEqual: WithFieldFunction<string>
  stringNotMatches: WithFieldFunction<string>
}

/**
 * @internal
 */
export type SearchOperatorType = keyof OperatorDefinitions

interface BaseOperatorDefinition<T> {
  buttonLabel: string
  fn: unknown
  initialValue: T | null
  inputComponent?: ComponentType<InputComponentProps<T>>
  label: string
}

interface WithCustomFunction<T> extends BaseOperatorDefinition<T> {
  fn: (filter: CustomFilter<T>) => string | null
}
interface WithFieldFunction<T> extends BaseOperatorDefinition<T> {
  fn: (filter: FieldFilter<T>) => string | null
}

/**
 * @internal
 */
export type DateLastValue = {
  unit: 'days' | 'months' | 'years'
  value: number | null
}

/**
 * @internal
 */
export type DateRangeValue = {
  max: Date | null
  min: Date | null
}

/**
 * @internal
 */
export type NumberRangeValue = {
  max: number | null
  min: number | null
}

/**
 * @internal
 */
export type InputComponentProps<T> = {
  filter: SearchFilter<T>
  onChange: (value: T | null) => void
}

export interface OperatorCustomItem<T extends SupportedCustomType> {
  name: Extract<keyof OperatorDefinitions, CustomOperators[T]>
  type: 'item'
}

export interface OperatorFieldItem<T extends SupportedFieldType> {
  name: Extract<keyof OperatorDefinitions, FieldOperators[T]>
  type: 'item'
}

export interface OperatorDivider {
  type: 'divider'
}

/**
 * @internal
 */
export type MenuCustomOperatorItem<T extends SupportedCustomType> =
  | OperatorDivider
  | OperatorCustomItem<T>

export type MenuFieldOperatorItem<T extends SupportedFieldType> =
  | OperatorDivider
  | OperatorFieldItem<T>
