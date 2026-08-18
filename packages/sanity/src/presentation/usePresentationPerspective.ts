import {usePerspective} from 'sanity'

import {isAgentBundleName} from '../core/store/agent/createAgentBundlesStore'
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

  if (selectedReleaseId || scheduledDraft || isAgentBundleName(selectedPerspectiveName)) {
    if (scheduledDraft) {
      return [scheduledDraft, ...perspectiveStack]
    }
    return perspectiveStack
  }
  if (selectedPerspectiveName === 'published') {
    return 'published'
  }
  return 'drafts'
}
