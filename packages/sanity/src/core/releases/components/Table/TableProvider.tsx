import {useState} from 'react'
import {TableContext} from 'sanity/_singletons'

/**
 * @internal
 */
export const TableProvider = ({children}: {children: React.ReactNode}): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [sort, setSort] = useState<{column: string; direction: 'asc' | 'desc'} | null>(null)

  const setSearchColumn = (newColumn: string) => {
    setSort((s) => {
      if (s?.column === newColumn) {
        return {...s, direction: s.direction === 'asc' ? 'desc' : 'asc'}
      }

      return {column: String(newColumn), direction: 'desc'}
    })
  }

  const contextValue = {searchTerm, setSearchTerm, sort, setSearchColumn}

  return <TableContext.Provider value={contextValue}>{children}</TableContext.Provider>
}
