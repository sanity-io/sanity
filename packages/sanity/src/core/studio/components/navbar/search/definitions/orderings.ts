import type {SearchOrdering} from '../types'

export const ORDERINGS: Record<string, SearchOrdering> = {
  createdAsc: {
    ignoreScore: true,
    sort: {direction: 'asc', field: '_createdAt'},
    title: 'Created: Oldest first',
  },
  createdDesc: {
    ignoreScore: true,
    sort: {direction: 'desc', field: '_createdAt'},
    title: 'Created: Newest first',
  },
  relevance: {
    customMeasurementLabel: 'relevance',
    sort: {direction: 'desc', field: '_updatedAt'},
    title: 'Best match',
  },
  updatedAsc: {
    ignoreScore: true,
    sort: {direction: 'asc', field: '_updatedAt'},
    title: 'Updated: Oldest first',
  },
  updatedDesc: {
    ignoreScore: true,
    sort: {direction: 'desc', field: '_updatedAt'},
    title: 'Updated: Newest first',
  },
}
