import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {usePerspective} from '../../perspective/usePerspective'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isPausedCardinalityOneRelease} from '../../util/releaseUtils'

/**
 * Hook to check if the current perspective is viewing a paused scheduled draft.
 *
 * @returns Object containing isPaused boolean and the current release document (if any)
 * @internal
 */
export function usePausedScheduledDraft(): {
  isPaused: boolean
  currentRelease: ReleaseDocument | undefined
} {
  const {selectedReleaseId} = usePerspective()
  const {data: allReleases = []} = useActiveReleases()

  return useMemo(() => {
    const currentRelease = selectedReleaseId
      ? allReleases.find(
          (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedReleaseId,
        )
      : undefined

    return {
      isPaused: isPausedCardinalityOneRelease(currentRelease),
      currentRelease,
    }
  }, [selectedReleaseId, allReleases])
}
