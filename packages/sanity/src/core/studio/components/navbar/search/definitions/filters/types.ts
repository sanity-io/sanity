import type {IntrinsicDefinitions} from '@sanity/types'
import {ComponentType} from 'react'
import type {
  OperatorCustomItem,
  OperatorDivider,
  OperatorFieldItem,
  SearchOperatorType,
} from '../operators/types'

/**
 * Extract all applicable operators for the current search operator type
 */
type ExtractOperatorTypes<T extends SearchOperatorType> = Extract<SearchOperatorType, T>

/**
 * @internal
 */
export interface CustomOperators {
  references: ExtractOperatorTypes<'references'>
}

/**
 * @internal
 */
export interface FieldOperators {
  array: ExtractOperatorTypes<
    | 'arrayCountEqual'
    | 'arrayCountGt'
    | 'arrayCountGte'
    | 'arrayCountLt'
    | 'arrayCountLte'
    | 'arrayCountNotEqual'
    | 'defined'
    | 'notDefined'
  >
  boolean: ExtractOperatorTypes<'booleanEqual' | 'notDefined'>
  date: ExtractOperatorTypes<
    | 'dateAfter'
    | 'dateBefore'
    | 'dateEqual'
    | 'dateLast'
    | 'dateNotEqual'
    | 'dateRange'
    | 'defined'
    | 'notDefined'
  >
  datetime: ExtractOperatorTypes<
    | 'dateAfter'
    | 'dateBefore'
    | 'dateEqual'
    | 'dateLast'
    | 'dateNotEqual'
    | 'dateRange'
    | 'defined'
    | 'notDefined'
  >
  file: ExtractOperatorTypes<'defined' | 'notDefined'>
  geopoint: ExtractOperatorTypes<'defined' | 'notDefined'>
  image: ExtractOperatorTypes<'defined' | 'notDefined'>
  number: ExtractOperatorTypes<
    | 'defined'
    | 'numberEqual'
    | 'numberGt'
    | 'numberGte'
    | 'numberLt'
    | 'numberLte'
    | 'numberNotEqual'
    | 'numberRange'
    | 'notDefined'
  >
  reference: ExtractOperatorTypes<'defined' | 'notDefined' | 'referenceEqual'>
  slug: ExtractOperatorTypes<
    | 'defined'
    | 'notDefined'
    | 'stringEqual'
    | 'stringMatches'
    | 'stringNotEqual'
    | 'stringNotMatches'
  >
  string: ExtractOperatorTypes<
    | 'defined'
    | 'notDefined'
    | 'stringEqual'
    | 'stringMatches'
    | 'stringNotEqual'
    | 'stringNotMatches'
  >
  text: ExtractOperatorTypes<
    | 'defined'
    | 'notDefined'
    | 'stringEqual'
    | 'stringMatches'
    | 'stringNotEqual'
    | 'stringNotMatches'
  >
  url: ExtractOperatorTypes<
    | 'defined'
    | 'notDefined'
    | 'stringEqual'
    | 'stringMatches'
    | 'stringNotEqual'
    | 'stringNotMatches'
  >
}

/**
 * @internal
 */
export type SupportedFieldType = Extract<keyof IntrinsicDefinitions, keyof FieldOperators>

/**
 * @internal
 */
export type SupportedCustomType = keyof CustomOperators

/**
 * @internal
 */
export type FilterDefinitions = {
  custom: {
    [K in keyof CustomOperators]: {
      icon: ComponentType
      initialOperator: CustomOperators[K]
      operators: (OperatorCustomItem<K> | OperatorDivider)[]
      title: string
    }
  }
  field: {
    [K in keyof FieldOperators]: {
      icon: ComponentType
      initialOperator: FieldOperators[K]
      operators: (OperatorFieldItem<K> | OperatorDivider)[]
    }
  }
}
