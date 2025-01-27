import {type ReleaseId} from '@sanity/client'
import {useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {EMPTY_ARRAY} from '../util/empty'
import {type PerspectiveContextValue, type SelectedPerspective} from './types'

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

  const selectedPerspective: SelectedPerspective = useMemo(() => {
    if (!selectedPerspectiveName) return 'drafts'
    if (selectedPerspectiveName === 'published') return 'published'
    const selectedRelease = releases.find(
      (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedPerspectiveName,
    )
    return selectedRelease || 'drafts'
  }, [selectedPerspectiveName, releases])

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
      selectedReleaseId:
        selectedPerspectiveName === 'published' ? undefined : selectedPerspectiveName,
      perspectiveStack,
      excludedPerspectives,
    }),
    [selectedPerspective, selectedPerspectiveName, perspectiveStack, excludedPerspectives],
  )
  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
