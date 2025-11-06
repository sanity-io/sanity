import {useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useWorkspace} from '../studio/workspace'
import {isSystemBundleName} from '../util/draftUtils'
import {EMPTY_ARRAY} from '../util/empty'
import {getSelectedPerspective} from './getSelectedPerspective'
import {type PerspectiveContextValue, type ReleaseId, type TargetPerspective} from './types'

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
  }, [selectedPerspectiveName, selectedPerspective, perspectiveStack, excludedPerspectives])

  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
