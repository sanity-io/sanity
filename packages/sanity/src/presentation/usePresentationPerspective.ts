import {usePerspective} from 'sanity'

import {type PresentationPerspective} from './types'

/**
 * @internal
 */
export function usePresentationPerspective({
  scheduledDraft,
}: {
  scheduledDraft: string | undefined
}): PresentationPerspective {
  const {selectedPerspectiveName = 'drafts', selectedReleaseId, perspectiveStack} = usePerspective()

  const perspective = (
    selectedReleaseId || scheduledDraft
      ? [scheduledDraft, ...perspectiveStack]
      : selectedPerspectiveName
  ) as PresentationPerspective
  return perspective
}
