import {useCallback, useEffect, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {type ReleaseDocument} from '../store/types'
import {useReleases} from '../store/useReleases'
import {LATEST} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../util/util'
import {getReleasesPerspective} from './utils'

/**
 * @internal
 */
export type CurrentPerspective = ReleaseDocument | 'published' | typeof LATEST

/**
 * @internal
 */
export interface PerspectiveValue {
  /* The current perspective */
  selectedPerspectiveName: 'published' | `r${string}` | undefined
  selectedReleaseId: `r${string}` | undefined

  /* Return the current global release */
  selectedPerspective: CurrentPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (perspectiveId: string) => void
  /* change the perspective in the studio based on a release ID */
  setPerspectiveFromReleaseDocumentId: (releaseDocumentId: string) => void
  setPerspectiveFromReleaseId: (releaseId: string) => void
  /* Add/remove excluded perspectives */
  toggleExcludedPerspective: (perspectiveId: string) => void
  /* Check if a perspective is excluded */
  isPerspectiveExcluded: (perspectiveId: string) => boolean
  /* The excluded perspectives */
  excludedPerspectives: string[]
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  perspectiveStack: string[]
  /* */
  globalReleaseDocumentId: string
}

const EMPTY_ARRAY: string[] = []
/**
 * TODO: Improve distinction between global and pane perspectives.
 *
 * @internal
 */
export function usePerspective(): PerspectiveValue {
  const router = useRouter()
  const {data: releases, archivedReleases} = useReleases()
  // TODO: Actually validate the perspective value, if it's not a valid perspective, we should fallback to undefined
  const currentPerspectiveName = router.stickyParams.perspective as
    | 'published'
    | `r${string}`
    | undefined

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
  )

  // TODO: Should it be possible to set the perspective within a pane, rather than globally?
  const setPerspective = useCallback(
    (releaseId: string | undefined) => {
      let perspectiveParam = ''

      if (!releaseId) {
        perspectiveParam = ''
      } else if (releaseId === 'published') {
        perspectiveParam = 'published'
      } else if (releaseId !== 'drafts') {
        perspectiveParam = releaseId
      }

      router.navigateStickyParams({
        excludedPerspectives: '',
        perspective: perspectiveParam,
      })
    },
    [router],
  )

  const selectedBundle =
    currentPerspectiveName && releases
      ? releases.find(
          (release) => getReleaseIdFromReleaseDocumentId(release._id) === currentPerspectiveName,
        )
      : LATEST

  // clear the perspective param when it is not an active release
  useEffect(() => {
    if (
      archivedReleases?.find(
        (release) => getReleaseIdFromReleaseDocumentId(release._id) === currentPerspectiveName,
      )
    ) {
      setPerspective(LATEST._id)
    }
  }, [archivedReleases, currentPerspectiveName, selectedBundle, setPerspective])

  const currentPerspective: CurrentPerspective = useMemo(
    () =>
      currentPerspectiveName === 'published' ? currentPerspectiveName : selectedBundle || LATEST,
    [currentPerspectiveName, selectedBundle],
  )

  const setPerspectiveFromReleaseId = useCallback(
    (releaseId: string) => setPerspective(releaseId),
    [setPerspective],
  )

  const setPerspectiveFromReleaseDocumentId = useCallback(
    (releaseId: string) =>
      setPerspectiveFromReleaseId(getReleaseIdFromReleaseDocumentId(releaseId)),
    [setPerspectiveFromReleaseId],
  )

  const perspective = useMemo(
    () =>
      getReleasesPerspective({
        releases,
        selectedPerspective: currentPerspectiveName,
        excluded: excludedPerspectives,
      }),
    [releases, currentPerspectiveName, excludedPerspectives],
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

  return useMemo(
    () => ({
      selectedPerspectiveName: currentPerspectiveName,
      selectedReleaseId:
        currentPerspectiveName === 'published' ? undefined : currentPerspectiveName,
      excludedPerspectives,
      setPerspective,
      setPerspectiveFromReleaseDocumentId: setPerspectiveFromReleaseDocumentId,
      setPerspectiveFromReleaseId: setPerspectiveFromReleaseId,
      toggleExcludedPerspective,
      selectedPerspective: currentPerspective,
      globalReleaseDocumentId: isPublishedPerspective(currentPerspective)
        ? 'published'
        : currentPerspective._id,
      perspectiveStack: perspective,
      isPerspectiveExcluded,
    }),
    [
      currentPerspectiveName,
      excludedPerspectives,
      setPerspective,
      setPerspectiveFromReleaseDocumentId,
      setPerspectiveFromReleaseId,
      toggleExcludedPerspective,
      currentPerspective,
      perspective,
      isPerspectiveExcluded,
    ],
  )
}
