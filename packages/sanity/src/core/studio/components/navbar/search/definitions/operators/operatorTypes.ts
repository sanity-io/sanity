import {ComponentType} from 'react'

/**
 * @alpha
 */
export interface SearchOperatorBase {
  buttonLabel: string
  label: string
  icon?: ComponentType
  type: string
}

/**
 * @alpha
 */
export type SearchOperatorInput<TValue> = ComponentType<OperatorInputComponentProps<TValue>>

/**
 * @alpha
 */
export interface OperatorInputComponentProps<T> {
  value: T | null
  onChange: (value: T | null) => void
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
export interface SearchOperatorBuilder<TType extends string, TValue> extends SearchOperatorBase {
  fn: (params: SearchOperatorParams<TValue>) => string | null
  initialValue: TValue | null
  inputComponent: SearchOperatorInput<TValue>
  type: TType
}

/**
 * @alpha
 */
export interface ValuelessSearchOperatorBuilder<TType extends string> extends SearchOperatorBase {
  fn: (params: ValuelessSearchOperatorParams) => string | null
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
    | {type: TType; inputComponent: SearchOperatorInput<TValue>}
>(
  definition: (TOperatorSnippet extends {
    type: TType
    inputComponent: SearchOperatorInput<TValue>
  }
    ? SearchOperatorBuilder<TType, TValue>
    : ValuelessSearchOperatorBuilder<TType>) &
    TOperatorSnippet
): typeof definition {
  return definition
}
