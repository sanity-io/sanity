import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {useActiveReleases} from '../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../releases/util/util'
import {useWorkspace} from '../studio/workspace'
import {useCardinalityOnePerspective} from './CardinalityOnePerspectiveContext'
import {type ReleaseId} from './types'

export function useSetPerspective() {
  const router = useRouter()
  const {data: releases} = useActiveReleases()
  const {setCardinalityOneReleaseId, cardinalityOneReleaseId} = useCardinalityOnePerspective()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const defaultPerspective = isDraftModelEnabled ? LATEST : PUBLISHED

  const setPerspective = useCallback(
    (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => {
      // Check if this is a cardinality one release
      const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId)

      if (release && isCardinalityOneRelease(release) && releaseId) {
        // CARDINALITY ONE RELEASE HANDLING:
        // Store in React state only (not URL) to keep URLs clean
        // This ensures cardinality one releases don't pollute browser history/bookmarks
        setCardinalityOneReleaseId(releaseId)
        router.navigate({
          stickyParams: {
            excludedPerspectives: null,
            perspective: '', // Remove perspective from URL - critical for clean URLs
          },
        })
        return
      }

      // REGULAR RELEASE HANDLING:
      // Clear any cardinality one selection when switching to other perspectives
      // This ensures we don't have conflicting perspective states
      if (cardinalityOneReleaseId) {
        setCardinalityOneReleaseId(null)
      }

      // For regular releases, use URL parameter as before (existing behavior)
      router.navigate({
        stickyParams: {
          excludedPerspectives: null,
          perspective: releaseId === defaultPerspective ? '' : releaseId,
        },
      })
    },
    [defaultPerspective, router, releases, setCardinalityOneReleaseId, cardinalityOneReleaseId],
  )
  return setPerspective
}
