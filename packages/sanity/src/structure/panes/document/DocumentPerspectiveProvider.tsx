import {type ReactNode} from 'react'
import {PerspectiveProvider, usePerspective} from 'sanity'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'

/**
 * @internal
 * Exposes cardinality one releases as selectedPerspective through PerspectiveContext
 */
export function DocumentPerspectiveProvider({children}: {children: ReactNode}) {
  const paneRouter = usePaneRouter()
  const {excludedPerspectives} = usePerspective()
  const {scheduledDraft} = paneRouter.params as {scheduledDraft?: string}
  if (scheduledDraft) {
    return (
      <PerspectiveProvider
        selectedPerspectiveName={scheduledDraft}
        excludedPerspectives={excludedPerspectives}
      >
        {children}
      </PerspectiveProvider>
    )
  }
  return children
}
