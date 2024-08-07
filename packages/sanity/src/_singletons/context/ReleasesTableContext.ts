import {createContext} from 'sanity/_createContext'

import type {TableContextValue} from '../../core/releases/components/Table/TableProvider'

/**
 * @internal
 */
export const TableContext = createContext<TableContextValue | null>(
  'sanity/_singletons/context/releases-table',
  null,
)
