import type {TableContextValue} from '../../core/releases/tool/components/Table/TableProvider'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const TableContext = createContext<TableContextValue | null>(
  'sanity/_singletons/context/releases-table',
  null,
)
