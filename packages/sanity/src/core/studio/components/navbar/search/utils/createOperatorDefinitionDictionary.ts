import type {
  SearchOperatorDefinition,
  SearchOperatorDefinitionDictionary,
} from '../definitions/operators'

export function createOperatorDefinitionDictionary(
  operatorDefinitions: SearchOperatorDefinition[]
): SearchOperatorDefinitionDictionary {
  return operatorDefinitions.reduce<SearchOperatorDefinitionDictionary>((acc, val) => {
    acc[val.type] = val
    return acc
  }, {})
}
