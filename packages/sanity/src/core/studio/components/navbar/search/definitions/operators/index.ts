import {SearchOperatorBase, SearchOperatorInput, SearchOperatorParams} from './operatorTypes'

export interface SearchOperator extends SearchOperatorBase {
  fn: (params: SearchOperatorParams<any>) => string | null
  initialValue?: any
  inputComponent?: SearchOperatorInput<any>
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
