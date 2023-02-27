import type {SearchFilterDefinition, SearchFilterDefinitionDictionary} from '../definitions/filters'

export function createFilterDefinitionDictionary(
  filterDefinitions: SearchFilterDefinition[]
): SearchFilterDefinitionDictionary {
  return filterDefinitions.reduce<SearchFilterDefinitionDictionary>((acc, val) => {
    acc[val.name] = val
    return acc
  }, {})
}
