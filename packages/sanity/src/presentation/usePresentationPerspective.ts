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

  return selectedReleaseId || scheduledDraft
    ? scheduledDraft
      ? [scheduledDraft, ...perspectiveStack]
      : perspectiveStack
    : selectedPerspectiveName === 'published'
      ? 'published'
      : 'drafts'
}
