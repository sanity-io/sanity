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
    // Keep base list params authoritative so a menu option cannot accidentally
    // change the list's type constraint or other structural parameters.
    params: Object.assign({}, ...selectedFilters.map((item) => item.params), params),
  }
}
