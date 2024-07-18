import {createContext, useContext} from 'react'

/**
 * @internal
 */
export interface TableContextValue {
  searchTerm: string | null
  setSearchTerm: (searchTerm: string) => void
  sort: {column: string; direction: 'asc' | 'desc'} | null
  setSearchColumn: (column: string) => void
}

const DEFAULT_TABLE_CONTEXT: TableContextValue = {
  searchTerm: null,
  setSearchTerm: () => null,
  sort: null,
  setSearchColumn: () => null,
}

/**
 * @internal
 */
export const TableContext = createContext<TableContextValue | null>(null)

/**
 * @internal
 */
export const useTableContext = (): TableContextValue => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider')
  }
  return context || DEFAULT_TABLE_CONTEXT
}
