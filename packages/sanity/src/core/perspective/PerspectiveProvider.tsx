import {type ReleaseDocument} from '@sanity/client'
import {type ComponentProps, useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../releases/util/util'
import {useWorkspace} from '../studio/workspace'
import {isSystemBundleName} from '../util/draftUtils'
import {EMPTY_ARRAY} from '../util/empty'
import {isCardinalityOneRelease} from '../util/releaseUtils'
import {getSelectedPerspective} from './getSelectedPerspective'
import {type PerspectiveContextValue, type ReleaseId, type TargetPerspective} from './types'

function findCardinalityOneReleaseFromPerspective(
  perspectiveName: ComponentProps<typeof PerspectiveProvider>['selectedPerspectiveName'],
  releases: ReleaseDocument[],
) {
  if (!perspectiveName || isPublishedPerspective(perspectiveName)) return null

  const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === perspectiveName)

  return release && isCardinalityOneRelease(release) ? release : null
}

/**
 * @internal
 */
export function PerspectiveProvider({
  children,
  selectedPerspectiveName,
  excludedPerspectives = EMPTY_ARRAY,
}: {
  children: React.ReactNode
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  excludedPerspectives?: string[]
}) {
  const {data: releases} = useActiveReleases()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()
  const defaultPerspective = useMemo(
    () => (isDraftModelEnabled ? LATEST : PUBLISHED),
    [isDraftModelEnabled],
  )

  const selectedPerspective: TargetPerspective = useMemo(
    () => getSelectedPerspective(selectedPerspectiveName, releases),
    [selectedPerspectiveName, releases],
  )

  const perspectiveStack = useMemo(
    () =>
      getReleasesPerspectiveStack({
        releases,
        selectedPerspectiveName,
        excludedPerspectives,
        isDraftModelEnabled,
      }),
    [releases, selectedPerspectiveName, excludedPerspectives, isDraftModelEnabled],
  )

  const value: PerspectiveContextValue = useMemo(() => {
    // Check if we're dealing with a cardinality one release
    const cardinalityOneRelease = findCardinalityOneReleaseFromPerspective(
      selectedPerspectiveName,
      releases,
    )

    if (cardinalityOneRelease) {
      // Map cardinality one releases to defaultPerspective (drafts or published in the case of draft model disabled) for UI consistency
      return {
        selectedPerspective: defaultPerspective,
        selectedPerspectiveName: undefined,
        selectedReleaseId: undefined,
        perspectiveStack,
        excludedPerspectives,
      }
    }

    // For regular releases and published, use as-is
    return {
      selectedPerspective,
      selectedPerspectiveName,
      selectedReleaseId: isSystemBundleName(selectedPerspectiveName)
        ? undefined
        : selectedPerspectiveName,
      perspectiveStack,
      excludedPerspectives,
    }
  }, [
    selectedPerspectiveName,
    releases,
    selectedPerspective,
    perspectiveStack,
    excludedPerspectives,
    defaultPerspective,
  ])

  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
