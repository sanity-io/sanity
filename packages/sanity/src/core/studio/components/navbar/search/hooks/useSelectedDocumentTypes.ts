import {intersection} from 'lodash'
import uniq from 'lodash/uniq'
import {useMemo} from 'react'
import {useSearchState} from '../contexts/search/useSearchState'

export function useSelectedDocumentTypes(): string[] {
  const {
    state: {
      terms: {filters, types},
    },
  } = useSearchState()

  const currentDocumentTypes = useMemo(() => {
    // Selected document types
    const selectedDocumentTypes = types.map((type) => type.name)

    const unionFilterDocumentTypes = intersection(
      ...filters
        .filter((filter) => filter.type === 'field')
        .map((filter) => filter.documentTypes || [])
    )

    return uniq(
      selectedDocumentTypes.length > 0 && unionFilterDocumentTypes.length > 0
        ? intersection(selectedDocumentTypes, unionFilterDocumentTypes)
        : [
            ...selectedDocumentTypes, //
            ...unionFilterDocumentTypes,
          ]
    ).sort()
  }, [filters, types])

  return currentDocumentTypes
}
