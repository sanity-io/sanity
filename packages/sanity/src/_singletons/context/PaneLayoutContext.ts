import {createContext} from 'sanity/_createContext'

import type {PaneLayoutContextValue} from '../../core/panes/components/pane/types'

/**
 * @internal
 */
export const PaneLayoutContext = createContext<PaneLayoutContextValue | null>(
  'sanity/_singletons/context/pane-layout',
  null,
)
