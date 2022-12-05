import {
  SearchOperatorBase,
  SearchOperatorButtonValue,
  SearchOperatorInput,
  SearchOperatorParams,
} from './operatorTypes'

/** @internal */
export interface SearchOperatorDefinition<TValue = any> extends SearchOperatorBase {
  buttonValueComponent?: SearchOperatorButtonValue<TValue>
  groqFilter: (params: SearchOperatorParams<TValue>) => string | null
  initialValue?: TValue
  inputComponent?: SearchOperatorInput<TValue>
  type: string
}

export function getOperatorDefinition(
  operators: SearchOperatorDefinition[],
  operatorType?: string
): SearchOperatorDefinition | undefined {
  return operatorType ? operators.find((f) => f.type === operatorType) : undefined
}

export function getOperatorInitialValue(
  operators: SearchOperatorDefinition[],
  operatorType?: string
): SearchOperatorDefinition['initialValue'] | undefined {
  return getOperatorDefinition(operators, operatorType)?.initialValue
}
