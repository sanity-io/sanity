import {type DocumentListFilterOption} from '../../structureBuilder/DocumentList'

/**
 * Combines selected menu filters with a document list's base GROQ filter.
 *
 * @internal
 */
export function combineDocumentListFilters(options: {
  filter: string
  params: Record<string, unknown>
  selectedFilters: DocumentListFilterOption[]
}): {filter: string; params: Record<string, unknown>} {
  const {filter, params, selectedFilters} = options
  if (selectedFilters.length === 0) return {filter, params}

  return {
    filter: [filter, ...selectedFilters.map((item) => item.filter)]
      .map((item) => `(${item})`)
      .join(' && '),
    params: Object.assign({}, params, ...selectedFilters.map((item) => item.params)),
  }
}
