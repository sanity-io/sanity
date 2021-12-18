import {SortOrdering} from '@sanity/types'

export const ORDER_BY_UPDATED_AT: SortOrdering = {
  title: 'Last edited',
  name: 'updatedAt',
  by: [{field: '_updatedAt', direction: 'desc'}],
}

export const ORDER_BY_CREATED_AT: SortOrdering = {
  title: 'Created',
  name: 'createdAt',
  by: [{field: '_createdAt', direction: 'desc'}],
}

export const DEFAULT_SELECTED_ORDERING_OPTION: SortOrdering = ORDER_BY_UPDATED_AT

export const DEFAULT_ORDERING_OPTIONS: SortOrdering[] = [
  ORDER_BY_UPDATED_AT, // _updatedAt
  ORDER_BY_CREATED_AT, // _createdAt
]
