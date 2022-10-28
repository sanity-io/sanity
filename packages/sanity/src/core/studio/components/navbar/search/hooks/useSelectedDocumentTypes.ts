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

    // Document types from active filters
    /*
    const filterDocumentTypes = filters.reduce<string[]>((acc, val) => {
      acc.push(...(val?.documentTypes || []))
      return acc
    }, [])
    */

    return uniq([
      ...selectedDocumentTypes,
      // ...filterDocumentTypes
    ]).sort()
  }, [filters, types])

  return currentDocumentTypes
}
