import type {SearchOrdering} from '../types'

export const ORDERINGS: Record<string, SearchOrdering> = {
  createdAsc: {
    ignoreScore: true,
    sort: {direction: 'asc', field: '_createdAt'},
    titleKey: 'search.ordering.created-ascending-label',
  },
  createdDesc: {
    ignoreScore: true,
    sort: {direction: 'desc', field: '_createdAt'},
    titleKey: 'search.ordering.created-descending-label',
  },
  relevance: {
    customMeasurementLabel: 'relevance',
    sort: {direction: 'desc', field: '_updatedAt'},
    titleKey: 'search.ordering.best-match-label',
  },
  updatedAsc: {
    ignoreScore: true,
    sort: {direction: 'asc', field: '_updatedAt'},
    titleKey: 'search.ordering.updated-ascending-label',
  },
  updatedDesc: {
    ignoreScore: true,
    sort: {direction: 'desc', field: '_updatedAt'},
    titleKey: 'search.ordering.updated-descending-label',
  },
}
