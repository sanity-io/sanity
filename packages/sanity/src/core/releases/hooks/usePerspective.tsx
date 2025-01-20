import {type ReleaseId} from '@sanity/client'
import {Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {Translate} from '../../i18n/Translate'
import {type ReleaseDocument} from '../store/types'
import {useActiveReleases} from '../store/useActiveReleases'
import {useArchivedReleases} from '../store/useArchivedReleases'
import {LATEST} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {isPublishedPerspective} from '../util/util'
import {useSelectedPerspectiveProps} from './useSelectedPerspectiveProps'
import {getReleasesPerspectiveStack} from './utils'

/**
 * @internal
 */
export type SelectedPerspective = ReleaseDocument | 'published' | 'drafts'

/**
 * @internal
 */
export interface PerspectiveValue {
  /* Return the current global release */
  selectedPerspective: SelectedPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (perspectiveId: 'published' | 'drafts' | ReleaseId | undefined) => void
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  perspectiveStack: string[]
}

const EMPTY_ARRAY: string[] = []

/**
 * @internal
 */
export function usePerspective(): PerspectiveValue {
  const router = useRouter()
  const toast = useToast()
  const {t} = useTranslation()
  const {data: releases, loading: releasesLoading} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()
  const {selectedPerspectiveName} = useSelectedPerspectiveProps()

  const excludedPerspectives = useMemo(
    () => router.stickyParams.excludedPerspectives?.split(',') || EMPTY_ARRAY,
    [router.stickyParams.excludedPerspectives],
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
      const archived = archivedReleases.find(
        (r) => getReleaseIdFromReleaseDocumentId(r._id) === selectedPerspectiveName,
      )

      toast.push({
        id: `bundle-deleted-toast-${selectedPerspectiveName}`,
        status: 'warning',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey={
                archived
                  ? 'release.toast.archived-release.title'
                  : 'release.toast.not-found-release.title'
              }
              values={{title: archived?.metadata?.title || selectedPerspectiveName}}
            />
          </Text>
        ),
        duration: 10000,
      })
    }
  }, [
    archivedReleases,
    selectedPerspectiveName,
    releases,
    releasesLoading,
    setPerspective,
    toast,
    t,
  ])

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

  return useMemo(
    () => ({
      selectedPerspective,
      perspectiveStack,

      setPerspective,
    }),
    [selectedPerspective, perspectiveStack, setPerspective],
  )
}
