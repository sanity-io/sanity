import {SearchOperatorBase, SearchOperatorInput, SearchOperatorParams} from './operatorTypes'

/** @internal */
export interface SearchOperator<TValue = any> extends SearchOperatorBase {
  fn: (params: SearchOperatorParams<TValue>) => string | null
  initialValue?: TValue
  inputComponent?: SearchOperatorInput<TValue>
  type: string
}

export function getOperator(
  operators: SearchOperator[],
  operatorType?: string
): SearchOperator | undefined {
  return operatorType ? operators.find((f) => f.type === operatorType) : undefined
}

export function getOperatorInitialValue(
  operators: SearchOperator[],
  operatorType?: string
): SearchOperator['initialValue'] | undefined {
  return getOperator(operators, operatorType)?.initialValue
}
