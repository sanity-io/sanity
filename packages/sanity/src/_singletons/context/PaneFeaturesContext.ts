import {createContext} from 'sanity/_createContext'

import type {PaneFeatures} from '../../core/panes/types/paneFeatures'

/**
 * @internal
 */
export const PaneFeaturesContext = createContext<PaneFeatures | null>(
  'sanity/_singletons/context/pane-features',
  null,
)
