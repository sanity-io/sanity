import {createContext} from 'react'

import type {TableContextValue} from '../../core/releases/tool/components/Table/TableProvider'

/**
 * @internal
 */
export const TableContext = createContext<TableContextValue | null>(null)
