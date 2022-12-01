import {ComponentType} from 'react'
import {SearchOperatorBase, SearchOperatorInput, SearchOperatorParams} from './operatorTypes'

/** @internal */
export interface SearchOperatorDefinition<TValue = any> extends SearchOperatorBase {
  buttonValueComponent?: ComponentType<{value: TValue}>
  fn: (params: SearchOperatorParams<TValue>) => string | null
  initialValue?: TValue
  inputComponent?: SearchOperatorInput<TValue>
  type: string
}

export function getOperator(
  operators: SearchOperatorDefinition[],
  operatorType?: string
): SearchOperatorDefinition | undefined {
  return operatorType ? operators.find((f) => f.type === operatorType) : undefined
}

export function getOperatorInitialValue(
  operators: SearchOperatorDefinition[],
  operatorType?: string
): SearchOperatorDefinition['initialValue'] | undefined {
  return getOperator(operators, operatorType)?.initialValue
}
