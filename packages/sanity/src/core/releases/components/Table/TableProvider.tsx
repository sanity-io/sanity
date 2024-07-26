import {type ComponentType, type PropsWithChildren, useCallback, useState} from 'react'
import {TableContext} from 'sanity/_singletons'

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
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
