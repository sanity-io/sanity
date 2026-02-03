import type {PaneContextValue} from '../../structure/components/pane/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PaneContext = createContext<PaneContextValue | null>(
  'sanity/_singletons/context/pane',
  null,
)
