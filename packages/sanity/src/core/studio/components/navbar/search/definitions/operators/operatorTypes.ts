import {ComponentType} from 'react'

/**
 * @internal
 */
export interface SearchOperatorBase {
  buttonLabel: string
  label: string
  icon?: ComponentType
  type: string
}

export type SearchOperatorInput<TValue> = ComponentType<OperatorInputComponentProps<TValue>>

export interface OperatorInputComponentProps<T> {
  value: T | null
  onChange: (value: T | null) => void
}

export type SearchOperatorParams<TValue> = {fieldPath?: string; value?: TValue}
export type ValuelessSearchOperatorParams = {fieldPath?: string}

export interface SearchOperatorBuilder<TType extends string, TValue> extends SearchOperatorBase {
  fn: (params: SearchOperatorParams<TValue>) => string | null
  initialValue: TValue | null
  inputComponent: SearchOperatorInput<TValue>
  type: TType
}

export interface ValuelessSearchOperatorBuilder<TType extends string> extends SearchOperatorBase {
  fn: (params: ValuelessSearchOperatorParams) => string | null
  initialValue?: never
  inputComponent?: never
  type: TType
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
