import {type ReactNode, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {PUBLISHED} from '../releases/util/const'
import {useWorkspace} from '../studio/workspace'
import {EMPTY_ARRAY} from '../util/empty'
import {PerspectiveProvider} from './PerspectiveProvider'
import {type ReleaseId} from './types'

/**
 * This component is not meant to be exported by `sanity`, it's meant only for internal use from the `<StudioProvider>` file.
 * It sets the `<PerspectiveProvider>` listening to the changes happening in the router.
 *
 * If you need to add the PerspectiveProvider you should use that component directly.
 * It's up to you to define how the selectedPerspectiveName and excludedPerspectives should worl.
 */
export function GlobalPerspectiveProvider({children}: {children: ReactNode}) {
  const router = useRouter()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  let selectedPerspectiveName = router.stickyParams.perspective as
    | 'published'
    | ReleaseId
    | undefined

  if (!isDraftModelEnabled && typeof selectedPerspectiveName === 'undefined') {
    selectedPerspectiveName = PUBLISHED
  }

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
  )

  return (
    <PerspectiveProvider
      selectedPerspectiveName={selectedPerspectiveName}
      excludedPerspectives={excludedPerspectives}
    >
      {children}
    </PerspectiveProvider>
  )
}
