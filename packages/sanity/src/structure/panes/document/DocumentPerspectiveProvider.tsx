import {type ReactNode} from 'react'
import {PerspectiveProvider, usePerspective} from 'sanity'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'

// Clears URL for cardinality one releases when document doesn't exist in selected release

/**
 * @internal
 * Exposes cardinality one releases as selectedPerspective through PerspectiveContext
 */
export function DocumentPerspectiveProvider({children}: {children: ReactNode}) {
  const paneRouter = usePaneRouter()
  const {selectedPerspectiveName, excludedPerspectives} = usePerspective()
  const {scheduledDraft} = paneRouter.params as {scheduledDraft?: string}

  return (
    <PerspectiveProvider
      selectedPerspectiveName={scheduledDraft || selectedPerspectiveName}
      excludedPerspectives={excludedPerspectives}
    >
      {children}
    </PerspectiveProvider>
  )
}
