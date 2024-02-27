interface DocumentSearchOptions {
  // TODO
  // types: SearchableType[]
  types: any[]
  filter?: string
  params?: string
  tag?: string
  // TODO
  sort?: any
}

interface DocumentSearch {
  items: Array<{_id: string; _type: string}>
  length: number
  loading: boolean
  setSearch: (search: string) => void
  // loadUpUntilIndex: (index: number) => void
  notifyIndexViewed: (index: number) => void
  clear: () => void
  init: () => void
}

/**
 * @internal
 */
export function useDocumentSearch(options: DocumentSearchOptions): DocumentSearch {
  return {
    items: [],
    length: 0,
    loading: false,
    setSearch: () => {},
    notifyIndexViewed: () => {},
    clear: () => {},
    init: () => {},
  }
}
