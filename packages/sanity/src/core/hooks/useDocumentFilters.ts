import {useCallback, useMemo} from 'react'

import {type DocumentFilters, type DocumentFiltersContext} from '../config'
import {useWorkspace} from '../studio'

// interface DocumentFiltersOptions {
//   context: Omit<DocumentFiltersContext, keyof ConfigContext>
//   withFilters?: DocumentFilters
// }

type CombineFilters = (filters: Partial<DocumentFilters>) => DocumentFilters & {filter: string}

interface DocumentFiltersApi {
  filters: DocumentFilters
  combineFilters: CombineFilters
  filter: AppliedFilter
}

interface AppliedFilter {
  filter: string
  params: Record<string, unknown>
}

export function useDocumentFilters({
  listType,
}: Pick<DocumentFiltersContext, 'listType'>): DocumentFiltersApi {
  const {unstable_filters} = useWorkspace().document

  const workspaceFilters = useMemo(
    () => unstable_filters({listType: listType}),
    [unstable_filters, listType],
  )

  const combineFilters = useCallback<CombineFilters>(
    (filters) => applyFilters(workspaceFilters, filters),
    [workspaceFilters],
  )

  const filter = useMemo(() => applyFilters(workspaceFilters), [workspaceFilters])

  return {
    filter,
    combineFilters,
  }
}

// Combine and then apply!
export function applyFilters(
  ...filters: Partial<DocumentFilters>[]
): DocumentFilters & {filter: string} {
  return filters.reduce<DocumentFilters & {filter: string}>(
    (combinedFilters, filter) => {
      const nextCombinedFilters = combinedFilters.filters
        .concat(filter?.filters ?? [])
        .filter(Boolean)
      return {
        filter: nextCombinedFilters.join(' && '),
        filters: nextCombinedFilters,
        params: {
          ...combinedFilters.params,
          ...filter.params,
        },
      }
    },
    {
      filters: [],
      params: {},
      filter: '',
    },
  )
}

// export function combineFilters(...filters: DocumentFilters[]): DocumentFilters {
//   return filters.reduce<DocumentFilters>(
//     (combinedFilters, filter) => ({
//       filters: combinedFilters.filters.concat(filter.filters),
//       params: {
//         ...combinedFilters.params,
//         ...filter.params,
//       },
//     }),
//     {
//       filters: [],
//       params: {},
//     },
//   )
// }
