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

export function createOperatorDefinitionDictionary(
  operatorDefinitions: SearchOperatorDefinition[],
): SearchOperatorDefinitionDictionary {
  return operatorDefinitions.reduce<SearchOperatorDefinitionDictionary>((acc, val) => {
    acc[val.type] = val
    return acc
  }, {})
}

export function getOperatorDefinition(
  operators: SearchOperatorDefinitionDictionary,
  operatorType?: string,
): SearchOperatorDefinition | undefined {
  return operatorType ? operators[operatorType] : undefined
}

export function getOperatorInitialValue(
  operators: SearchOperatorDefinitionDictionary,
  operatorType: string,
): SearchOperatorDefinition['initialValue'] | undefined {
  return getOperatorDefinition(operators, operatorType)?.initialValue
}

/** @internal */
export type SearchOperatorDefinitionDictionary = Record<
  SearchOperatorDefinition['type'],
  SearchOperatorDefinition
>
