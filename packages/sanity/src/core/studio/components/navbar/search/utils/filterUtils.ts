import type {ResolvedField, SearchFilter} from '../types'

export function getFieldFromFilter(
  fields: ResolvedField[],
  filter: SearchFilter
): ResolvedField | undefined {
  return fields.find(
    (field) => field.filterType === filter.filterType && field.fieldPath === filter.fieldPath
  )
}

export function getFilterKey(filter: SearchFilter): string {
  return [filter.filterType, ...(filter.fieldPath ? [filter.fieldPath] : [])].join('-')
}
