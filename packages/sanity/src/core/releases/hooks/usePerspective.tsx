import {type ReleaseId} from '@sanity/client'
import {useCallback, useEffect, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {isSystemBundleName} from '../../util/draftUtils'
import {type ReleaseDocument} from '../store/types'
import {useReleases} from '../store/useReleases'
import {LATEST} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../util/util'
import {getReleasesPerspectiveStack} from './utils'

/**
 * @internal
 */
export type SelectedPerspective = ReleaseDocument | 'published' | 'drafts'

/**
 * @internal
 */
export interface PerspectiveValue {
  /* The selected perspective name, it could be a release or Published */
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  /**
   * The releaseId as r<string>; it will be undefined if the selected perspective is `published` or `drafts`
   */
  selectedReleaseId: ReleaseId | undefined

  /* Return the current global release */
  selectedPerspective: SelectedPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (perspectiveId: 'published' | 'drafts' | ReleaseId | undefined) => void
  /* Add/remove excluded perspectives */
  toggleExcludedPerspective: (perspectiveId: string) => void
  /* Check if a perspective is excluded */
  isPerspectiveExcluded: (perspectiveId: string) => boolean
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  perspectiveStack: string[]
}

/**
 * @internal
 */
export interface PerspectiveOptions {
  /**
   * The perspective is normally determined by the router. The `perspectiveOverride` prop can be
   * used to explicitly set the perspective, overriding the perspective provided by the router.
   */
  perspectiveOverride?: string

  /**
   * The excluded perspective is normally determined by the router. The
   * `excludedPerspectivesOverride` prop can be used to explicitly set the excluded perspective,
   * overriding the excluded perspective provided by the router.
   */
  excludedPerspectivesOverride?: string[]
}

const EMPTY_ARRAY: string[] = []

/**
 * @internal
 */
export function usePerspective({
  perspectiveOverride,
  excludedPerspectivesOverride,
}: PerspectiveOptions = {}): PerspectiveValue {
  const router = useRouter()
  const {data: releases, archivedReleases, loading: releasesLoading} = useReleases()
  const selectedPerspectiveName = (perspectiveOverride ?? router.stickyParams.perspective) as
    | 'published'
    | ReleaseId
    | undefined

  const excludedPerspectives = useMemo(
    () =>
      excludedPerspectivesOverride ??
      (router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY),
    [excludedPerspectivesOverride, router.stickyParams.excludedPerspectives],
  )

  const setPerspective = useCallback(
    (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => {
      let perspectiveParam = ''

      if (!releaseId || releaseId === 'drafts') {
        perspectiveParam = ''
      } else if (releaseId === 'published' || releaseId.startsWith('r')) {
        perspectiveParam = releaseId
      } else {
        throw new Error(`Invalid releaseId: ${releaseId}`)
      }

      router.navigateStickyParams({
        excludedPerspectives: '',
        perspective: perspectiveParam,
      })
    },
    [router],
  )

  useEffect(() => {
    // clear the perspective param when it is not an active release
    if (
      releasesLoading ||
      !selectedPerspectiveName ||
      isPublishedPerspective(selectedPerspectiveName)
    )
      return
    const isCurrentPerspectiveValid = releases.some(
      (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedPerspectiveName,
    )
    if (!isCurrentPerspectiveValid) {
      setPerspective(LATEST)
    }
  }, [archivedReleases, selectedPerspectiveName, releases, releasesLoading, setPerspective])

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

  return useMemo(
    () => ({
      selectedPerspective,
      selectedPerspectiveName,
      selectedReleaseId: isSystemBundleName(selectedPerspectiveName)
        ? undefined
        : selectedPerspectiveName,
      perspectiveStack,
      setPerspective,
      toggleExcludedPerspective,
      isPerspectiveExcluded,
    }),
    [
      selectedPerspectiveName,
      setPerspective,
      toggleExcludedPerspective,
      selectedPerspective,
      perspectiveStack,
      isPerspectiveExcluded,
    ],
  )
}
