import type {PaneLayoutContextValue} from '../../structure/components/pane/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PaneLayoutContext = createContext<PaneLayoutContextValue | null>(
  'sanity/_singletons/context/pane-layout',
  null,
)
