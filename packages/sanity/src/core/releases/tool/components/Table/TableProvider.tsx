import {type ComponentType, type PropsWithChildren, useCallback, useContext, useState} from 'react'
import {TableContext} from 'sanity/_singletons'

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
}

/**
 * @internal
 */
export interface TableContextValue {
  searchTerm: string | null
  setSearchTerm: (searchTerm: string) => void
  sort: TableSort | null
  setSortColumn: (column: string) => void
}

/**
 * @internal
 */
export const TableProvider: ComponentType<PropsWithChildren & {defaultSort?: TableSort}> = ({
  children,
  defaultSort,
}) => {
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [sort, setSort] = useState<TableSort | null>(defaultSort || null)

  const setSortColumn = useCallback((newColumn: string) => {
    setSort((s) => {
      if (s?.column === newColumn) {
        return {...s, direction: s.direction === 'asc' ? 'desc' : 'asc'}
      }

      return {column: String(newColumn), direction: 'desc'}
    })
  }, [])

  const contextValue = {searchTerm, setSearchTerm, sort, setSortColumn}

  return <TableContext.Provider value={contextValue}>{children}</TableContext.Provider>
}

/**
 * @internal
 */
export const useTableContext = (): TableContextValue => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider')
  }
  return context
}
