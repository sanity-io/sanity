export type SortDirection = 'asc' | 'desc'

export interface SortItem {
  field: string
  direction: SortDirection
}

export interface Ordering {
  title: string
  name?: string
  by: SortItem[]
}

export const ORDER_BY_UPDATED_AT: Ordering = {
  title: 'Last edited',
  name: 'updatedAt',
  by: [{field: '_updatedAt', direction: 'desc'}]
}

export const ORDER_BY_CREATED_AT: Ordering = {
  title: 'Created',
  name: 'createdAt',
  by: [{field: '_createdAt', direction: 'desc'}]
}

export const DEFAULT_SELECTED_ORDERING_OPTION: Ordering = ORDER_BY_UPDATED_AT

export const DEFAULT_ORDERING_OPTIONS: Ordering[] = [
  ORDER_BY_UPDATED_AT, // _updatedAt
  ORDER_BY_CREATED_AT // _createdAt
]
