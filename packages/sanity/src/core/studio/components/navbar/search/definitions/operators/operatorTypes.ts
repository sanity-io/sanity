import {ComponentType} from 'react'
import type {SearchFieldDefinition} from '../fields'
import {LocaleSource} from '../../../../../../i18n'

/**
 * @alpha
 */
export type I18nSearchOperatorNameKey = `search.operator.${Lowercase<string>}.name`

/**
 * @alpha
 */
export type I18nSearchOperatorDescriptionKey = `search.operator.${Lowercase<string>}.description`

/**
 * @alpha
 */
export interface SearchOperatorBase {
  /** i18n resource key for the "name", eg `quantity is` or `contains` */
  nameKey: I18nSearchOperatorNameKey

  /** i18n resource key for the "name", eg `quantity is` or `contains` */
  descriptionKey: I18nSearchOperatorDescriptionKey

  /** icon for explaining the operator (React component) */
  icon?: ComponentType

  /** name/type of operator, eg `arrayCountEqual` or `numberGt` */
  type: string
}

/**
 * @alpha
 */
export type SearchOperatorInput<TValue> = ComponentType<OperatorInputComponentProps<TValue>>

/**
 * @alpha
 */
export type SearchOperatorButtonValue<TValue> = ComponentType<
  OperatorButtonValueComponentProps<TValue>
>

/**
 * @alpha
 */
export interface OperatorButtonValueComponentProps<T> {
  value: T
}

/**
 * @alpha
 */
export interface OperatorInputComponentProps<T> {
  fieldDefinition?: SearchFieldDefinition
  onChange: (value: T | null) => void
  value: T | null
}

/**
 * @alpha
 */
export type SearchOperatorParams<TValue> = {fieldPath?: string; value?: TValue}

/**
 * @alpha
 */
export type ValuelessSearchOperatorParams = {fieldPath?: string}

/**
 * @alpha
 */
export type SearchValueFormatterContext = {
  i18n: LocaleSource
}

/**
 * @alpha
 */
export interface SearchOperatorBuilder<TType extends string, TValue> extends SearchOperatorBase {
  buttonValueComponent?: SearchOperatorButtonValue<TValue>
  groqFilter: (params: SearchOperatorParams<TValue>) => string | null
  initialValue: TValue | null
  inputComponent: SearchOperatorInput<TValue>
  type: TType
}

/**
 * @alpha
 */
export interface ValuelessSearchOperatorBuilder<TType extends string> extends SearchOperatorBase {
  buttonValueComponent?: never
  groqFilter: (params: ValuelessSearchOperatorParams) => string | null
  initialValue?: never
  inputComponent?: never
  type: TType
}

/**
 * @alpha
 */
export function defineSearchOperator<
  TType extends string,
  TValue extends unknown | never,
  TOperatorSnippet extends
    | {type: TType; inputComponent?: never}
    | {type: TType; inputComponent: SearchOperatorInput<TValue>},
>(
  definition: (TOperatorSnippet extends {
    type: TType
    inputComponent: SearchOperatorInput<TValue>
  }
    ? SearchOperatorBuilder<TType, TValue>
    : ValuelessSearchOperatorBuilder<TType>) &
    TOperatorSnippet,
): typeof definition {
  return definition
}
