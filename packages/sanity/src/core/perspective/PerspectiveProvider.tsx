import {type ReleaseId} from '@sanity/client'
import {useCallback, useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {getReleasesPerspectiveStack} from '../releases/hooks/utils'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type PerspectiveContextValue, type SelectedPerspective} from './types'

/**
 * @internal
 */
export function PerspectiveProvider({
  children,
  selectedPerspectiveName,
  excludedPerspectives,
}: {
  children: React.ReactNode

  selectedPerspectiveName: 'published' | ReleaseId | undefined
  excludedPerspectives: string[]
}) {
  const router = useRouter()
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

  const toggleExcludedPerspective = useCallback(
    (excluded: string) => {
      const existingPerspectives = excludedPerspectives || []

      const nextExcludedPerspectives = existingPerspectives.includes(excluded)
        ? existingPerspectives.filter((id) => id !== excluded)
        : [...existingPerspectives, excluded]

      router.navigateStickyParams({excludedPerspectives: nextExcludedPerspectives.toString()})
    },
    [excludedPerspectives, router],
  )

  const isPerspectiveExcluded = useCallback(
    (perspectiveId: string) => Boolean(excludedPerspectives?.includes(perspectiveId)),
    [excludedPerspectives],
  )

  const value: PerspectiveContextValue = useMemo(
    () => ({
      selectedPerspective,
      selectedPerspectiveName,
      selectedReleaseId:
        selectedPerspectiveName === 'published' ? undefined : selectedPerspectiveName,
      perspectiveStack,

      toggleExcludedPerspective,
      isPerspectiveExcluded,
    }),
    [
      selectedPerspectiveName,
      toggleExcludedPerspective,
      selectedPerspective,
      perspectiveStack,
      isPerspectiveExcluded,
    ],
  )
  return <PerspectiveContext.Provider value={value}>{children}</PerspectiveContext.Provider>
}
