import {createContext} from 'sanity/_createContext'

import type {PaneLayoutContextValue} from '../../structure/components/pane/types'

/**
 * @internal
 */
export const PaneLayoutContext: React.Context<PaneLayoutContextValue | null> =
  createContext<PaneLayoutContextValue | null>('sanity/_singletons/context/pane-layout', null)
