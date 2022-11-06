import intersection from 'lodash/intersection'
import union from 'lodash/union'
import {useMemo} from 'react'
import {useSearchState} from '../contexts/search/useSearchState'

/**
 * Returns all 'available' document type names based on current selected document types + filters.
 * If a user has selected both document types and filters, return an intersection of types.
 */
export function useAvailableDocumentTypes(): string[] {
  const {
    state: {
      terms: {filters, types},
    },
  } = useSearchState()

  const currentDocumentTypes = useMemo(() => {
    // Selected document types
    const selectedDocumentTypes = types.map((type) => type.name)
    // Intersecting document types across all filters
    const intersectionFilterDocumentTypes = intersection(
      ...filters.map((filter) => filter.documentTypes || [])
    )

    const hasSelectedDocumentTypes = types.length > 0
    const hasFilters = filters.length > 0

    if (hasSelectedDocumentTypes && hasFilters) {
      return intersection(selectedDocumentTypes, intersectionFilterDocumentTypes)
    }
    return union(selectedDocumentTypes, intersectionFilterDocumentTypes)
  }, [filters, types])

  return currentDocumentTypes
}
