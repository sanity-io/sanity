import {type ReactNode, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {useReleasesEnabled} from '../releases/hooks/useReleasesEnabled'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useWorkspace} from '../studio/workspace'
import {EMPTY_ARRAY} from '../util/empty'
import {PerspectiveProvider} from './PerspectiveProvider'
import {ResetArchivedReleasePerspective} from './ResetArchivedReleasePerspective'
import {ResetIgnoredPerspective} from './ResetIgnoredPerspective'
import {resolveStickyPerspectiveName} from './resolveStickyPerspectiveName'

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

  const {data: activeReleases, loading: activeLoading} = useActiveReleases()
  const releasesEnabled = useReleasesEnabled()
  const stickyPerspective = router.stickyParams.perspective ?? undefined
  const {name: selectedPerspectiveName, ignored} = useMemo(
    () =>
      resolveStickyPerspectiveName({
        perspective: stickyPerspective,
        activeReleases,
        releasesLoading: activeLoading,
        releasesEnabled,
        isDraftModelEnabled,
      }),
    [stickyPerspective, activeReleases, activeLoading, releasesEnabled, isDraftModelEnabled],
  )

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
  )

  const selectedVariantName =
    typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined

  return (
    <PerspectiveProvider
      selectedPerspectiveName={selectedPerspectiveName}
      selectedVariantName={selectedVariantName}
      excludedPerspectives={excludedPerspectives}
    >
      {children}
      <ResetArchivedReleasePerspective />
      <ResetIgnoredPerspective perspective={stickyPerspective} ignored={ignored} />
    </PerspectiveProvider>
  )
}
