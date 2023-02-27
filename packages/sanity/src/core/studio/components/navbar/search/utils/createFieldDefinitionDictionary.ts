import type {SearchFieldDefinition, SearchFieldDefinitionDictionary} from '../types'

export function createFieldDefinitionDictionary(
  fieldDefinitions: SearchFieldDefinition[]
): SearchFieldDefinitionDictionary {
  return fieldDefinitions.reduce<SearchFieldDefinitionDictionary>((acc, val) => {
    acc[val.id] = val
    return acc
  }, {})
}
