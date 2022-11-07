import {ComponentType} from 'react'

/**
 * @internal
 */
export interface SearchOperatorBase {
  buttonLabel: string
  label: string
  type: string
}

export type SearchOperatorInput<TValue> = ComponentType<OperatorInputComponentProps<TValue>>

export interface OperatorInputComponentProps<T> {
  value: T | null
  onChange: (value: T | null) => void
}

export interface SearchOperatorBuilder<TType extends string, TValue> extends SearchOperatorBase {
  fn: (params: {fieldPath?: string; value?: TValue}) => string | null
  initialValue: TValue | null
  inputComponent: SearchOperatorInput<TValue>
  type: TType
}

export type ValuelessSearchOperatorBuilder<TType extends string> = SearchOperatorBase & {
  fn: (params: {fieldPath?: string}) => string | null
  initialValue?: never
  inputComponent?: never
  type: TType
}

export interface SearchOperator extends SearchOperatorBase {
  fn: (params: {fieldPath?: string; value?: any}) => string | null
  initialValue?: unknown
  inputComponent?: SearchOperatorInput<any>
  type: string
}

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
