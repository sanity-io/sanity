import {type ReactNode, useContext} from 'react'
import {PaneFeaturesContext} from 'sanity/_singletons'

import {type PaneFeatures} from './types/paneFeatures'

/**
 * The defaults applied when no host provides pane features. These mirror the
 * features the structure tool advertises when its layout is not collapsed,
 * minus the back button (which only makes sense with a pane navigation stack).
 */
const DEFAULT_FEATURES: PaneFeatures = {
  backButton: false,
  resizablePanes: true,
  reviewChanges: true,
  splitPanes: true,
  splitViews: true,
}

/**
 * Read the pane features supported by the current host.
 *
 * @internal
 */
export function usePaneFeatures(): PaneFeatures {
  return useContext(PaneFeaturesContext) ?? DEFAULT_FEATURES
}

/**
 * Provide the pane features supported by the host rendering panes.
 *
 * @internal
 */
export function PaneFeaturesProvider(props: {children: ReactNode; features: PaneFeatures}) {
  const {children, features} = props
  return <PaneFeaturesContext.Provider value={features}>{children}</PaneFeaturesContext.Provider>
}
