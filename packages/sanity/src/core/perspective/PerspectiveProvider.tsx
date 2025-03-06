import {useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {isSystemBundleName} from '../util/draftUtils'
import {EMPTY_ARRAY} from '../util/empty'
import {getSelectedPerspective} from './getSelectedPerspective'
import {type PerspectiveContextValue, type ReleaseId, type SelectedPerspective} from './types'

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

  const selectedPerspective: SelectedPerspective = useMemo(
    () => getSelectedPerspective(selectedPerspectiveName, releases),
    [selectedPerspectiveName, releases],
  )

  const perspectiveStack = useMemo(
    () =>
      getReleasesPerspectiveStack({
        releases,
        selectedPerspectiveName,
        excludedPerspectives,
      }),
    [releases, selectedPerspectiveName, excludedPerspectives],
  )

  const value: PerspectiveContextValue = useMemo(
    () => ({
      selectedPerspective,
      selectedPerspectiveName,
      selectedReleaseId: isSystemBundleName(selectedPerspectiveName)
        ? undefined
        : selectedPerspectiveName,
      perspectiveStack,
      excludedPerspectives,
    }),
    [selectedPerspective, selectedPerspectiveName, perspectiveStack, excludedPerspectives],
  )
  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
