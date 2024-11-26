import {useCallback, useEffect, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {resolveBundlePerspective} from '../../util/resolvePerspective'
import {type ReleaseDocument} from '../store/types'
import {useReleases} from '../store/useReleases'
import {LATEST} from '../util/const'
import {getBundleIdFromReleaseDocumentId} from '../util/getBundleIdFromReleaseDocumentId'
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
  perspective: 'published' | `bundle.${string}` | undefined

  /* The excluded perspectives */
  excludedPerspectives: string[]
  /* Return the current global release */
  currentGlobalBundle: CurrentPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (perspectiveId: string) => void
  /* change the perspective in the studio based on a release ID */
  setPerspectiveFromReleaseDocumentId: (releaseDocumentId: string) => void
  setPerspectiveFromReleaseId: (releaseId: string) => void
  /* Add/remove excluded perspectives */
  toggleExcludedPerspective: (perspectiveId: string) => void
  /* Check if a perspective is excluded */
  isPerspectiveExcluded: (perspectiveId: string) => boolean
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  bundlesPerspective: string[]
  /* */
  currentGlobalBundleId: string
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
  const perspective = router.stickyParams.perspective as
    | 'published'
    | `bundle.${string}`
    | undefined

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
  )

  // TODO: Should it be possible to set the perspective within a pane, rather than globally?
  const setPerspective = useCallback(
    (releaseId: string | undefined) => {
      let perspectiveParam = ''

      if (releaseId === 'published') {
        perspectiveParam = 'published'
      } else if (releaseId !== 'drafts') {
        perspectiveParam = `bundle.${releaseId}`
      }

      router.navigateStickyParams({
        excludedPerspectives: '',
        perspective: perspectiveParam,
      })
    },
    [router],
  )

  const selectedBundle =
    perspective && releases
      ? releases.find(
          (release) => `bundle.${getBundleIdFromReleaseDocumentId(release._id)}` === perspective,
        )
      : LATEST

  // clear the perspective param when it is not an active release
  useEffect(() => {
    if (
      archivedReleases?.find(
        (release) => `bundle.${getBundleIdFromReleaseDocumentId(release._id)}` === perspective,
      )
    ) {
      setPerspective(LATEST._id)
    }
  }, [archivedReleases, perspective, selectedBundle, setPerspective])

  // TODO: Improve naming; this may not be global.
  const currentGlobalBundle: CurrentPerspective = useMemo(
    () => (perspective === 'published' ? perspective : selectedBundle || LATEST),
    [perspective, selectedBundle],
  )

  const setPerspectiveFromReleaseId = useCallback(
    (releaseId: string) => setPerspective(releaseId),
    [setPerspective],
  )

  const setPerspectiveFromReleaseDocumentId = useCallback(
    (releaseId: string) => setPerspectiveFromReleaseId(getBundleIdFromReleaseDocumentId(releaseId)),
    [setPerspectiveFromReleaseId],
  )

  const bundlesPerspective = useMemo(
    () =>
      getReleasesPerspective({
        releases,
        perspective,
        excluded: (excludedPerspectives.map(resolveBundlePerspective) as string[]) || [],
      }),
    [releases, perspective, excludedPerspectives],
  )

  const toggleExcludedPerspective = useCallback(
    (excluded: string) => {
      if (excluded === LATEST._id) return
      const existingPerspectives = excludedPerspectives || []

      const excludedPerspectiveId = isPublishedPerspective(excluded)
        ? 'published'
        : `bundle.${excluded}`

      const nextExcludedPerspectives = existingPerspectives.includes(excludedPerspectiveId)
        ? existingPerspectives.filter((id) => id !== excludedPerspectiveId)
        : [...existingPerspectives, excludedPerspectiveId]

      router.navigateStickyParams({excludedPerspectives: nextExcludedPerspectives.toString()})
    },
    [excludedPerspectives, router],
  )

  const isPerspectiveExcluded = useCallback(
    (perspectiveId: string) =>
      Boolean(
        excludedPerspectives?.includes(
          isPublishedPerspective(perspectiveId) ? 'published' : `bundle.${perspectiveId}`,
        ),
      ),
    [excludedPerspectives],
  )

  return useMemo(
    () => ({
      perspective,
      excludedPerspectives,
      setPerspective,
      setPerspectiveFromReleaseDocumentId: setPerspectiveFromReleaseDocumentId,
      setPerspectiveFromReleaseId: setPerspectiveFromReleaseId,
      toggleExcludedPerspective,
      currentGlobalBundle,
      currentGlobalBundleId: isPublishedPerspective(currentGlobalBundle)
        ? 'published'
        : currentGlobalBundle._id,
      bundlesPerspective,
      isPerspectiveExcluded,
    }),
    [
      perspective,
      excludedPerspectives,
      setPerspective,
      setPerspectiveFromReleaseDocumentId,
      setPerspectiveFromReleaseId,
      toggleExcludedPerspective,
      currentGlobalBundle,
      bundlesPerspective,
      isPerspectiveExcluded,
    ],
  )
}
