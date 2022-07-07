import {ObjectSchemaType, SchemaType} from '@sanity/types'
import {getRootType, sortTypes} from '../utils/helpers'
import {SearchReducerState} from './search-reducer'

export function getSelectableTypes(
  schema: {
    get: (typeName: string) => SchemaType | undefined
    getTypeNames(): string[]
  },
  selectedTypes: SchemaType[],
  typeFilter: string
): ObjectSchemaType[] {
  return schema
    .getTypeNames()
    .map((n) => schema.get(n))
    .filter((s): s is ObjectSchemaType => s && s.jsonType === 'object')
    .filter((s) => getRootType(s)?.name === 'document' && s.name !== 'document')
    .filter((s) => !selectedTypes.includes(s))
    .filter(
      (t) => !typeFilter || (t.title ?? t.name).toLowerCase().includes(typeFilter?.toLowerCase())
    )
    .sort(sortTypes)
}

export function showNoResults({result: {loading, hits}, terms}: SearchReducerState): boolean {
  return hits.length === 0 && terms.query !== '' && !loading
}

export function showRecentSearches({result: {loading}, terms}: SearchReducerState): boolean {
  return !loading && terms.query === '' && !terms.types.length
}

export function showResults({result: {loading, hits}}: SearchReducerState): boolean {
  return !loading && hits.length > 0
}
